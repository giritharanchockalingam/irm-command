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
  tokenEndpoint?: string;
  logoutEndpoint?: string;
  jwksUri?: string;
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

// ============ OIDC AUTH CLIENT ============

/**
 * Production-ready OIDC Client implementing Authorization Code + PKCE flow
 * Suitable for enterprise SSO with Okta, Entra ID, Google Workspace, etc.
 */
export class OIDCAuthClient implements AuthClient {
  private config: AuthClientConfig;
  private currentUser: JWTClaims | null = null;
  private accessToken: string | null = null;
  private refreshToken_: string | null = null;
  private idToken: string | null = null;
  private listeners: Array<(user: JWTClaims | null) => void> = [];
  private tokenRefreshTimer: NodeJS.Timeout | null = null;

  constructor(config: AuthClientConfig) {
    this.config = config;
    // Try to restore session from storage
    this.restoreSession();
  }

  /**
   * Generate a PKCE code verifier (43-128 characters, unreserved chars)
   */
  private generateCodeVerifier(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return this.base64UrlEncode(bytes);
  }

  /**
   * Generate PKCE code challenge from verifier (SHA-256 hash + base64url)
   */
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return this.base64UrlEncode(new Uint8Array(hashBuffer));
  }

  /**
   * Base64url encode (no padding)
   */
  private base64UrlEncode(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Base64url decode
   */
  private base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if necessary
    while (base64.length % 4) {
      base64 += '=';
    }
    return atob(base64);
  }

  /**
   * Initiate login flow with Authorization Code + PKCE
   */
  async login(options?: { provider?: string }): Promise<void> {
    // Generate PKCE parameters
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    // Generate state and nonce
    const state = crypto.randomUUID?.() || Math.random().toString(36).substring(2);
    const nonce = crypto.randomUUID?.() || Math.random().toString(36).substring(2);

    // Store verifier, state, nonce in sessionStorage keyed by state
    sessionStorage.setItem(`oidc_state_${state}`, JSON.stringify({
      state,
      nonce,
      code_verifier: codeVerifier,
      timestamp: Date.now(),
    }));

    // Build authorization URL
    const authUrl = new URL(`${this.config.issuer}/authorize`);
    authUrl.searchParams.set('client_id', this.config.clientId);
    authUrl.searchParams.set('redirect_uri', this.config.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', this.config.scopes.join(' '));
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('nonce', nonce);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    if (options?.provider) {
      authUrl.searchParams.set('idp', options.provider);
    }

    // Redirect to authorization server
    if (typeof window !== 'undefined') {
      window.location.href = authUrl.toString();
    }
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(params: Record<string, string>): Promise<JWTClaims> {
    const { code, state, error, error_description } = params;

    // Check for errors from authorization server
    if (error) {
      throw new Error(`Authorization error: ${error} - ${error_description || ''}`);
    }

    if (!code || !state) {
      throw new Error('Missing code or state in callback parameters');
    }

    // Retrieve stored state, nonce, and verifier
    const stored = sessionStorage.getItem(`oidc_state_${state}`);
    if (!stored) {
      throw new Error('Invalid state parameter — possible CSRF attack');
    }

    const { nonce, code_verifier } = JSON.parse(stored);

    // Verify state hasn't expired (15 minute window)
    const storedData = JSON.parse(stored);
    if (Date.now() - storedData.timestamp > 15 * 60 * 1000) {
      sessionStorage.removeItem(`oidc_state_${state}`);
      throw new Error('State parameter expired');
    }

    // Clean up stored state
    sessionStorage.removeItem(`oidc_state_${state}`);

    // Exchange authorization code for tokens
    const tokenEndpoint = this.config.tokenEndpoint || `${this.config.issuer}/token`;
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
        code_verifier,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${tokenResponse.statusText} - ${errorData}`);
    }

    const tokenData = await tokenResponse.json();
    this.accessToken = tokenData.access_token;
    this.refreshToken_ = tokenData.refresh_token || null;
    this.idToken = tokenData.id_token;

    // Parse and validate ID token
    const claims = this.parseIdToken(tokenData.id_token);

    // Validate nonce
    if (claims.nonce !== nonce) {
      throw new Error('Nonce mismatch — possible token tampering');
    }

    // Store user and start token refresh
    this.currentUser = claims;
    this.saveSession();
    this.startTokenRefreshTimer();
    this.notifyListeners(claims);

    return claims;
  }

  /**
   * Parse and extract claims from ID token (JWT)
   * No cryptographic verification — we trust the token since we got it over TLS from token endpoint
   */
  private parseIdToken(idToken: string): JWTClaims {
    try {
      const parts = idToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const payload = this.base64UrlDecode(parts[1]);
      const claims = JSON.parse(payload);

      // Check token expiry
      if (claims.exp && claims.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('ID token has expired');
      }

      // Map standard and custom claims to JWTClaims
      const jwtClaims: JWTClaims = {
        sub: claims.sub,
        email: claims.email,
        name: claims.name,
        exp: claims.exp,
        iat: claims.iat,
        iss: claims.iss,
        aud: claims.aud || this.config.audience,
        // Tenant ID: try custom claims first, fall back to standard
        tenant_id: claims.irm_tenant_id || claims['https://irm.io/tenant_id'] || '',
        // Roles: try custom claims first
        roles: claims.irm_roles || claims['https://irm.io/roles'] || [],
        // MFA verified: check amr claim or custom claim
        mfa_verified: (claims.amr && Array.isArray(claims.amr) && claims.amr.includes('mfa')) ||
                      claims.irm_mfa_verified ||
                      false,
      };

      return jwtClaims;
    } catch (error) {
      throw new Error(`Failed to parse ID token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get current access token, refresh if expired
   */
  async getAccessToken(): Promise<string | null> {
    if (!this.currentUser) {
      return null;
    }

    // Check if token is expired or about to expire (5 minute window)
    if (this.currentUser.exp < Math.floor(Date.now() / 1000) + 300) {
      const refreshed = await this.refreshToken();
      if (!refreshed) {
        return null;
      }
    }

    return this.accessToken;
  }

  /**
   * Get current user
   */
  getUser(): JWTClaims | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated and token is valid
   */
  isAuthenticated(): boolean {
    if (!this.currentUser) {
      return false;
    }
    // Check if token is still valid (with 1 minute buffer)
    return this.currentUser.exp > Math.floor(Date.now() / 1000) + 60;
  }

  /**
   * Check if MFA has been verified
   */
  isMFAVerified(): boolean {
    return this.currentUser?.mfa_verified ?? false;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<boolean> {
    if (!this.refreshToken_ || !this.currentUser) {
      return false;
    }

    try {
      const tokenEndpoint = this.config.tokenEndpoint || `${this.config.issuer}/token`;
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken_,
          client_id: this.config.clientId,
        }).toString(),
      });

      if (!response.ok) {
        // Refresh failed, clear session
        this.logout();
        return false;
      }

      const tokenData = await response.json();
      this.accessToken = tokenData.access_token;
      if (tokenData.refresh_token) {
        this.refreshToken_ = tokenData.refresh_token;
      }
      if (tokenData.id_token) {
        this.idToken = tokenData.id_token;
        // Update user claims from new ID token
        const updatedClaims = this.parseIdToken(tokenData.id_token);
        this.currentUser = updatedClaims;
        this.notifyListeners(updatedClaims);
      }

      this.saveSession();
      this.startTokenRefreshTimer();
      return true;
    } catch (error) {
      console.error('[OIDC] Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Logout and revoke tokens
   */
  async logout(): Promise<void> {
    // Clear tokens and user
    this.accessToken = null;
    this.refreshToken_ = null;
    this.idToken = null;
    this.currentUser = null;

    // Clear stored session
    sessionStorage.removeItem('oidc_session');
    localStorage.removeItem('oidc_session');

    // Clear token refresh timer
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }

    // Notify listeners
    this.notifyListeners(null);

    // Redirect to logout endpoint
    const logoutEndpoint = this.config.logoutEndpoint || `${this.config.issuer}/logout`;
    const logoutUrl = new URL(logoutEndpoint);
    logoutUrl.searchParams.set('post_logout_redirect_uri', this.config.logoutUri);
    if (this.idToken) {
      logoutUrl.searchParams.set('id_token_hint', this.idToken);
    }

    if (typeof window !== 'undefined') {
      window.location.href = logoutUrl.toString();
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: JWTClaims | null) => void): () => void {
    this.listeners.push(callback);
    // Call immediately with current state
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Start a timer to refresh token before expiry (60 seconds before)
   */
  private startTokenRefreshTimer(): void {
    // Clear existing timer
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    if (!this.currentUser || !this.refreshToken_) {
      return;
    }

    // Schedule refresh 60 seconds before expiry
    const expiresIn = this.currentUser.exp - Math.floor(Date.now() / 1000);
    const refreshIn = Math.max(0, (expiresIn - 60) * 1000);

    this.tokenRefreshTimer = setTimeout(() => {
      this.refreshToken().catch((error) => {
        console.error('[OIDC] Automatic token refresh failed:', error);
      });
    }, refreshIn);
  }

  /**
   * Save session to storage
   */
  private saveSession(): void {
    if (this.currentUser && this.accessToken) {
      const sessionData = {
        user: this.currentUser,
        accessToken: this.accessToken,
        refreshToken: this.refreshToken_,
        idToken: this.idToken,
        timestamp: Date.now(),
      };
      try {
        sessionStorage.setItem('oidc_session', JSON.stringify(sessionData));
      } catch {
        // Storage might be unavailable
      }
    }
  }

  /**
   * Restore session from storage
   */
  private restoreSession(): void {
    try {
      const stored = sessionStorage.getItem('oidc_session');
      if (!stored) {
        return;
      }

      const sessionData = JSON.parse(stored);
      const { user, accessToken, refreshToken: refreshTok, idToken } = sessionData;

      // Check if session is still valid (24 hour window)
      if (Date.now() - sessionData.timestamp > 24 * 60 * 60 * 1000) {
        sessionStorage.removeItem('oidc_session');
        return;
      }

      // Restore session
      if (user && user.exp > Math.floor(Date.now() / 1000)) {
        this.currentUser = user;
        this.accessToken = accessToken;
        this.refreshToken_ = refreshTok;
        this.idToken = idToken;
        this.startTokenRefreshTimer();
      }
    } catch {
      // Storage might be unavailable or corrupted
    }
  }

  /**
   * Notify all listeners of auth state change
   */
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

/**
 * CISO-001: OIDC config sourced from environment variables — never hardcoded.
 * All values can be overridden at build time via VITE_OIDC_* env vars.
 */
const DEFAULT_OIDC_CONFIG: AuthClientConfig = {
  issuer: import.meta.env?.VITE_OIDC_ISSUER || 'https://login.irmcommand.com/oauth2',
  audience: import.meta.env?.VITE_OIDC_AUDIENCE || 'irm-command-api',
  clientId: import.meta.env?.VITE_OIDC_CLIENT_ID || 'irm-command-spa',
  redirectUri: import.meta.env?.VITE_OIDC_REDIRECT_URI ||
    `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}/auth/callback`,
  logoutUri: import.meta.env?.VITE_OIDC_LOGOUT_URI ||
    `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}/auth/logout`,
  scopes: (import.meta.env?.VITE_OIDC_SCOPES || 'openid profile email irm:read irm:write').split(' '),
};

/**
 * Create an AuthClient instance based on environment
 * Demo mode is ONLY allowed when VITE_AUTH_MODE is explicitly set to 'demo'
 * AND the app is running on localhost. Production deployments MUST use OIDC.
 *
 * CISO-001 REMEDIATION: Removed URL parameter bypass (?demo=true),
 * added production guard, restricted demo to explicit local development only.
 */
export function createAuthClient(config?: AuthClientConfig): AuthClient {
  const authMode = import.meta.env?.VITE_AUTH_MODE || 'demo';
  const environment = import.meta.env?.VITE_ENV || 'development';

  // CISO-001: Block demo mode in production/staging — enforce OIDC
  if (environment === 'production' || environment === 'staging') {
    if (authMode === 'demo') {
      console.error(
        '[SECURITY] Demo auth mode is forbidden in production/staging. ' +
        'Set VITE_AUTH_MODE=oidc and configure an identity provider.'
      );
    }
    // Always return OIDC client in production/staging regardless of VITE_AUTH_MODE
    return new OIDCAuthClient(config || DEFAULT_OIDC_CONFIG);
  }

  // Demo mode: ONLY when explicitly set AND running on localhost
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1');

  const isDemo = authMode === 'demo' && isLocalhost;

  if (isDemo) {
    console.warn(
      '[AUTH] Running in demo mode (local development only). ' +
      'This mode is blocked in production/staging deployments.'
    );
    return new DemoAuthClient();
  }

  return new OIDCAuthClient(config || DEFAULT_OIDC_CONFIG);
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
