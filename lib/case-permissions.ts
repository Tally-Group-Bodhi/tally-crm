/**
 * Case pipeline RBAC: three roles — Admin, Case Manager, Case Agent.
 * Used to gate list views and case actions.
 */

export type CaseRoleId = "admin" | "case-manager" | "case-agent";

export interface CasePermissions {
  /** Can see All Cases, All Open, Unassigned, Recently Viewed */
  canViewAllCases: boolean;
  /** Can see Case Summary / reports */
  canViewCaseSummary: boolean;
  /** Can create a new case */
  canCreateCase: boolean;
  /** Can assign or reassign a case (Case Agent cannot) */
  canAssignCase: boolean;
  /** Can close a case */
  canCloseCase: boolean;
  /** Can delete a case (Case Agent cannot) */
  canDeleteCase: boolean;
  /** Can add notes and communications (when allowed by view — e.g. assigned only for agent) */
  canAddNotesAndComms: boolean;
  /** Can link / unlink related cases */
  canLinkCases: boolean;
  /** If false, user may only view/edit cases assigned to them */
  canViewAnyCase: boolean;
  /** Can add/delete users in Settings (Admin only) */
  canManageUsers: boolean;
  /** Can create/delete roles in Settings (Admin only) */
  canManageRoles: boolean;
}

const ADMIN_PERMISSIONS: CasePermissions = {
  canViewAllCases: true,
  canViewCaseSummary: true,
  canCreateCase: true,
  canAssignCase: true,
  canCloseCase: true,
  canDeleteCase: true,
  canAddNotesAndComms: true,
  canLinkCases: true,
  canViewAnyCase: true,
  canManageUsers: true,
  canManageRoles: true,
};

const CASE_MANAGER_PERMISSIONS: CasePermissions = {
  ...ADMIN_PERMISSIONS,
  canManageUsers: false,
  canManageRoles: false,
};

const CASE_AGENT_PERMISSIONS: CasePermissions = {
  canViewAllCases: false,
  canViewCaseSummary: true,
  canCreateCase: true,
  canAssignCase: false,
  canCloseCase: true,
  canDeleteCase: false,
  canAddNotesAndComms: true,
  canLinkCases: true,
  canViewAnyCase: false,
  canManageUsers: false,
  canManageRoles: false,
};

const ROLE_MAP: Record<CaseRoleId, CasePermissions> = {
  admin: ADMIN_PERMISSIONS,
  "case-manager": CASE_MANAGER_PERMISSIONS,
  "case-agent": CASE_AGENT_PERMISSIONS,
};

/**
 * Resolve role string (from user/API) to case role. Unknown roles get Case Agent–level access.
 */
export function getCaseRoleId(role: string): CaseRoleId {
  if (role === "admin") return "admin";
  if (role === "case-manager") return "case-manager";
  if (role === "case-agent") return "case-agent";
  return "case-agent";
}

/**
 * Returns case permissions for the given role (cases pipeline only).
 */
export function getCasePermissions(role: string): CasePermissions {
  const roleId = getCaseRoleId(role);
  return ROLE_MAP[roleId];
}

/**
 * Returns whether the current user can access this case (view/edit). For Case Agent, case must be assigned to them.
 */
export function canAccessCase(
  permissions: CasePermissions,
  caseOwner: string,
  currentUserName: string
): boolean {
  if (permissions.canViewAnyCase) return true;
  return caseOwner === currentUserName;
}
