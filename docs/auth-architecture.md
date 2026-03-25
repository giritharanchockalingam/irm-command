# Authentication & Authorization Architecture

**IRM Sentinel** - Enterprise GRC SaaS Platform
**Document Version**: 1.0
**Last Updated**: 2026-03-24
**Status**: Active

## 1. Executive Summary

IRM Sentinel implements a modern, enterprise-grade authentication architecture built on OpenID Connect (OIDC) as the primary protocol, with optional SAML support for legacy enterprise deployments. All users authenticate via their organization's identity provider (Okta, Entra ID / Azure AD, Google Workspace, etc.) using multi-factor authentication (MFA), with role-based access control (RBAC) enforced consistently across frontend and backend.

---

## 2. Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Enterprise Ecosystem                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Customer's Identity Provider (IdP)                      │  │
│  │  • Okta / Entra ID / Google Workspace / Custom SAML      │  │
│  │  • Centralized user directory                            │  │
│  │  • MFA enforcement (TOTP, WebAuthn, SMS)                 │  │
│  │  • SSO session management                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────┬────────────────────────────────────────────────────────┘
         │
         │ OIDC Auth Code Flow / SAML SSO
         │
         ▼
┌──────────────────────────────────────┐
│   IRM Sentinel Frontend (React)       │
│  ┌────────────────────────────────┐  │
│  │  AuthClient Interface          │  │
│  │  • DemoAuthClient (dev)        │  │
│  │  • OIDCAuthClient (prod)       │  │
│  │  • Handles token lifecycle     │  │
│  └────────────────────────────────┘  │
│                                       │
│  ┌────────────────────────────────┐  │
│  │  Protected Routes              │  │
│  │  • PrivateRoute wrapper        │  │
│  │  • Redirects to /login if no token
│  │  • Role-based route gating     │  │
│  └────────────────────────────────┘  │
└──────────┬───────────────────────────┘
           │
           │ Authorization: Bearer JWT
           │ Token refresh: Refresh token rotation
           │
           ▼
┌──────────────────────────────────────┐
│   IRM Sentinel API (Node.js)          │
│  ┌────────────────────────────────┐  │
│  │  JWT Validation Middleware     │  │
│  │  • Verify JWT signature (JWKS) │  │
│  │  • Check issuer / audience     │  │
│  │  • Extract claims              │  │
│  │  • Rate limit by tenantId      │  │
│  └────────────────────────────────┘  │
│                                       │
│  ┌────────────────────────────────┐  │
│  │  RBAC Middleware               │  │
│  │  • Map claims to permissions   │  │
│  │  • Enforce per-resource access │  │
│  │  • Audit all access            │  │
│  └────────────────────────────────┘  │
│                                       │
│  ┌────────────────────────────────┐  │
│  │  Business Logic                │  │
│  │  (Guards already enforced)     │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

---

## 3. Authentication Flows

### 3.1 SP-Initiated SSO (Recommended)

User starts at IRM Sentinel; IRM initiates authentication with customer's IdP.

```
User Browser          IRM Frontend       IRM API            Customer's IdP
    │                      │                  │                    │
    ├─ Visit /dashboard ───>│                  │                    │
    │                      │                  │                    │
    │                      ├─ Check token ────>│                    │
    │  (no token)          │  Missing/expired  │                    │
    │                      │<─────────────────│                    │
    │                      │ Redirect /login   │                    │
    │<─ Redirect /login ────│                  │                    │
    │                      │                  │                    │
    ├─ GET /login?redirect_uri=...>           │                    │
    │                      ├─ Generate auth req (PKCE + state) ───>│
    │  (OpenID Connect)    │   client_id, scope, nonce, code_challenge
    │<─ Redirect IdP ────────────────────────────────────────────>│
    │                      │                  │                    │
    │ (User logs in, MFA)  │                  │                    │
    │  at IdP              │                  │                    │
    │<─ Redirect /callback─────────────────────────────────────────│
    │  + code + state      │                  │                    │
    │                      │                  │                    │
    ├─ GET /callback?code=...&state=...>     │                    │
    │                      ├─ Exchange code for tokens ──────────>│
    │                      │  (PKCE validation)                    │
    │  (Backend call)      │<─ ID token, Access token, Refresh ───│
    │                      │ + user info (name, email, groups)    │
    │                      │                  │                    │
    │                      ├─ Create session  │                    │
    │                      │  Store refresh token (httpOnly cookie)│
    │                      │  Set access token (memory)            │
    │                      │                  │                    │
    │<─ Set-Cookie: session_id=...────────────                    │
    │  Redirect /dashboard (with access token in state)
    │                      │                  │                    │
    │ ─ Logged in! ────────>                  │                    │
```

**Implementation (Frontend):**
```typescript
// OIDCAuthClient handles SP-initiated flow
interface AuthClient {
  login(): Promise<void>;
  logout(): Promise<void>;
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  isAuthenticated(): boolean;
}

class OIDCAuthClient implements AuthClient {
  private clientId = 'irm-command-prod';
  private redirectUri = 'https://irm.company.com/auth/callback';
  private issuer = 'https://company.okta.com'; // Per-tenant

  login() {
    // Generate PKCE challenge
    const codeVerifier = generateRandomString(128);
    const codeChallenge = base64urlEncode(sha256(codeVerifier));
    const state = generateRandomString(32);
    const nonce = generateRandomString(32);

    sessionStorage.setItem('pkce_verifier', codeVerifier);
    sessionStorage.setItem('state', state);
    sessionStorage.setItem('nonce', nonce);

    // Redirect to IdP
    const authUrl = `${this.issuer}/oauth2/v1/authorize?` +
      `client_id=${this.clientId}&` +
      `response_type=code&` +
      `scope=openid profile email groups&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
      `code_challenge=${codeChallenge}&` +
      `code_challenge_method=S256&` +
      `state=${state}&` +
      `nonce=${nonce}`;

    window.location.href = authUrl;
  }

  async handleCallback(code: string, state: string) {
    // Verify state matches
    const savedState = sessionStorage.getItem('state');
    if (state !== savedState) throw new Error('Invalid state parameter');

    // Exchange code for tokens
    const response = await fetch('/api/auth/callback', {
      method: 'POST',
      credentials: 'include', // Include HttpOnly cookies
      body: JSON.stringify({
        code,
        codeVerifier: sessionStorage.getItem('pkce_verifier')
      })
    });

    const { accessToken, idToken } = await response.json();

    // Verify nonce in ID token
    const idTokenClaims = decodeJwt(idToken);
    const savedNonce = sessionStorage.getItem('nonce');
    if (idTokenClaims.nonce !== savedNonce) {
      throw new Error('Invalid nonce in ID token');
    }

    // Store access token in memory (never localStorage)
    this.accessToken = accessToken;
    sessionStorage.removeItem('pkce_verifier');
    sessionStorage.removeItem('state');
    sessionStorage.removeItem('nonce');
  }
}
```

### 3.2 IdP-Initiated SSO (Optional)

User starts at customer's IdP (e.g., Okta dashboard); clicks IRM Sentinel app tile.

```
User Browser          Customer's IdP      IRM Frontend       IRM API
    │                      │                   │                  │
    ├─ Click "IRM Sentinel"─>│                  │                  │
    │  app tile            │                   │                  │
    │                      ├─ POST /callback (SAML assertion)────>│
    │  (IdP initiates)     │   <samlResponse>  │                  │
    │                      │                   │                  │
    │<─ Redirect to /dashboard with access_token
    │                      │                   │                  │
    │ ─ Logged in! ────────>                   │                  │
```

**Use Case**: Enterprise with Okta or Azure AD; users navigate from corporate SSO portal

---

## 4. Session Lifecycle

```
Login                          Active Session                Logout
  │                                  │                          │
  ├─ User authenticates at IdP ─────>│ Token valid              │
  │                                  │ (JWT.exp = now + 3600s)  │
  ├─ Token issued (1h expiry)       │                          │
  │  + Refresh token (7d expiry)    │                          │
  │                                  │                          │
  ├─ Refresh Token stored           │ User idle (>55 min)      │
  │  (HttpOnly, Secure, SameSite)   │                          │
  │                                  ├─ Frontend detects       │
  │                                  │  expiry approaching     │
  │                                  │                          │
  │                                  ├─ POST /auth/refresh ───>│
  │                                  │  + Refresh token (cookie)
  │                                  │<─ New access token      │
  │                                  │  + New refresh token    │
  │                                  │  (rotation)             │
  │                                  │                          │
  │                                  ├─ User clicks logout ───>│
  │                                  │                          │
  │                                  ├─ DELETE /auth/session  │
  │                                  │  Clear cookies          │
  │                                  │  Revoke refresh token   │
  │                                  │  Call IdP logout (SLO)  │
  │                                  │<─ Redirect to /login    │
  │                                  │                          │
  │                                  │          │              │
  └──────────────────────────────────┴──────────┴──────────────┘
```

**Token Specifications:**

```typescript
interface AccessToken {
  sub: string;           // User ID
  email: string;
  tenantId: string;
  roles: string[];       // ['admin', 'auditor', ...]
  permissions: string[]; // ['controls:read', 'risks:write', ...]
  iat: number;           // Issued at
  exp: number;           // Expiry (1 hour from iat)
  iss: string;           // Issuer (customer's IdP)
  aud: 'irm-command';
}

interface RefreshToken {
  sub: string;
  tenantId: string;
  iat: number;
  exp: number;           // 7 days from iat
  iss: string;
  type: 'refresh';
  rotationCount: number; // Track rotation for security
}

interface IdToken {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  groups: string[];      // IdP groups (map to IRM roles)
  nonce: string;         // Prevents token replay
  iat: number;
  exp: number;
  iss: string;
  aud: 'irm-command';
}
```

---

## 5. Multi-Factor Authentication (MFA)

**Policy**: MFA is **mandatory for all users** of IRM Sentinel.

### MFA Enforcement
1. **Primary Enforcement**: At customer's IdP level (Okta, Entra ID, Google)
2. **IRM Verification**: Validate `amr` (Authentication Methods Reference) claim in ID token

```typescript
// Verify MFA enforced in access token
function validateMFA(idToken: DecodedIdToken): boolean {
  const authMethods = idToken.amr || [];
  // Ensure at least one secondary factor
  const mfaMethods = ['mfa', 'otp', 'webauthn', 'yubikey', 'push'];
  return authMethods.some(m => mfaMethods.includes(m));
}
```

### Step-Up MFA for High-Risk Actions
Certain actions require additional MFA challenge in IRM Sentinel frontend, even if user already authenticated:

**High-Risk Actions** (require step-up MFA):
- `admin:settings` - Change global configuration
- `admin:users` - Add/remove users or change roles
- `data:export` - Bulk export of risk/control data
- `audit:delete` - Delete audit logs
- `api:create` - Create API credentials

**Step-Up Flow:**

```typescript
interface RiskAction {
  permission: PermissionKey;
  requiresStepUpMFA: boolean;
}

// Check before allowing sensitive operation
async function executeRiskyAction<T>(
  action: RiskAction,
  handler: () => Promise<T>
): Promise<T> {
  if (action.requiresStepUpMFA) {
    // Prompt for MFA challenge
    const mfaVerified = await promptMFAChallenge();
    if (!mfaVerified) throw new Error('MFA verification failed');
  }
  return handler();
}

// Step-up MFA endpoint
POST /api/auth/mfa-challenge
  Request: { action: 'admin:settings', method: 'totp' }
  Response: { mfaToken: '<short-lived>', expiresIn: 300 }
```

---

## 6. SCIM Provisioning

**Purpose**: Automatically sync users and groups from customer's IdP to IRM Sentinel.

### SCIM Features
- **User Provisioning**: Auto-create IRM user when hired in Okta/Entra
- **User Updates**: Sync profile changes (email, name, department)
- **User Deactivation**: Deactivate IRM access when terminated in IdP
- **Group Mapping**: Map IdP groups to IRM roles (e.g., "compliance-team" → "compliance_manager" role)

**Implementation (Backend API):**

```typescript
// SCIM endpoints (protected by OAuth Bearer token from IdP)
POST /scim/v2/Users
  Request: {
    externalId: 'okta-user-123',
    userName: 'alice@company.com',
    emails: [{ value: 'alice@company.com', primary: true }],
    displayName: 'Alice Smith',
    active: true,
    groups: ['okta-group-compliance-team', 'okta-group-audit']
  }
  Response: { id: 'irm-user-456', externalId: 'okta-user-123', ... }

PATCH /scim/v2/Users/:id
  Request: { emails: [{ value: 'alice.smith@company.com' }] }
  Response: { id: 'irm-user-456', ... }

POST /scim/v2/Groups
  Request: {
    externalId: 'okta-group-compliance-team',
    displayName: 'Compliance Team',
    members: [{ value: 'irm-user-456' }]
  }
  Response: { id: 'irm-group-789', ... }

// Group-to-role mapping (configured per tenant)
PATCH /api/tenants/{{tenantId}}/group-role-mapping
  Request: {
    mappings: [
      { idpGroup: 'okta-group-compliance-team', irmRole: 'compliance_manager' },
      { idpGroup: 'okta-group-audit', irmRole: 'auditor' },
      { idpGroup: 'okta-group-admins', irmRole: 'admin' }
    ]
  }
```

---

## 7. Frontend Integration

### AuthClient Interface

```typescript
// Abstraction layer allows different auth implementations
interface AuthClient {
  // Login/logout
  login(tenantId: string): Promise<void>;
  logout(): Promise<void>;

  // Token management
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  refreshAccessToken(): Promise<string>;

  // Auth state
  isAuthenticated(): boolean;
  getCurrentUser(): User | null;
  getUserRoles(): string[];
  hasPermission(permission: string): boolean;

  // Events
  onTokenRefreshed: Event<string>;
  onSessionExpired: Event<void>;
}

// Development: mock auth
class DemoAuthClient implements AuthClient {
  private currentUser: User = {
    id: 'demo-user-1',
    email: 'demo@example.com',
    roles: ['admin'],
    tenantId: 'demo-tenant'
  };

  isAuthenticated() { return true; }
  getCurrentUser() { return this.currentUser; }
  // ... mock implementations
}

// Production: real OIDC
class OIDCAuthClient implements AuthClient {
  // ... real implementation (see SP-Initiated SSO section)
}

// Usage in React
function useAuth() {
  const [authClient] = useState(() =>
    process.env.REACT_APP_AUTH_MODE === 'demo'
      ? new DemoAuthClient()
      : new OIDCAuthClient()
  );
  return authClient;
}

// Protected route component
function PrivateRoute({ component: Component, requiredRoles }: Props) {
  const auth = useAuth();

  if (!auth.isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  if (requiredRoles && !requiredRoles.every(r => auth.getUserRoles().includes(r))) {
    return <Navigate to="/unauthorized" />;
  }

  return <Component />;
}
```

---

## 8. Backend Token Validation

### JWKS Endpoint & Caching

```typescript
import jwksClient from 'jwks-rsa';

// Initialize JWKS client (caches keys, fetches on rotation)
const jwksClients = new Map<string, jwksClient.JwksClient>();

function getJwksClient(issuer: string) {
  if (!jwksClients.has(issuer)) {
    jwksClients.set(issuer, jwksClient({
      jwksUri: `${issuer}/.well-known/jwks.json`,
      cache: true,
      cacheMaxAge: 3600000, // 1 hour
      rateLimit: true,
      jwksRequestsPerMinute: 10
    }));
  }
  return jwksClients.get(issuer)!;
}

// Middleware: validate JWT
export async function validateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.substring(7);

  try {
    // Decode without verification to get header/issuer
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) throw new Error('Invalid token format');

    const { header, payload } = decoded;
    const tenantIssuer = payload.iss;

    // Get signing key from IdP's JWKS endpoint
    const jwksClient = getJwksClient(tenantIssuer);
    const signingKey = await jwksClient.getSigningKey(header.kid);

    // Verify signature + claims
    const verified = jwt.verify(token, signingKey.getPublicKey(), {
      issuer: tenantIssuer,
      audience: 'irm-command',
      algorithms: ['RS256']
    }) as AccessToken;

    // Attach to request
    req.user = {
      id: verified.sub,
      email: verified.email,
      tenantId: verified.tenantId,
      roles: verified.roles,
      permissions: verified.permissions
    };

    next();
  } catch (error) {
    console.error('JWT validation failed:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Usage
app.use(validateJWT);

// Route-level permission check
app.post('/api/controls', requirePermission('controls:write'), (req, res) => {
  // Only users with 'controls:write' permission reach here
});
```

---

## 9. Configuration Snippets

### Okta OIDC Configuration

```typescript
// .env or config file
OIDC_ISSUER=https://company.okta.com
OIDC_CLIENT_ID=0oabcdef1234567890
OIDC_CLIENT_SECRET=<stored in AWS Secrets Manager>
OIDC_REDIRECT_URI=https://irm.company.com/auth/callback

// Okta app configuration (in Okta Admin Console)
Application Type: Web
Sign-on Method: OIDC / OpenID Connect
Scopes: openid, profile, email, groups
Claim Mappings:
  - tenantId: custom attribute (mapped from Okta)
  - roles: from IdP groups (via group-role mapping)
  - permissions: computed server-side from roles
```

### Entra ID (Azure AD) OIDC Configuration

```typescript
OIDC_ISSUER=https://login.microsoftonline.com/<tenant-id>/v2.0
OIDC_CLIENT_ID=<application-id>
OIDC_CLIENT_SECRET=<client-secret>
OIDC_REDIRECT_URI=https://irm.company.com/auth/callback

// Graph API for SCIM (Azure AD → IRM)
SCIM_BEARER_TOKEN=<from Azure portal>
```

### Google Workspace OIDC Configuration

```typescript
OIDC_ISSUER=https://accounts.google.com
OIDC_CLIENT_ID=<project-id>.apps.googleusercontent.com
OIDC_CLIENT_SECRET=<client-secret>
OIDC_REDIRECT_URI=https://irm.company.com/auth/callback

// Scopes: openid, email, profile, groups (via Google Admin API)
```

### SAML Metadata Example (Legacy Support)

```xml
<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata">
  <SPSSODescriptor AuthnRequestsSigned="true"
                   WantAssertionsSigned="true"
                   protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">

    <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
                         Location="https://irm.company.com/auth/saml/logout"/>

    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                              Location="https://irm.company.com/auth/saml/acs"
                              index="1" isDefault="true"/>

    <KeyDescriptor use="signing">
      <KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
        <X509Data>
          <X509Certificate>...</X509Certificate>
        </X509Data>
      </KeyInfo>
    </KeyDescriptor>
  </SPSSODescriptor>
</EntityDescriptor>
```

---

## 10. Error Handling

| Scenario | Error Code | User Message | Backend Action |
|----------|-----------|--------------|----------------|
| Invalid credentials | 401 Unauthorized | "Invalid email or password" | Log attempt; check for brute force |
| Expired access token | 401 Unauthorized | "Session expired; please log in again" | Trigger token refresh; if fails, redirect to /login |
| Expired refresh token | 401 Unauthorized | "Please log in again" | Clear cookies; redirect to /login |
| IdP unavailable | 503 Service Unavailable | "Authentication service unavailable" | Return cached user claims (if available); log incident |
| Invalid JWT signature | 401 Unauthorized | "Session invalid" | Rotate JWKS keys; force re-login |
| Missing required claim | 401 Unauthorized | "Insufficient permissions" | Audit log; contact tenant admin |
| SCIM sync failure | 500 | (internal) | Retry with exponential backoff; alert Ops |
| MFA challenge timeout | 408 Request Timeout | "MFA challenge expired; try again" | Prompt for new challenge |

---

## 11. Security Considerations

- **PKCE (Proof Key for Code Exchange)**: Required for all OAuth flows (prevents authorization code interception)
- **State Parameter**: Prevents CSRF attacks on callback
- **Nonce**: Prevents replay attacks on ID tokens
- **HttpOnly Cookies**: Refresh tokens stored in HttpOnly, Secure, SameSite=Strict cookies (not accessible to JavaScript)
- **Access Token Storage**: In-memory only (cleared on page reload for SPAs)
- **Token Rotation**: Refresh token rotated on each use; old token revoked
- **No Token Logging**: Access tokens never logged; only masked in traces
- **Per-Tenant IdP Config**: Each tenant can configure their own IdP URL (Okta, Entra, etc.)
- **CORS**: Restricted to known IRM Sentinel domains only

---

## 12. Roadmap

| Feature | Status | Target Date |
|---------|--------|------------|
| OIDC (all major IdPs) | ✓ Implemented | 2026-01 |
| SAML 2.0 (legacy) | ✓ Implemented | 2026-01 |
| SCIM provisioning | ✓ Implemented | 2026-02 |
| WebAuthn support | Planned | 2026-04 |
| Conditional access (risk-based) | Planned | 2026-06 |
| Cross-IdP federation | Planned | 2026-09 |

**Next Review**: 2026-06-24
