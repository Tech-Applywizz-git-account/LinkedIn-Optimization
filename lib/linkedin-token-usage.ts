import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

type UsageContext = { userId: string; email: string };
export type AzureTokenUsageInput = {
  taskType: string; model: string; deploymentName?: string;
  azureRequestId?: string | null; inputTokens: number; outputTokens: number;
  completionTokens: number; responseTimeMs?: number;
};

let adminClient: SupabaseClient | null = null;
function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!adminClient) adminClient = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  return adminClient;
}

async function getUsageContext(): Promise<UsageContext | null> {
  const client = getAdminClient();
  if (!client) { console.error("LinkedIn token usage skipped: Supabase server credentials are missing"); return null; }
  const sessionToken = (await cookies()).get("auth_session")?.value;
  if (!sessionToken) return null;
  const payload = await verifyToken(sessionToken);
  const email = payload?.email?.trim().toLowerCase();
  if (!email) return null;
  // This application has no Supabase auth.users record. The custom email is
  // the stable authenticated user identifier used by the aggregation key.
  return { userId: email, email };
}
export async function recordLinkedInTokenUsage(input: AzureTokenUsageInput) {
  try {
    const context = await getUsageContext();
    if (!context) return;
    const client = getAdminClient();
    if (!client) return;
    const { error } = await client.rpc("record_linkedin_token_usage", {
      p_user_id: context.userId, p_email: context.email, p_task_type: input.taskType,
      p_model: input.model, p_deployment_name: input.deploymentName || null,
      p_azure_request_id: input.azureRequestId || null,
      p_input_tokens: Math.max(0, Math.trunc(input.inputTokens || 0)),
      p_output_tokens: Math.max(0, Math.trunc(input.outputTokens || 0)),
      p_completion_tokens: Math.max(0, Math.trunc(input.completionTokens || 0)),
      p_response_time_ms: input.responseTimeMs == null ? null : Math.max(0, Math.trunc(input.responseTimeMs)),
    });
    if (error) throw error;
  } catch (error) { console.error("Azure token usage recording failed:", error); }
}
