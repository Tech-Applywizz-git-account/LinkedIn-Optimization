import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export type AzureTokenUsageRow = {
  id: string;
  user_id: string | null;
  email: string;
  product: string;
  task_date: string;
  task_type: string;
  source: string;
  model: string;
  deployment_name: string | null;
  azure_request_id: string | null;
  total_input_tokens: number;
  total_output_tokens: number;
  total_completion_tokens: number;
  api_input_tokens_list: string;
  api_output_tokens_list: string;
  api_completion_tokens: string;
  response_time_ms: number | null;
  is_success: boolean;
  error_message: string | null;
  created_at: string;
};

type UsageContext = {
  userId: null;
  email: string;
};

export type AzureTokenUsageInput = {
  taskType: string;
  model: string;
  deploymentName?: string;
  azureRequestId?: string | null;
  inputTokens: number;
  outputTokens: number;
  completionTokens: number;
  responseTimeMs?: number;
};

let adminClient: SupabaseClient | null = null;

function getAdminClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!adminClient) {
    adminClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return adminClient;
}

async function getUsageContext(): Promise<UsageContext | null> {
  const client = getAdminClient();
  if (!client) {
    console.error("LinkedIn token usage skipped: Supabase server credentials are missing");
    return null;
  }
  const sessionToken = (await cookies()).get("auth_session")?.value;
  if (!sessionToken) return null;
  const payload = await verifyToken(sessionToken);
  const email = payload?.email?.trim().toLowerCase();
  if (!email) return null;

  // LinkedIn users authenticate with Email + OTP (no Supabase Auth UUID).
  // Therefore, user_id is strictly NULL, and normalized email is the identity.
  return { userId: null, email };
}

export async function recordLinkedInTokenUsage(input: AzureTokenUsageInput) {
  try {
    const context = await getUsageContext();
    if (!context) return;
    const client = getAdminClient();
    if (!client) return;

    // All NEW LinkedIn token usage records are stored in public.azure_token_usage
    // with user_id = NULL, product = 'linkedin_optimization', and normalized email.
    const { error } = await client.rpc("record_azure_token_usage", {
      p_user_id: null,
      p_email: context.email,
      p_product: "linkedin_optimization",
      p_task_type: input.taskType,
      p_model: input.model,
      p_deployment_name: input.deploymentName || null,
      p_azure_request_id: input.azureRequestId || null,
      p_input_tokens: Math.max(0, Math.trunc(input.inputTokens || 0)),
      p_output_tokens: Math.max(0, Math.trunc(input.outputTokens || 0)),
      p_completion_tokens: Math.max(0, Math.trunc(input.completionTokens || 0)),
      p_response_time_ms: input.responseTimeMs == null ? null : Math.max(0, Math.trunc(input.responseTimeMs)),
    });

    if (error) throw error;
  } catch (error) {
    console.error("Azure token usage recording failed:", error);
  }
}
