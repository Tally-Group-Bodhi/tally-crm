"use client";

import React from "react";
import {
  getCasePermissions,
  canAccessCase as checkCanAccessCase,
  type CasePermissions,
} from "@/lib/case-permissions";

export interface CrmUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface CrmUserContextValue {
  user: CrmUser | null;
  /** Case pipeline permissions for current user's role (Admin, Case Manager, Case Agent). */
  casePermissions: CasePermissions;
  /** Whether the current user can access this case (view/edit). For Case Agent, case must be assigned to them. */
  canAccessCase: (caseOwner: string) => boolean;
}

const CrmUserContext = React.createContext<CrmUserContextValue | null>(null);

const MOCK_USER: CrmUser = {
  id: "current",
  name: "John Smith",
  email: "john.smith@tally.com",
  role: "admin",
};

export function CrmUserProvider({ children }: { children: React.ReactNode }) {
  const [user] = React.useState<CrmUser | null>(MOCK_USER);

  const casePermissions = React.useMemo(
    () => (user ? getCasePermissions(user.role) : getCasePermissions("case-agent")),
    [user?.role]
  );

  const canAccessCase = React.useCallback(
    (caseOwner: string) =>
      user ? checkCanAccessCase(casePermissions, caseOwner, user.name) : false,
    [user, casePermissions]
  );

  const value: CrmUserContextValue = React.useMemo(
    () => ({
      user,
      casePermissions,
      canAccessCase,
    }),
    [user, casePermissions, canAccessCase]
  );

  return (
    <CrmUserContext.Provider value={value}>
      {children}
    </CrmUserContext.Provider>
  );
}

export function useCrmUser(): CrmUserContextValue {
  const ctx = React.useContext(CrmUserContext);
  if (!ctx) {
    return {
      user: null,
      casePermissions: getCasePermissions("case-agent"),
      canAccessCase: () => false,
    };
  }
  return ctx;
}
