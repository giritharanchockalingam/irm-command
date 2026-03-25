/**
 * AuthClient abstraction layer for IRM Command
 * Supports DemoAuth (prototype) and OIDC (production) implementations
 * Shaped for enterprise SSO with Okta, Entra ID, Google Workspace
 */

// ============ TYPES ============

export interface JWTClaims {
  sub: string;
  email: string;
  tenant_id: string;
  roles: string[];
  mfa_verified: boolean;
  name: string;
  exp: number;
  iat: number;
  iss: string;
  aud: string;
}

export interface AuthClientConfig {
  issuer: string;
  audience: string;
  clientId: string;
  redirectUri: string;
  logoutUri: string;
  scopes: string[];
}

export interface AuthClient {
  login(options?: { provider?: string }): Promise<void>;
  logout(): Promise<void>;
  handleCallback(params: Record<string, string>): Promise<JWTClaims>;
  getAccessToken(): Promise<string | null>;
  getUser(): JWTClaims | null;
  isAuthenticated(): boolean;
  isMFAVerified(): boolean;
  refreshToken(): Promise<boolean>;
  onAuthStateChange(callback: (user: JWTClaims | null) => void): () => void;
}

// ============ DEMO USERS ============

const DEMO_CLAIMS: Record<string, JWTClaims> = {
  'cro@irmcommand.demo': {
    sub: 'USR-001',
    email: 'cro@irmcommand.demo',
    tenant_id: 'TNT-001',
    roles: ['CRO'],
    mfa_verified: true,
    name: 'Sarah Chen',
    exp: Math.floor(Date.now() / 1000) + 86400,
    iat: Math.floor(Date.now() / 1000),
    iss: 'irm-command-demo',
    aud: 'irm-command',
  },
  'compliance@irmcommand.demo': {
    sub: 'USR-002',
    email: 'compliance@irmcommand.demo',
    tenant_id: 'TNT-001',
    roles: ['ComplianceOfficer'],
    mfa_verified: true,
    name: 'Michael Rodriguez',
    exp: Math.floor(Date.now() / 1000) + 86400,
    iat: Math.floor(Date.now() / 1000),
    iss: 'irm-command-demo',
    aud: 'irm-command',
  },
  'tprm@irmcommand.demo': {
    sub: 'USR-003',
    email: 'tprm@irmcommand.demo',
    tenant_id: 'TNT-001',
    roles: ['TPRMAnalyst'],
    mfa_verified: true,
    name: 'Jennifer Park',
    exp: Math.floor(Date.now() / 1000) + 86400,
    iat: Math.floor(Date.now() / 1000),
    iss: 'irm-command-demo',
    aud: 'irm-command',
  },
  'auditor@irmcommand.demo': {
    sub: 'USR-004',
    email: 'auditor@irmcommand.demo',
    tenant_id: 'TNT-001',
    roles: ['Auditor'],
    mfa_verified: true,
    name: 'David Thompson',
    exp: Math.floor(Date.now() / 1000) + 86400,
    iat: Math.floor(Date.now() / 1000),
    iss: 'irm-command-demo',
    aud: 'irm-command',
  },
  'examiner@irmcommand.demo': {
    sub: 'USR-005',
    email: 'examiner@irmcommand.demo',
    tenant_id: 'TNT-001',
    roles: ['ExaminerView'],
    mfa_verified: true,
    name: 'Lisa Anderson',
    exp: Math.floor(Date.now() / 1000) + 86400,
    iat: Math.floor(Date.now() / 1000),
    iss: 'irm-command-demo',
    aud: 'irm-command',
  },
  'admin@irmcommand.demo': {
    sub: 'USR-006',
    email: 'admin@irmcommand.demo',
    tenant_id: 'TNT-001',
    roles: ['RiskAdmin'],
    mfa_verified: true,
    name: 'Robert Martinez',
    exp: Math.floor(Date.now() / 1000) + 86400,
    iat: Math.floor(Date.now() / 1000),
    iss: 'irm-command-demo',
    aud: 'irm-command',
  },
};

// ============ DEMO AUTH CLIENT ============

export class DemoAuthClient implements AuthClient {
  private currentUser: JWTClaims | null = null;
  private listeners: Array<(user: JWTClaims | null) => void> = [];
  private defaultEmail: string;

  constructor(defaultEmail: string = 'cro@irmcommand.demo') {
    this.defaultEmail = defaultEmail;
    // Auto-login with default user
    this.currentUser = DEMO_CLAIMS[this.defaultEmail] || DEMO_CLAIMS['cro@irmcommand.demo'];
  }

  async login(options?: { provider?: string }): Promise<void> {
    const email = options?.provider || this.defaultEmail;
    const user = DEMO_CLAIMS[email] || DEMO_CLAIMS['cro@irmcommand.demo'];
    this.currentUser = {
      ...user,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    };
    this.notifyListeners();
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    this.notifyListeners();
  }

  async handleCallback(_params: Record<string, string>): Promise<JWTClaims> {
    if (!this.currentUser) {
      this.currentUser = DEMO_CLAIMS[this.defaultEmail];
    }
    return this.currentUser;
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.currentUser) return null;
    return `demo-token-${this.currentUser.sub}`;
  }

  getUser(): JWTClaims | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  isMFAVerified(): boolean {
    return this.currentUser?.mfa_verified ?? false;
  }

  async refreshToken(): Promise<boolean> {
    if (this.currentUser) {
      this.currentUser = {
        ...this.currentUser,
        exp: Math.floor(Date.now() / 1000) + 86400,
      };
      return true;
    }
    return false;
  }

  onAuthStateChange(callback: (user: JWTClaims | null) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /** Demo-specific: login as a specific demo user by email */
  loginAs(email: string): void {
    const user = DEMO_CLAIMS[email];
    if (user) {
      this.currentUser = {
        ...user,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
      };
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.currentUser);
      } catch {
        /* listener errors should not break auth */
      }
    }
  }
}

// ============ OIDC AUTH CLIENT STUB ============

/**
 * OIDC Auth Client Stub
 * Shaped for future integration with oidc-client-ts or @azure/msal-browser
 * All methods are realistic stubs that log what they would do in production
 */
export class OIDCAuthClientStub implements AuthClient {
  private config: AuthClientConfig;
  private listeners: Array<(user: JWTClaims | null) => void> = [];

  constructor(config: AuthClientConfig) {
    this.config = config;
  }

  async login(options?: { provider?: string }): Promise<void> {
    const authUrl = new URL(`${this.config.issuer}/authorize`);
    authUrl.searchParams.set('client_id', this.config.clientId);
    authUrl.searchParams.set('redirect_uri', this.config.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', this.config.scopes.join(' '));
    authUrl.searchParams.set('state', crypto.randomUUID?.() || Math.random().toString(36));

    if (options?.provider) {
      authUrl.searchParams.set('idp', options.provider);
    }

    console.warn(
      `[OIDC] Production login would redirect to:\n${authUrl.toString()}\n` +
      `Configure identity provider to complete SSO integration.`
    );
  }

  async logout(): Promise<void> {
    const logoutUrl = `${this.config.issuer}/logout?` +
      `client_id=${this.config.clientId}&` +
      `post_logout_redirect_uri=${encodeURIComponent(this.config.logoutUri)}`;

    console.warn(`[OIDC] Production logout would redirect to:\n${logoutUrl}`);
    this.notifyListeners(null);
  }

  async handleCallback(params: Record<string, string>): Promise<JWTClaims> {
    console.warn(
      `[OIDC] handleCallback received params:`,
      Object.keys(params),
      `\nIn production: exchange 'code' for tokens via ${this.config.issuer}/token`
    );
    throw new Error('OIDC not configured — connect to an identity provider (Okta, Entra ID, or Google Workspace)');
  }

  async getAccessToken(): Promise<string | null> {
    console.warn('[OIDC] getAccessToken: No token available — OIDC not configured');
    return null;
  }

  getUser(): JWTClaims | null {
    return null;
  }

  isAuthenticated(): boolean {
    return false;
  }

  isMFAVerified(): boolean {
    return false;
  }

  async refreshToken(): Promise<boolean> {
    console.warn('[OIDC] refreshToken: Cannot refresh — OIDC not configured');
    return false;
  }

  onAuthStateChange(callback: (user: JWTClaims | null) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners(user: JWTClaims | null): void {
    for (const listener of this.listeners) {
      try {
        listener(user);
      } catch {
        /* listener errors should not break auth */
      }
    }
  }
}

// ============ FACTORY ============

const DEFAULT_OIDC_CONFIG: AuthClientConfig = {
  issuer: 'https://login.irmcommand.com/oauth2',
  audience: 'irm-command-api',
  clientId: 'irm-command-spa',
  redirectUri: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}/auth/callback`,
  logoutUri: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}/auth/logout`,
  scopes: ['openid', 'profile', 'email', 'irm:read', 'irm:write'],
};

/**
 * Create an AuthClient instance based on environment
 * Prototype → DemoAuthClient (auto-login, fake tokens)
 * Production → OIDCAuthClientStub (realistic stubs for IdP integration)
 */
export function createAuthClient(config?: AuthClientConfig): AuthClient {
  // Check env var for auth mode (works on both localhost and Vercel)
  const authMode = import.meta.env?.VITE_AUTH_MODE || 'demo';

  // In demo/prototype mode, use demo auth (local, Vercel, or ?demo=true)
  const isDemo =
    authMode === 'demo' ||
    (typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
       window.location.hostname === '127.0.0.1' ||
       window.location.search.includes('demo=true')));

  if (isDemo) {
    return new DemoAuthClient();
  }

  return new OIDCAuthClientStub(config || DEFAULT_OIDC_CONFIG);
}

let authClientInstance: AuthClient | null = null;

/**
 * Get the singleton AuthClient instance
 */
export function getAuthClient(): AuthClient {
  if (!authClientInstance) {
    authClientInstance = createAuthClient();
  }
  return authClientInstance;
}
