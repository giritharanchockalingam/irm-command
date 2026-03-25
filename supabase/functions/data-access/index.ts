import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jwtDecode } from "https://esm.sh/jwt-decode@4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Allowed entity types for data access
const ALLOWED_ENTITIES = [
  "risks",
  "controls",
  "vendors",
  "issues",
  "kris",
  "loss_events",
  "regulatory_changes",
];

// RBAC permission matrix: entity -> allowedMethods
const RBAC_PERMISSIONS: Record<string, Record<string, string[]>> = {
  risks: {
    viewer: ["GET"],
    analyst: ["GET", "POST", "PUT"],
    admin: ["GET", "POST", "PUT", "DELETE"],
  },
  controls: {
    viewer: ["GET"],
    analyst: ["GET", "POST", "PUT"],
    admin: ["GET", "POST", "PUT", "DELETE"],
  },
  vendors: {
    viewer: ["GET"],
    analyst: ["GET"],
    admin: ["GET", "POST", "PUT", "DELETE"],
  },
  issues: {
    viewer: ["GET"],
    analyst: ["GET", "POST", "PUT"],
    admin: ["GET", "POST", "PUT", "DELETE"],
  },
  kris: {
    viewer: ["GET"],
    analyst: ["GET", "POST", "PUT"],
    admin: ["GET", "POST", "PUT", "DELETE"],
  },
  loss_events: {
    viewer: ["GET"],
    analyst: ["GET", "POST", "PUT"],
    admin: ["GET", "POST", "PUT", "DELETE"],
  },
  regulatory_changes: {
    viewer: ["GET"],
    analyst: ["GET", "POST"],
    admin: ["GET", "POST", "PUT", "DELETE"],
  },
};

interface JWTClaims {
  sub: string;
  tenant_id: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

interface DataAccessRequest {
  entity: string;
  action: string;
  data?: Record<string, unknown>;
  filters?: Record<string, unknown>;
  id?: string;
}

function extractAuthToken(req: Request): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

function validateJWT(token: string): JWTClaims | null {
  try {
    const decoded = jwtDecode<JWTClaims>(token);

    // Check expiration
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

function checkRBACPermission(
  entity: string,
  method: string,
  roles: string[]
): boolean {
  const entityPermissions = RBAC_PERMISSIONS[entity];
  if (!entityPermissions) {
    return false;
  }

  // Check if any of the user's roles has the required permission
  for (const role of roles) {
    const allowedMethods = entityPermissions[role] || [];
    if (allowedMethods.includes(method)) {
      return true;
    }
  }

  return false;
}

async function handleDataAccess(
  req: Request,
  body: DataAccessRequest,
  claims: JWTClaims
): Promise<Response> {
  const { entity, action, data, filters, id } = body;

  // Validate entity type
  if (!ALLOWED_ENTITIES.includes(entity)) {
    return new Response(
      JSON.stringify({
        error: "Invalid entity type",
        allowed: ALLOWED_ENTITIES,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Map HTTP method and check permissions
  const method = req.method;
  if (!checkRBACPermission(entity, method, claims.roles)) {
    return new Response(
      JSON.stringify({
        error: "Permission denied",
        required_role: "higher",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // Create Supabase client with service role (for tenant isolation enforcement)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    let result;

    switch (method) {
      case "GET": {
        // Read operation with tenant isolation
        let query = supabase
          .from(entity)
          .select("*")
          .eq("tenant_id", claims.tenant_id);

        // Apply additional filters if provided
        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            if (key !== "tenant_id") {
              query = query.eq(key, value);
            }
          }
        }

        // Filter by ID if provided
        if (id) {
          query = query.eq("id", id).single();
        }

        result = await query;
        break;
      }

      case "POST": {
        // Create operation
        if (!data) {
          return new Response(JSON.stringify({ error: "Missing data" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Enforce tenant_id in data
        const dataWithTenant = {
          ...data,
          tenant_id: claims.tenant_id,
          created_by: claims.sub,
          created_at: new Date().toISOString(),
        };

        result = await supabase.from(entity).insert([dataWithTenant]).select();
        break;
      }

      case "PUT": {
        // Update operation
        if (!id || !data) {
          return new Response(
            JSON.stringify({ error: "Missing id or data" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Verify record belongs to tenant
        const existing = await supabase
          .from(entity)
          .select("id")
          .eq("id", id)
          .eq("tenant_id", claims.tenant_id)
          .single();

        if (existing.error) {
          return new Response(
            JSON.stringify({ error: "Record not found" }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        const dataWithMeta = {
          ...data,
          updated_by: claims.sub,
          updated_at: new Date().toISOString(),
        };

        result = await supabase
          .from(entity)
          .update(dataWithMeta)
          .eq("id", id)
          .eq("tenant_id", claims.tenant_id)
          .select();
        break;
      }

      case "DELETE": {
        // Delete operation
        if (!id) {
          return new Response(JSON.stringify({ error: "Missing id" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Verify record belongs to tenant before deleting
        const existing = await supabase
          .from(entity)
          .select("id")
          .eq("id", id)
          .eq("tenant_id", claims.tenant_id)
          .single();

        if (existing.error) {
          return new Response(
            JSON.stringify({ error: "Record not found" }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        result = await supabase
          .from(entity)
          .delete()
          .eq("id", id)
          .eq("tenant_id", claims.tenant_id)
          .select();
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: { "Content-Type": "application/json" },
        });
    }

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result.data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": SUPABASE_URL,
      },
    });
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
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": SUPABASE_URL,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Extract and validate JWT token
  const token = extractAuthToken(req);
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing authorization token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const claims = validateJWT(token);
  if (!claims) {
    return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as DataAccessRequest;
    return await handleDataAccess(req, body, claims);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
