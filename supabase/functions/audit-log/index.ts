import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

interface AuditEvent {
  user_id: string;
  tenant_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  changes?: Record<string, unknown>;
  status: "success" | "failure";
  error_message?: string;
}

function anonymizeIP(ip: string): string {
  // Anonymize last octet of IP address
  const parts = ip.split(".");
  if (parts.length === 4) {
    parts[3] = "0";
    return parts.join(".");
  }
  // For IPv6 or invalid formats, return truncated version
  return ip.substring(0, ip.length - 5) + "xxxx";
}

function extractClientIP(req: Request): string {
  // Check X-Forwarded-For header first (used by proxies)
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  // Fall back to Deno connection info
  const addr = req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0";
  return addr;
}

function validateAuditEvent(event: unknown): event is AuditEvent {
  if (typeof event !== "object" || event === null) {
    return false;
  }

  const e = event as Record<string, unknown>;
  return (
    typeof e.user_id === "string" &&
    typeof e.tenant_id === "string" &&
    typeof e.action === "string" &&
    typeof e.entity_type === "string" &&
    (typeof e.status === "string" &&
      (e.status === "success" || e.status === "failure"))
  );
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": SUPABASE_URL,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Only allow POST for audit logging
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();

    // Validate event schema
    if (!validateAuditEvent(body)) {
      return new Response(
        JSON.stringify({
          error: "Invalid audit event schema",
          required_fields: [
            "user_id",
            "tenant_id",
            "action",
            "entity_type",
            "status",
          ],
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Extract and anonymize IP
    const clientIP = extractClientIP(req);
    const anonymizedIP = anonymizeIP(clientIP);

    // Create Supabase client with service role (bypasses RLS for audit logging)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Construct audit log entry with server-side metadata
    const auditEntry = {
      user_id: body.user_id,
      tenant_id: body.tenant_id,
      action: body.action,
      entity_type: body.entity_type,
      entity_id: body.entity_id || null,
      changes: body.changes || null,
      status: body.status,
      error_message: body.error_message || null,
      source_ip: anonymizedIP,
      created_at: new Date().toISOString(),
    };

    // Write to audit_log table with service role
    const result = await supabase
      .from("audit_log")
      .insert([auditEntry])
      .select();

    if (result.error) {
      return new Response(
        JSON.stringify({
          error: "Failed to write audit log",
          details: result.error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Audit event logged",
        event_id: result.data?.[0]?.id,
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": SUPABASE_URL,
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
