import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = process.env.DATABASE_URL || "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const cases = [
    {
      caseNumber: "BBMC-2026-001847",
      accountId: "acc-001",
      accountName: "Bowen Basin Mining Corp",
      type: "Complaint",
      subType: "Billing Dispute",
      status: "In Progress",
      priority: "High",
      slaStatus: "At Risk",
      slaDeadline: "12/02/2026 17:00",
      slaTimeRemaining: "1d 14h",
      owner: "Priya Sharma",
      team: "Large Market Support",
      createdDate: "07/02/2026",
      updatedDate: "10/02/2026",
      description:
        "Customer is disputing the January invoice for NMI 3012345678. They believe the demand charges are incorrect based on their contracted rate schedule.",
      resolution: "",
      communications: "[]",
      activities: "[]",
      attachments: "[]",
      relatedCases: "[]",
      pendingReason: null,
    },
    {
      caseNumber: "GAS-2026-001832",
      accountId: "acc-002",
      accountName: "Gladstone Aluminium Smelter",
      type: "EWR",
      subType: "Meter Replacement",
      status: "Pending",
      priority: "Medium",
      slaStatus: "On Track",
      slaDeadline: "20/02/2026 17:00",
      slaTimeRemaining: "10d 8h",
      owner: "Daniel Cooper",
      team: "Large Market Support",
      createdDate: "03/02/2026",
      updatedDate: "08/02/2026",
      description:
        "Embedded works request for meter replacement at NMI 3098765434. Current CT meter is due for scheduled replacement as per the compliance programme.",
      resolution: "",
      communications: "[]",
      activities: "[]",
      attachments: "[]",
      relatedCases: "[]",
      pendingReason: "3rd Party",
    },
    {
      caseNumber: "MSMO-2026-001790",
      accountId: "acc-003",
      accountName: "Mackay Sugar Mill Operations",
      type: "Enquiry",
      subType: "Rate Review",
      status: "New",
      priority: "Low",
      slaStatus: "On Track",
      slaDeadline: "17/02/2026 17:00",
      slaTimeRemaining: "7d 2h",
      owner: "John Smith",
      team: "Large Market Support",
      createdDate: "05/02/2026",
      updatedDate: "05/02/2026",
      description:
        "Customer requesting a review of their current rate schedule ahead of contract renewal in September 2027.",
      resolution: "",
      communications: "[]",
      activities: "[]",
      attachments: "[]",
      relatedCases: "[]",
      pendingReason: null,
    },
  ];

  for (const c of cases) {
    await prisma.case.upsert({
      where: { caseNumber: c.caseNumber },
      create: c,
      update: {},
    });
  }
  console.log("Seeded", cases.length, "cases");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
