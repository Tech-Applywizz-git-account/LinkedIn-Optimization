create table if not exists public.linkedin_token_usage (
    id uuid primary key default gen_random_uuid(),
    user_id text not null,
    email text not null,
    task_date date not null default current_date,
    task_type text not null,
    source text default 'Azure OpenAI',
    model text not null,
    deployment_name text,
    azure_request_id text,
    total_input_tokens integer not null default 0,
    total_output_tokens integer not null default 0,
    total_completion_tokens integer not null default 0,
    api_input_tokens_list text not null default '',
    api_output_tokens_list text not null default '',
    api_completion_tokens text not null default '',
    response_time_ms integer,
    is_success boolean default true,
    error_message text,
    created_at timestamptz default timezone('utc', now())
);

create unique index if not exists idx_linkedin_token_usage_user_task_date on public.linkedin_token_usage (user_id, task_type, task_date);

create table if not exists public.linkedin_token_usage_requests (
    azure_request_id text primary key,
    created_at timestamptz not null default timezone('utc', now())
);

alter table public.linkedin_token_usage enable row level security;
alter table public.linkedin_token_usage_requests enable row level security;

-- The application uses a custom email/OTP session, not Supabase Auth.\n-- Access is therefore restricted to the server-side service-role RPC.\n
create or replace function public.record_linkedin_token_usage(
    p_user_id text, p_email text, p_task_type text, p_model text,
    p_deployment_name text, p_azure_request_id text,
    p_input_tokens integer, p_output_tokens integer, p_completion_tokens integer,
    p_response_time_ms integer, p_is_success boolean default true,
    p_error_message text default null, p_task_date date default current_date
) returns void language plpgsql security definer set search_path = public, auth as $$
declare
    v_inserted_request_id text;
    v_input integer := greatest(coalesce(p_input_tokens, 0), 0);
    v_output integer := greatest(coalesce(p_output_tokens, 0), 0);
    v_completion integer := greatest(coalesce(p_completion_tokens, 0), 0);
begin
    if p_azure_request_id is not null and length(trim(p_azure_request_id)) > 0 then
        insert into public.linkedin_token_usage_requests (azure_request_id) values (trim(p_azure_request_id))
        on conflict (azure_request_id) do nothing returning azure_request_id into v_inserted_request_id;
        if v_inserted_request_id is null then return; end if;
    end if;
    insert into public.linkedin_token_usage (
        user_id, email, task_date, task_type, source, model, deployment_name, azure_request_id,
        total_input_tokens, total_output_tokens, total_completion_tokens,
        api_input_tokens_list, api_output_tokens_list, api_completion_tokens,
        response_time_ms, is_success, error_message
    ) values (
        p_user_id, p_email, coalesce(p_task_date, current_date), p_task_type, 'Azure OpenAI', p_model,
        p_deployment_name, p_azure_request_id, v_input, v_output, v_completion,
        v_input::text, v_output::text, v_completion::text, p_response_time_ms,
        coalesce(p_is_success, true), p_error_message
    ) on conflict (user_id, task_type, task_date) do update set
        email = excluded.email, source = excluded.source, model = excluded.model,
        deployment_name = excluded.deployment_name, azure_request_id = excluded.azure_request_id,
        total_input_tokens = public.linkedin_token_usage.total_input_tokens + excluded.total_input_tokens,
        total_output_tokens = public.linkedin_token_usage.total_output_tokens + excluded.total_output_tokens,
        total_completion_tokens = public.linkedin_token_usage.total_completion_tokens + excluded.total_completion_tokens,
        api_input_tokens_list = case when public.linkedin_token_usage.api_input_tokens_list = '' then excluded.api_input_tokens_list else public.linkedin_token_usage.api_input_tokens_list || ',' || excluded.api_input_tokens_list end,
        api_output_tokens_list = case when public.linkedin_token_usage.api_output_tokens_list = '' then excluded.api_output_tokens_list else public.linkedin_token_usage.api_output_tokens_list || ',' || excluded.api_output_tokens_list end,
        api_completion_tokens = case when public.linkedin_token_usage.api_completion_tokens = '' then excluded.api_completion_tokens else public.linkedin_token_usage.api_completion_tokens || ',' || excluded.api_completion_tokens end,
        response_time_ms = excluded.response_time_ms, is_success = excluded.is_success, error_message = excluded.error_message;
end;
$$;

revoke all on function public.record_linkedin_token_usage(text, text, text, text, text, text, integer, integer, integer, integer, boolean, text, date) from public, anon, authenticated;
grant execute on function public.record_linkedin_token_usage(text, text, text, text, text, text, integer, integer, integer, integer, boolean, text, date) to service_role;

comment on column public.linkedin_token_usage.api_input_tokens_list is 'Comma-separated numeric input token values; never JSON or bracketed values';
comment on column public.linkedin_token_usage.api_output_tokens_list is 'Comma-separated numeric output token values; never JSON or bracketed values';
comment on column public.linkedin_token_usage.api_completion_tokens is 'Comma-separated numeric completion token values; never JSON or bracketed values';
