import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { mockCases } from "../lib/mock-data/cases";

const url = process.env.DATABASE_URL || "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

function toPrismaPayload(item: (typeof mockCases)[number]) {
  return {
    id: item.id,
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
    parentCaseId: item.parentCaseId ?? null,
    parentCaseNumber: item.parentCaseNumber ?? null,
    childCaseIds: item.childCaseIds ? JSON.stringify(item.childCaseIds) : null,
    pendingReason: item.pendingReason ?? null,
    descriptionHistory: item.descriptionHistory
      ? JSON.stringify(item.descriptionHistory)
      : null,
  };
}

async function main() {
  for (const c of mockCases) {
    const data = toPrismaPayload(c);
    await prisma.case.upsert({
      where: { caseNumber: c.caseNumber },
      create: data,
      update: data,
    });
  }
  console.log(`Seeded ${mockCases.length} cases`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
