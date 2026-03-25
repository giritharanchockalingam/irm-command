// User, Role, Permission model for IRM Command
// Defines the core security types and role-based access control

export type Role =
  | 'CRO'
  | 'RiskAdmin'
  | 'ComplianceOfficer'
  | 'TPRMAnalyst'
  | 'Auditor'
  | 'ExaminerView';

export type Permission =
  // Risk permissions
  | 'risk:read'
  | 'risk:write'
  | 'risk:delete'
  // Control permissions
  | 'control:read'
  | 'control:write'
  | 'control:delete'
  // Vendor/TPRM permissions
  | 'vendor:read'
  | 'vendor:write'
  | 'vendor:delete'
  // Issue permissions
  | 'issue:read'
  | 'issue:write'
  | 'issue:delete'
  // Compliance permissions
  | 'compliance:read'
  | 'compliance:write'
  // Workbench permissions
  | 'workbench:read'
  | 'workbench:execute'
  // Copilot/AI permissions
  | 'copilot:read'
  | 'copilot:interact'
  // Audit permissions
  | 'audit:read'
  | 'audit:export'
  // Admin permissions
  | 'admin:settings'
  | 'admin:users'
  // Exam/Reporting permissions
  | 'exam:view'
  | 'exam:generate';

export interface User {
  id: string;
  email: string;
  displayName: string;
  roles: Role[];
  tenantId: string;
  department: string;
  title: string;
  lastLogin: Date;
  isActive: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  sessionExpiresAt: Date | null;
}

/**
 * Role-to-permission mapping
 * Defines which permissions each role has access to
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // Chief Risk Officer - broad access, administrative controls
  CRO: [
    // All read permissions
    'risk:read',
    'control:read',
    'vendor:read',
    'issue:read',
    'compliance:read',
    'workbench:read',
    'copilot:read',
    'audit:read',
    // Write/execute permissions — CRO has full platform access
    'risk:write',
    'control:write',
    'compliance:write',
    'issue:write',
    'workbench:execute',
    'copilot:interact',
    'audit:export',
    // Exam and reporting
    'exam:view',
    'exam:generate',
    // Admin settings
    'admin:settings',
    'admin:users',
  ],

  // Risk Admin - full risk/control/issue management
  RiskAdmin: [
    // All risk permissions
    'risk:read',
    'risk:write',
    'risk:delete',
    // All control permissions
    'control:read',
    'control:write',
    'control:delete',
    // Issue management
    'issue:read',
    'issue:write',
    'issue:delete',
    // Vendor read-only
    'vendor:read',
    // Compliance read
    'compliance:read',
    // Workbench access
    'workbench:read',
    'workbench:execute',
    // Copilot access
    'copilot:read',
    'copilot:interact',
    // Audit log
    'audit:read',
  ],

  // Compliance Officer - compliance and control focus
  ComplianceOfficer: [
    // Compliance full access
    'compliance:read',
    'compliance:write',
    // Control management
    'control:read',
    'control:write',
    // Risk read-only
    'risk:read',
    // Vendor read-only
    'vendor:read',
    // Copilot access
    'copilot:read',
    'copilot:interact',
    // Audit read
    'audit:read',
    // Exam viewing
    'exam:view',
  ],

  // Third Party Risk Manager (TPRM) Analyst - vendor focus
  TPRMAnalyst: [
    // Vendor full access
    'vendor:read',
    'vendor:write',
    'vendor:delete',
    // Risk read-only
    'risk:read',
    // Control read-only
    'control:read',
    // Copilot access
    'copilot:read',
    'copilot:interact',
  ],

  // Auditor - read-only with audit export
  Auditor: [
    // All read-only permissions
    'risk:read',
    'control:read',
    'vendor:read',
    'issue:read',
    'compliance:read',
    'workbench:read',
    'copilot:read',
    // Audit with export capability
    'audit:read',
    'audit:export',
  ],

  // Examiner View - minimal read-only for regulatory exams
  ExaminerView: [
    // Minimal read-only permissions
    'risk:read',
    'control:read',
    'vendor:read',
    'compliance:read',
    // Exam viewing only
    'exam:view',
  ],
};

/**
 * Check if a user can perform a specific permission
 * @param user - The user object (can be null)
 * @param permission - The permission to check
 * @returns true if the user has the permission, false otherwise
 */
export function can(user: User | null, permission: Permission): boolean {
  if (!user || !user.isActive) {
    return false;
  }

  const userPermissions = getUserPermissions(user);
  return userPermissions.includes(permission);
}

/**
 * Check if a user has a specific role
 * @param user - The user object (can be null)
 * @param role - The role to check
 * @returns true if the user has the role, false otherwise
 */
export function hasRole(user: User | null, role: Role): boolean {
  if (!user || !user.isActive) {
    return false;
  }

  return user.roles.includes(role);
}

/**
 * Get all permissions for a user based on their roles
 * Deduplicates permissions across multiple roles
 * @param user - The user object (can be null)
 * @returns Array of all permissions the user has
 */
export function getUserPermissions(user: User | null): Permission[] {
  if (!user || !user.isActive) {
    return [];
  }

  const permissionSet = new Set<Permission>();

  // Collect all permissions from each role
  user.roles.forEach((role) => {
    const rolePerms = ROLE_PERMISSIONS[role] || [];
    rolePerms.forEach((perm) => permissionSet.add(perm));
  });

  return Array.from(permissionSet);
}

/**
 * Get a human-readable description of a permission
 * @param permission - The permission to describe
 * @returns A readable description
 */
export function getPermissionLabel(permission: Permission): string {
  const labels: Record<Permission, string> = {
    'risk:read': 'View Risks',
    'risk:write': 'Create/Edit Risks',
    'risk:delete': 'Delete Risks',
    'control:read': 'View Controls',
    'control:write': 'Create/Edit Controls',
    'control:delete': 'Delete Controls',
    'vendor:read': 'View Vendors',
    'vendor:write': 'Create/Edit Vendors',
    'vendor:delete': 'Delete Vendors',
    'issue:read': 'View Issues',
    'issue:write': 'Create/Edit Issues',
    'issue:delete': 'Delete Issues',
    'compliance:read': 'View Compliance',
    'compliance:write': 'Manage Compliance',
    'workbench:read': 'View Workbench',
    'workbench:execute': 'Execute Workbench Tools',
    'copilot:read': 'View Copilot',
    'copilot:interact': 'Interact with Copilot',
    'audit:read': 'View Audit Log',
    'audit:export': 'Export Audit Log',
    'admin:settings': 'Manage Settings',
    'admin:users': 'Manage Users',
    'exam:view': 'View Exams',
    'exam:generate': 'Generate Exams',
  };

  return labels[permission] || permission;
}

/**
 * Get a human-readable description of a role
 * @param role - The role to describe
 * @returns A readable description
 */
export function getRoleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    CRO: 'Chief Risk Officer',
    RiskAdmin: 'Risk Administrator',
    ComplianceOfficer: 'Compliance Officer',
    TPRMAnalyst: 'Third Party Risk Manager',
    Auditor: 'Internal Auditor',
    ExaminerView: 'Regulatory Examiner',
  };

  return labels[role] || role;
}

/**
 * Get the access level number for a role (higher = more privileged)
 * Useful for comparing role hierarchies
 * @param role - The role to evaluate
 * @returns Access level (0-5, higher is more privileged)
 */
export function getRoleAccessLevel(role: Role): number {
  const levels: Record<Role, number> = {
    CRO: 5,
    RiskAdmin: 4,
    ComplianceOfficer: 3,
    TPRMAnalyst: 2,
    Auditor: 1,
    ExaminerView: 0,
  };

  return levels[role] ?? 0;
}
