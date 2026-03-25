import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, Role, Permission, AuthState, can, hasRole, getUserPermissions } from './types';
import { getConfig, isPrototype } from '../config';

interface SecurityContextValue {
  authState: AuthState;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  can: (permission: Permission) => boolean;
  hasRole: (role: Role) => boolean;
  getPermissions: () => Permission[];
  isAuthenticated: boolean;
}

/**
 * Fake demo users for prototype mode
 * Used for testing different roles and permissions without backend auth
 */
const DEMO_USERS: Record<string, User> = {
  'cro@irmcommand.demo': {
    id: 'USR-001',
    email: 'cro@irmcommand.demo',
    displayName: 'Sarah Chen',
    roles: ['CRO'],
    tenantId: 'TNT-001',
    department: 'Risk Management',
    title: 'Chief Risk Officer',
    lastLogin: new Date(),
    isActive: true,
  },
  'compliance@irmcommand.demo': {
    id: 'USR-002',
    email: 'compliance@irmcommand.demo',
    displayName: 'Michael Rodriguez',
    roles: ['ComplianceOfficer'],
    tenantId: 'TNT-001',
    department: 'Compliance',
    title: 'Compliance Officer',
    lastLogin: new Date(),
    isActive: true,
  },
  'tprm@irmcommand.demo': {
    id: 'USR-003',
    email: 'tprm@irmcommand.demo',
    displayName: 'Jennifer Park',
    roles: ['TPRMAnalyst'],
    tenantId: 'TNT-001',
    department: 'Third Party Risk',
    title: 'TPRM Analyst',
    lastLogin: new Date(),
    isActive: true,
  },
  'auditor@irmcommand.demo': {
    id: 'USR-004',
    email: 'auditor@irmcommand.demo',
    displayName: 'David Thompson',
    roles: ['Auditor'],
    tenantId: 'TNT-001',
    department: 'Internal Audit',
    title: 'Internal Auditor',
    lastLogin: new Date(),
    isActive: true,
  },
  'examiner@irmcommand.demo': {
    id: 'USR-005',
    email: 'examiner@irmcommand.demo',
    displayName: 'Lisa Anderson',
    roles: ['ExaminerView'],
    tenantId: 'TNT-001',
    department: 'Regulatory Affairs',
    title: 'Regulatory Examiner',
    lastLogin: new Date(),
    isActive: true,
  },
  'admin@irmcommand.demo': {
    id: 'USR-006',
    email: 'admin@irmcommand.demo',
    displayName: 'Robert Martinez',
    roles: ['RiskAdmin'],
    tenantId: 'TNT-001',
    department: 'Risk Operations',
    title: 'Risk Administrator',
    lastLogin: new Date(),
    isActive: true,
  },
};

// Default to CRO for prototype demos
const DEFAULT_USER = DEMO_USERS['cro@irmcommand.demo'];

// Create context with undefined default (will error if used outside provider)
const SecurityContext = createContext<SecurityContextValue | undefined>(undefined);

interface SecurityProviderProps {
  children: ReactNode;
  autoLoginUser?: string;
}

/**
 * SecurityProvider component - wraps the app to provide authentication and authorization
 * For prototype mode, auto-logs in with DEFAULT_USER unless otherwise specified
 * For production, would integrate with actual SSO/auth backend
 */
export function SecurityProvider({
  children,
  autoLoginUser,
}: SecurityProviderProps) {
  // Auto-login with default user for prototype, or specified user
  const initialUser = isPrototype()
    ? autoLoginUser
      ? DEMO_USERS[autoLoginUser] || DEFAULT_USER
      : DEFAULT_USER
    : null;

  const [authState, setAuthState] = useState<AuthState>({
    user: initialUser,
    isAuthenticated: initialUser !== null,
    sessionExpiresAt: initialUser
      ? new Date(Date.now() + getConfig().security.sessionTimeoutMs)
      : null,
  });

  /**
   * Login handler - in prototype, looks up demo user by email
   * In production, would authenticate against backend
   */
  const login = useCallback(
    async (email: string, _password: string): Promise<boolean> => {
      // Prototype: just look up demo user by email
      if (isPrototype()) {
        const user = DEMO_USERS[email];
        if (user && user.isActive) {
          const updatedUser = { ...user, lastLogin: new Date() };
          setAuthState({
            user: updatedUser,
            isAuthenticated: true,
            sessionExpiresAt: new Date(
              Date.now() + getConfig().security.sessionTimeoutMs
            ),
          });
          return true;
        }
        return false;
      }

      // Production: would call actual auth backend
      console.warn('Login not implemented for non-prototype environments');
      return false;
    },
    []
  );

  /**
   * Logout handler - clears auth state
   */
  const logout = useCallback(() => {
    setAuthState({
      user: null,
      isAuthenticated: false,
      sessionExpiresAt: null,
    });
  }, []);

  /**
   * Check if current user has a specific permission
   */
  const canPerform = useCallback(
    (permission: Permission): boolean => {
      return can(authState.user, permission);
    },
    [authState.user]
  );

  /**
   * Check if current user has a specific role
   */
  const hasUserRole = useCallback(
    (role: Role): boolean => {
      return hasRole(authState.user, role);
    },
    [authState.user]
  );

  /**
   * Get all permissions for current user
   */
  const getPerms = useCallback((): Permission[] => {
    return getUserPermissions(authState.user);
  }, [authState.user]);

  const value: SecurityContextValue = {
    authState,
    currentUser: authState.user,
    login,
    logout,
    can: canPerform,
    hasRole: hasUserRole,
    getPermissions: getPerms,
    isAuthenticated: authState.isAuthenticated,
  };

  return (
    <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>
  );
}

/**
 * Hook to use the security context
 * Must be called within a SecurityProvider
 */
export function useSecurity(): SecurityContextValue {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within SecurityProvider');
  }
  return context;
}

/**
 * Component for gating UI elements based on permissions
 * Shows children only if user has the required permission
 */
interface RequirePermissionProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequirePermission({
  permission,
  children,
  fallback = null,
}: RequirePermissionProps) {
  const { can } = useSecurity();
  return can(permission) ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component for gating UI elements based on role
 * Shows children only if user has the required role
 */
interface RequireRoleProps {
  role: Role | Role[];
  children: ReactNode;
  fallback?: ReactNode;
  requireAll?: boolean;
}

export function RequireRole({
  role,
  children,
  fallback = null,
  requireAll = false,
}: RequireRoleProps) {
  const { hasRole, currentUser } = useSecurity();

  if (!currentUser) {
    return <>{fallback}</>;
  }

  const roles = Array.isArray(role) ? role : [role];

  const hasRequiredRoles = requireAll
    ? roles.every((r) => hasRole(r))
    : roles.some((r) => hasRole(r));

  return hasRequiredRoles ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component that shows fallback UI when user is not authenticated
 */
interface ProtectedProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedComponent({
  children,
  fallback = null,
}: ProtectedProps) {
  const { isAuthenticated } = useSecurity();
  return isAuthenticated ? <>{children}</> : <>{fallback}</>;
}

/**
 * HOC to wrap a component and require authentication
 * Passes useSecurity hook data as props to wrapped component
 */
export function withSecurity<P extends object>(
  Component: React.ComponentType<P & SecurityContextValue>
): React.FC<P> {
  return (props: P) => {
    const security = useSecurity();
    return <Component {...props} {...security} />;
  };
}
