/**
 * Prisma client singleton for case persistence.
 * Only used when DATABASE_URL is set (local). On Vercel, leave unset to use mock data.
 * Prisma 7 requires a driver adapter for SQLite.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import type { CaseItem } from "@/types/crm";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrisma(): PrismaClient | undefined {
  if (typeof process === "undefined" || !process.env.DATABASE_URL) return undefined;
  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient | undefined =
  globalForPrisma.prisma ?? createPrisma();

if (typeof process !== "undefined" && process.env.DATABASE_URL && prisma) {
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
}

export function useDatabase(): boolean {
  return typeof process !== "undefined" && !!process.env.DATABASE_URL;
}

/** Convert Prisma Case row to CaseItem for the app */
export function prismaCaseToCaseItem(row: {
  id: string;
  caseNumber: string;
  accountId: string;
  accountName: string;
  type: string;
  subType: string;
  status: string;
  priority: string;
  slaStatus: string;
  slaDeadline: string;
  slaTimeRemaining: string;
  owner: string;
  team: string;
  createdDate: string;
  updatedDate: string;
  description: string;
  resolution: string;
  communications: string | null;
  activities: string | null;
  attachments: string | null;
  relatedCases: string | null;
  pendingReason: string | null;
  descriptionHistory: string | null;
}): CaseItem {
  return {
    id: row.id,
    caseNumber: row.caseNumber,
    accountId: row.accountId,
    accountName: row.accountName,
    type: row.type as CaseItem["type"],
    subType: row.subType,
    status: row.status as CaseItem["status"],
    priority: row.priority as CaseItem["priority"],
    slaStatus: row.slaStatus as CaseItem["slaStatus"],
    slaDeadline: row.slaDeadline,
    slaTimeRemaining: row.slaTimeRemaining,
    owner: row.owner,
    team: row.team,
    createdDate: row.createdDate,
    updatedDate: row.updatedDate,
    description: row.description,
    resolution: row.resolution,
    communications: row.communications ? JSON.parse(row.communications) : [],
    activities: row.activities ? JSON.parse(row.activities) : [],
    attachments: row.attachments ? JSON.parse(row.attachments) : [],
    relatedCases: row.relatedCases ? JSON.parse(row.relatedCases) : [],
    ...(row.pendingReason && { pendingReason: row.pendingReason as CaseItem["pendingReason"] }),
    ...(row.descriptionHistory && { descriptionHistory: JSON.parse(row.descriptionHistory) as CaseItem["descriptionHistory"] }),
  };
}

/** Convert CaseItem to Prisma create/update payload (JSON fields as strings) */
export function caseItemToPrismaPayload(item: CaseItem) {
  return {
    caseNumber: item.caseNumber,
    accountId: item.accountId,
    accountName: item.accountName,
    type: item.type,
    subType: item.subType,
    status: item.status,
    priority: item.priority,
    slaStatus: item.slaStatus,
    slaDeadline: item.slaDeadline,
    slaTimeRemaining: item.slaTimeRemaining,
    owner: item.owner,
    team: item.team,
    createdDate: item.createdDate,
    updatedDate: item.updatedDate,
    description: item.description,
    resolution: item.resolution,
    communications: JSON.stringify(item.communications ?? []),
    activities: JSON.stringify(item.activities ?? []),
    attachments: JSON.stringify(item.attachments ?? []),
    relatedCases: JSON.stringify(item.relatedCases ?? []),
    pendingReason: item.pendingReason ?? null,
    descriptionHistory: item.descriptionHistory ? JSON.stringify(item.descriptionHistory) : null,
  };
}

/** Build Prisma update payload from partial CaseItem (only defined fields) */
export function caseItemPartialToPrismaUpdate(
  item: Partial<CaseItem>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const scalarKeys = [
    "caseNumber", "accountId", "accountName", "type", "subType", "status", "priority",
    "slaStatus", "slaDeadline", "slaTimeRemaining", "owner", "team",
    "createdDate", "updatedDate", "description", "resolution", "pendingReason",
  ] as const;
  for (const k of scalarKeys) {
    if (item[k] !== undefined) (out[k] as unknown) = item[k];
  }
  if (item.communications !== undefined) out.communications = JSON.stringify(item.communications);
  if (item.activities !== undefined) out.activities = JSON.stringify(item.activities);
  if (item.attachments !== undefined) out.attachments = JSON.stringify(item.attachments);
  if (item.relatedCases !== undefined) out.relatedCases = JSON.stringify(item.relatedCases);
  if (item.descriptionHistory !== undefined) out.descriptionHistory = item.descriptionHistory ? JSON.stringify(item.descriptionHistory) : null;
  return out;
}
