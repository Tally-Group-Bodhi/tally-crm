/**
 * In-memory store for cases created/updated in the current session when not using the database.
 * Allows the case list and case detail pages to share the same case data so that:
 * - New cases created on the list page are visible when opening the case detail.
 * - Edits and status changes (e.g. kanban) on list or detail stay in sync when navigating.
 */

import type { CaseItem } from "@/types/crm";

const sessionCases = new Map<string, CaseItem>();

export function getSessionCase(id: string): CaseItem | undefined {
  return sessionCases.get(id);
}

export function getAllSessionCases(): CaseItem[] {
  return Array.from(sessionCases.values());
}

export function setSessionCase(caseItem: CaseItem): void {
  sessionCases.set(caseItem.id, caseItem);
}

export function deleteSessionCase(id: string): void {
  sessionCases.delete(id);
}

/**
 * Merge mock cases with session cases. Session cases override by id; session-only cases are appended.
 * Use this as the single source of truth for the list page when useDb is false.
 */
export function mergeMockWithSession(mockCases: CaseItem[]): CaseItem[] {
  const byId = new Map<string, CaseItem>();
  for (const c of mockCases) byId.set(c.id, c);
  for (const c of sessionCases.values()) byId.set(c.id, c);
  return Array.from(byId.values());
}

/**
 * Resolve a case by id: session store first, then undefined (caller can fall back to mock getCaseById).
 */
export function getCaseByIdWithSession(id: string): CaseItem | undefined {
  return getSessionCase(id);
}
