import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { JWTClaims, getAuthClient, DemoAuthClient } from './AuthClient';
import { User, Role, Permission, can } from '../security/types';
import { getAuditLogger } from '../security/AuditLogger';

export interface AuthContextValue {
  user: User | null;
  claims: JWTClaims | null;
  isAuthenticated: boolean;
  isMFAVerified: boolean;
  isLoading: boolean;
  login: (options?: { provider?: string }) => Promise<void>;
  loginAs: (email: string) => void;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapClaimsToUser(claims: JWTClaims): User {
  return {
    id: claims.sub,
    email: claims.email,
    displayName: claims.name || claims.email,
    roles: (claims.roles || []) as Role[],
    tenantId: claims.tenant_id || 'TNT-001',
    department: 'Unknown',
    title: 'User',
    lastLogin: new Date(),
    isActive: true,
  };
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<JWTClaims | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMFAVerified, setIsMFAVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authClientRef = React.useRef(getAuthClient());

  // Handle claims update
  const handleClaimsUpdate = useCallback((newClaims: JWTClaims | null) => {
    if (newClaims) {
      const mappedUser = mapClaimsToUser(newClaims);
      setUser(mappedUser);
      setClaims(newClaims);
      setIsAuthenticated(true);
      setIsMFAVerified(newClaims.mfa_verified ?? false);
    } else {
      setUser(null);
      setClaims(null);
      setIsAuthenticated(false);
      setIsMFAVerified(false);
    }
  }, []);

  // Initialize and check existing session
  useEffect(() => {
    const authClient = authClientRef.current;

    try {
      const currentClaims = authClient.getUser();
      handleClaimsUpdate(currentClaims);
    } catch (err) {
      console.error('Auth initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize authentication');
    } finally {
      setIsLoading(false);
    }

    // Subscribe to state changes
    const unsubscribe = authClient.onAuthStateChange((newClaims) => {
      handleClaimsUpdate(newClaims);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [handleClaimsUpdate]);

  const login = useCallback(async (options?: { provider?: string }) => {
    try {
      setIsLoading(true);
      setError(null);
      await authClientRef.current.login(options);
      // For DemoAuthClient, state change fires synchronously via listener
      // For OIDC, redirect happens and state updates on callback
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  }, []);

  const loginAs = useCallback((email: string) => {
    const client = authClientRef.current;
    if (client instanceof DemoAuthClient) {
      client.loginAs(email);
    } else {
      console.warn('loginAs is only available in demo mode');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await authClientRef.current.logout();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextValue = {
    user,
    claims,
    isAuthenticated,
    isMFAVerified,
    isLoading,
    login,
    loginAs,
    logout,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface RequireAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireAuth({ children, fallback }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

/**
 * Hook that returns a function to execute permission-gated actions.
 * Automatically logs audit events for both granted and denied actions.
 */
export function useAuthorizedAction() {
  const { user } = useAuth();
  const auditLogger = getAuditLogger();

  return useCallback(
    (
      permission: Permission,
      action: () => void,
      entityType?: string,
      entityId?: string
    ) => {
      if (!user) {
        console.warn('Cannot execute authorized action: user not authenticated');
        auditLogger.logDenied({
          userId: 'anonymous',
          userEmail: 'unknown',
          tenantId: 'unknown',
          entityType: (entityType as any) || 'Setting',
          entityId: entityId || '',
          module: 'auth',
          metadata: { permission },
          deniedReason: 'User not authenticated',
        });
        return;
      }

      if (can(user, permission)) {
        action();
        auditLogger.log({
          userId: user.id,
          userEmail: user.email,
          tenantId: user.tenantId,
          action: 'VIEW',
          entityType: (entityType as any) || 'Setting',
          entityId: entityId || '',
          module: 'auth',
          metadata: { permission, granted: true },
          success: true,
        });
      } else {
        console.warn(`Permission denied: ${permission} for user ${user.id}`);
        auditLogger.logDenied({
          userId: user.id,
          userEmail: user.email,
          tenantId: user.tenantId,
          entityType: (entityType as any) || 'Setting',
          entityId: entityId || '',
          module: 'auth',
          metadata: { permission },
          deniedReason: 'Insufficient permissions',
        });
      }
    },
    [user, auditLogger]
  );
}
