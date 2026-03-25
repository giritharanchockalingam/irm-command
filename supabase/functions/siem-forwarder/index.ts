interface AuditEventForSIEM {
  user_id: string;
  tenant_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  status: "success" | "failure";
  error_message?: string;
  source_ip?: string;
  created_at: string;
}

interface SIEMBatchRequest {
  events: AuditEventForSIEM[];
}

function hashPII(value: string): string {
  // Simple hash function for PII anonymization
  // In production, use a proper cryptographic hash
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  return `hash_${btoa(String.fromCharCode(...new Uint8Array(data))).substring(0, 12)}`;
}

function anonymizeIP(ip: string): string {
  // Anonymize IP by removing last octet
  const parts = ip.split(".");
  if (parts.length === 4) {
    parts[3] = "0";
    return parts.join(".");
  }
  return ip.substring(0, Math.max(0, ip.length - 5)) + "xxxx";
}

function isSuspiciousIP(ip: string): boolean {
  // Detect private IP ranges
  const privateRanges = ["10.", "172.16.", "172.31.", "192.168.", "127."];
  return privateRanges.some((range) => ip.startsWith(range));
}

function formatCEF(event: AuditEventForSIEM): string {
  // CEF (Common Event Format) version 0
  // CEF:0|Vendor|Product|Version|SignatureID|Name|Severity|[Extension]

  const vendor = "IRM-Command";
  const product = "Security-Controls";
  const version = "1.0";
  const signatureID = `action_${event.action}`;
  const name = `${event.entity_type}_${event.action}_${event.status}`;

  // Severity: 0-10 (higher = more severe)
  const severity = event.status === "failure" ? "8" : "3";

  // Scrub PII from user_id (assuming email format)
  const scrubbedUserID = event.user_id.includes("@")
    ? hashPII(event.user_id)
    : event.user_id;

  // Anonymize source IP
  const scrubbedIP = event.source_ip
    ? anonymizeIP(event.source_ip)
    : "0.0.0.0";

  // Build CEF extension fields
  const extensions: Record<string, string> = {
    rt: new Date(event.created_at).getTime().toString(), // Receipt time in milliseconds
    src: scrubbedIP, // Source IP
    suser: scrubbedUserID, // Source user (scrubbed)
    cs1Label: "tenant_id",
    cs1: event.tenant_id,
    cs2Label: "entity_type",
    cs2: event.entity_type,
    cs3Label: "entity_id",
    cs3: event.entity_id || "N/A",
    msg: event.error_message || "No additional details",
    act: event.action, // Action
    outcome: event.status === "success" ? "success" : "failure", // Outcome
  };

  // Format extension as key=value pairs
  const extensionStr = Object.entries(extensions)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");

  return `CEF:0|${vendor}|${product}|${version}|${signatureID}|${name}|${severity}|${extensionStr}`;
}

async function forwardToSIEM(
  cefEvents: string[],
  siemWebhookURL: string
): Promise<boolean> {
  try {
    const payload = {
      timestamp: new Date().toISOString(),
      events: cefEvents,
      source: "irm-command",
      batch_size: cefEvents.length,
    };

    const response = await fetch(siemWebhookURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "IRM-Command-SIEM-Forwarder/1.0",
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error(
      "SIEM forwarding failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return false;
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Only allow POST for batch forwarding
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Get SIEM webhook URL from environment
    const siemWebhookURL = Deno.env.get("SIEM_WEBHOOK_URL");
    if (!siemWebhookURL) {
      return new Response(
        JSON.stringify({ error: "SIEM webhook not configured" }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = (await req.json()) as SIEMBatchRequest;

    // Validate request
    if (!Array.isArray(body.events) || body.events.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid request: events array required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Format events as CEF
    const cefEvents = body.events
      .filter((event) => {
        // Skip events from suspicious internal IPs to reduce noise
        if (event.source_ip && isSuspiciousIP(event.source_ip)) {
          return true; // Still include but flagged
        }
        return true;
      })
      .map((event) => formatCEF(event));

    // Forward to SIEM
    const forwardSuccess = await forwardToSIEM(cefEvents, siemWebhookURL);

    if (!forwardSuccess) {
      return new Response(
        JSON.stringify({
          error: "SIEM forwarding failed",
          attempted_count: cefEvents.length,
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        forwarded_count: cefEvents.length,
        message: `${cefEvents.length} events forwarded to SIEM`,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
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
