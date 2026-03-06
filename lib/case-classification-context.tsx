"use client";

import React from "react";
import { getInitialCaseGroups, type CaseGroupItem } from "@/lib/mock-data/case-types";

export interface CaseClassificationState {
  groups: CaseGroupItem[];
}

export interface CaseClassificationContextValue extends CaseClassificationState {
  setGroups: React.Dispatch<React.SetStateAction<CaseGroupItem[]>>;
  /** Lookup: group name -> type labels (for New Case dropdown) */
  getTypeLabelsByGroupName: (groupName: string) => string[];
  /** Lookup: group name -> case class (Enquiry, Onboarding, etc.) */
  getCaseClassByGroupName: (groupName: string) => string;
}

const CaseClassificationContext = React.createContext<CaseClassificationContextValue | null>(null);

export function CaseClassificationProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = React.useState<CaseGroupItem[]>(() => getInitialCaseGroups());

  const getTypeLabelsByGroupName = React.useCallback(
    (groupName: string) => {
      const g = groups.find((x) => x.name === groupName);
      return g?.types.map((t) => t.label) ?? [];
    },
    [groups]
  );

  const getCaseClassByGroupName = React.useCallback(
    (groupName: string) => {
      const g = groups.find((x) => x.name === groupName);
      return g?.caseClass ?? "Enquiry";
    },
    [groups]
  );

  const value: CaseClassificationContextValue = React.useMemo(
    () => ({
      groups,
      setGroups,
      getTypeLabelsByGroupName,
      getCaseClassByGroupName,
    }),
    [groups, getTypeLabelsByGroupName, getCaseClassByGroupName]
  );

  return (
    <CaseClassificationContext.Provider value={value}>
      {children}
    </CaseClassificationContext.Provider>
  );
}

export function useCaseClassification(): CaseClassificationContextValue | null {
  return React.useContext(CaseClassificationContext);
}
