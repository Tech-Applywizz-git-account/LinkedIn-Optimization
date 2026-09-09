-- Migration: Update public.azure_token_usage for shared product usage (Digital Resume & LinkedIn Optimization)
-- CRITICAL: Zero modifications to existing rows. Schema-only update.

-- 1. Ensure table public.azure_token_usage exists with required base columns
CREATE TABLE IF NOT EXISTS public.azure_token_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    email text,
    task_date date NOT NULL DEFAULT current_date,
    task_type text NOT NULL,
    source text DEFAULT 'Azure OpenAI',
    model text NOT NULL,
    deployment_name text,
    azure_request_id text,
    total_input_tokens integer NOT NULL DEFAULT 0,
    total_output_tokens integer NOT NULL DEFAULT 0,
    total_completion_tokens integer NOT NULL DEFAULT 0,
    api_input_tokens_list text NOT NULL DEFAULT '',
    api_output_tokens_list text NOT NULL DEFAULT '',
    api_completion_tokens text NOT NULL DEFAULT '',
    response_time_ms integer,
    is_success boolean DEFAULT true,
    error_message text,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- 2. Make user_id nullable to support LinkedIn users (who authenticate via email+OTP and have user_id = NULL)
ALTER TABLE public.azure_token_usage ALTER COLUMN user_id DROP NOT NULL;

-- 3. Add product column (schema-only; does NOT update existing rows)
ALTER TABLE public.azure_token_usage ADD COLUMN IF NOT EXISTS product text;

-- 4. Update task_type check constraint to support Digital Resume and LinkedIn Optimization task types
ALTER TABLE public.azure_token_usage DROP CONSTRAINT IF EXISTS azure_token_usage_task_type_check;

ALTER TABLE public.azure_token_usage ADD CONSTRAINT azure_token_usage_task_type_check CHECK (
    task_type IN (
        -- Digital Resume task types
        'generate_introduction',
        'resume_chat',
        'rerecording',
        -- LinkedIn Optimization task types
        'linkedin_headline_generation',
        'linkedin_about_generation',
        'linkedin_experience_optimization',
        'linkedin_internship_optimization',
        'linkedin_experience_company_selection',
        'linkedin_internship_company_selection',
        'linkedin_projects_optimization',
        'linkedin_education_optimization',
        'linkedin_education_item_generation',
        'linkedin_skills_optimization',
        'linkedin_certifications_optimization',
        'linkedin_banner_content_generation'
    )
);

-- 5. Create Partial Unique Indexes for each product without affecting historical unassigned data
CREATE UNIQUE INDEX IF NOT EXISTS idx_azure_token_usage_dr_user_task_date 
ON public.azure_token_usage (user_id, product, task_type, task_date) 
WHERE product = 'digital_resume';

CREATE UNIQUE INDEX IF NOT EXISTS idx_azure_token_usage_li_email_task_date 
ON public.azure_token_usage (email, product, task_type, task_date) 
WHERE product = 'linkedin_optimization';

-- 6. Request Idempotency tracking table
CREATE TABLE IF NOT EXISTS public.azure_token_usage_requests (
    azure_request_id text PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- 7. Enable RLS
ALTER TABLE public.azure_token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.azure_token_usage_requests ENABLE ROW LEVEL SECURITY;

-- 8. Atomic UPSERT Stored Procedure for token usage
CREATE OR REPLACE FUNCTION public.record_azure_token_usage(
    p_user_id uuid,
    p_email text,
    p_product text,
    p_task_type text,
    p_model text,
    p_deployment_name text,
    p_azure_request_id text,
    p_input_tokens integer,
    p_output_tokens integer,
    p_completion_tokens integer,
    p_response_time_ms integer,
    p_is_success boolean DEFAULT true,
    p_error_message text DEFAULT null,
    p_task_date date DEFAULT current_date
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
    v_inserted_request_id text;
    v_input integer := greatest(coalesce(p_input_tokens, 0), 0);
    v_output integer := greatest(coalesce(p_output_tokens, 0), 0);
    v_completion integer := greatest(coalesce(p_completion_tokens, 0), 0);
    v_email text := lower(trim(coalesce(p_email, '')));
    v_product text := lower(trim(coalesce(p_product, '')));
BEGIN
    -- Idempotency check: if request ID provided, prevent double processing
    IF p_azure_request_id IS NOT NULL AND length(trim(p_azure_request_id)) > 0 THEN
        INSERT INTO public.azure_token_usage_requests (azure_request_id) 
        VALUES (trim(p_azure_request_id))
        ON CONFLICT (azure_request_id) DO NOTHING 
        RETURNING azure_request_id INTO v_inserted_request_id;
        
        IF v_inserted_request_id IS NULL THEN 
            RETURN; -- Duplicate request ignored safely
        END IF;
    END IF;

    -- LinkedIn Optimization branch (user_id = NULL, aggregation key: email + product + task_type + task_date)
    IF v_product = 'linkedin_optimization' OR p_user_id IS NULL THEN
        INSERT INTO public.azure_token_usage (
            user_id, email, product, task_date, task_type, source, model, deployment_name, azure_request_id,
            total_input_tokens, total_output_tokens, total_completion_tokens,
            api_input_tokens_list, api_output_tokens_list, api_completion_tokens,
            response_time_ms, is_success, error_message
        ) VALUES (
            NULL, v_email, 'linkedin_optimization', coalesce(p_task_date, current_date), p_task_type, 'Azure OpenAI', p_model,
            p_deployment_name, p_azure_request_id, v_input, v_output, v_completion,
            v_input::text, v_output::text, v_completion::text, p_response_time_ms,
            coalesce(p_is_success, true), p_error_message
        ) ON CONFLICT (email, product, task_type, task_date) WHERE product = 'linkedin_optimization' DO UPDATE SET
            source = excluded.source,
            model = excluded.model,
            deployment_name = excluded.deployment_name,
            azure_request_id = excluded.azure_request_id,
            total_input_tokens = public.azure_token_usage.total_input_tokens + excluded.total_input_tokens,
            total_output_tokens = public.azure_token_usage.total_output_tokens + excluded.total_output_tokens,
            total_completion_tokens = public.azure_token_usage.total_completion_tokens + excluded.total_completion_tokens,
            api_input_tokens_list = CASE 
                WHEN public.azure_token_usage.api_input_tokens_list = '' THEN excluded.api_input_tokens_list 
                ELSE public.azure_token_usage.api_input_tokens_list || ',' || excluded.api_input_tokens_list 
            END,
            api_output_tokens_list = CASE 
                WHEN public.azure_token_usage.api_output_tokens_list = '' THEN excluded.api_output_tokens_list 
                ELSE public.azure_token_usage.api_output_tokens_list || ',' || excluded.api_output_tokens_list 
            END,
            api_completion_tokens = CASE 
                WHEN public.azure_token_usage.api_completion_tokens = '' THEN excluded.api_completion_tokens 
                ELSE public.azure_token_usage.api_completion_tokens || ',' || excluded.api_completion_tokens 
            END,
            response_time_ms = excluded.response_time_ms,
            is_success = excluded.is_success,
            error_message = excluded.error_message;

    -- Digital Resume branch (user_id = UUID, aggregation key: user_id + product + task_type + task_date)
    ELSE
        INSERT INTO public.azure_token_usage (
            user_id, email, product, task_date, task_type, source, model, deployment_name, azure_request_id,
            total_input_tokens, total_output_tokens, total_completion_tokens,
            api_input_tokens_list, api_output_tokens_list, api_completion_tokens,
            response_time_ms, is_success, error_message
        ) VALUES (
            p_user_id, v_email, 'digital_resume', coalesce(p_task_date, current_date), p_task_type, 'Azure OpenAI', p_model,
            p_deployment_name, p_azure_request_id, v_input, v_output, v_completion,
            v_input::text, v_output::text, v_completion::text, p_response_time_ms,
            coalesce(p_is_success, true), p_error_message
        ) ON CONFLICT (user_id, product, task_type, task_date) WHERE product = 'digital_resume' DO UPDATE SET
            email = excluded.email,
            source = excluded.source,
            model = excluded.model,
            deployment_name = excluded.deployment_name,
            azure_request_id = excluded.azure_request_id,
            total_input_tokens = public.azure_token_usage.total_input_tokens + excluded.total_input_tokens,
            total_output_tokens = public.azure_token_usage.total_output_tokens + excluded.total_output_tokens,
            total_completion_tokens = public.azure_token_usage.total_completion_tokens + excluded.total_completion_tokens,
            api_input_tokens_list = CASE 
                WHEN public.azure_token_usage.api_input_tokens_list = '' THEN excluded.api_input_tokens_list 
                ELSE public.azure_token_usage.api_input_tokens_list || ',' || excluded.api_input_tokens_list 
            END,
            api_output_tokens_list = CASE 
                WHEN public.azure_token_usage.api_output_tokens_list = '' THEN excluded.api_output_tokens_list 
                ELSE public.azure_token_usage.api_output_tokens_list || ',' || excluded.api_output_tokens_list 
            END,
            api_completion_tokens = CASE 
                WHEN public.azure_token_usage.api_completion_tokens = '' THEN excluded.api_completion_tokens 
                ELSE public.azure_token_usage.api_completion_tokens || ',' || excluded.api_completion_tokens 
            END,
            response_time_ms = excluded.response_time_ms,
            is_success = excluded.is_success,
            error_message = excluded.error_message;
    END IF;
END;
$$;

-- 9. Wrapper for record_linkedin_token_usage redirecting to azure_token_usage
CREATE OR REPLACE FUNCTION public.record_linkedin_token_usage(
    p_user_id text,
    p_email text,
    p_task_type text,
    p_model text,
    p_deployment_name text,
    p_azure_request_id text,
    p_input_tokens integer,
    p_output_tokens integer,
    p_completion_tokens integer,
    p_response_time_ms integer,
    p_is_success boolean DEFAULT true,
    p_error_message text DEFAULT null,
    p_task_date date DEFAULT current_date
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
    PERFORM public.record_azure_token_usage(
        p_user_id => NULL,
        p_email => coalesce(p_email, p_user_id),
        p_product => 'linkedin_optimization',
        p_task_type => p_task_type,
        p_model => p_model,
        p_deployment_name => p_deployment_name,
        p_azure_request_id => p_azure_request_id,
        p_input_tokens => p_input_tokens,
        p_output_tokens => p_output_tokens,
        p_completion_tokens => p_completion_tokens,
        p_response_time_ms => p_response_time_ms,
        p_is_success => p_is_success,
        p_error_message => p_error_message,
        p_task_date => p_task_date
    );
END;
$$;

-- 10. Grant Execute permissions strictly to service_role and revoke from anon/authenticated
REVOKE ALL ON FUNCTION public.record_azure_token_usage(uuid, text, text, text, text, text, text, integer, integer, integer, integer, boolean, text, date) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_azure_token_usage(uuid, text, text, text, text, text, text, integer, integer, integer, integer, boolean, text, date) TO service_role;

REVOKE ALL ON FUNCTION public.record_linkedin_token_usage(text, text, text, text, text, text, integer, integer, integer, integer, boolean, text, date) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_linkedin_token_usage(text, text, text, text, text, text, integer, integer, integer, integer, boolean, text, date) TO service_role;

-- 11. Comments for documentation
COMMENT ON COLUMN public.azure_token_usage.user_id IS 'Supabase Auth UUID for Digital Resume users; NULL for LinkedIn Optimization users';
COMMENT ON COLUMN public.azure_token_usage.email IS 'Normalized email address (lowercase and trimmed) for user identification and aggregation';
COMMENT ON COLUMN public.azure_token_usage.product IS 'Product identifier: digital_resume or linkedin_optimization';
COMMENT ON COLUMN public.azure_token_usage.api_input_tokens_list IS 'Comma-separated numeric input token values; never JSON or bracketed values';
COMMENT ON COLUMN public.azure_token_usage.api_output_tokens_list IS 'Comma-separated numeric output token values; never JSON or bracketed values';
COMMENT ON COLUMN public.azure_token_usage.api_completion_tokens IS 'Comma-separated numeric completion token values; never JSON or bracketed values';

