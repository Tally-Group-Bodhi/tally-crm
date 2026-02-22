import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { prisma, useDatabase, prismaCaseToCaseItem } from "@/lib/db";
import {
  UPLOADS_DIR,
  attachmentTypeFromFileName,
  formatFileSize,
  sanitizeFileName,
} from "@/lib/attachments";
import type { Attachment } from "@/types/crm";

export const dynamic = "force-dynamic";

const DEFAULT_UPLOADED_BY = "Current User";

/** POST /api/cases/[id]/attachments — upload one or more files for a case */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!useDatabase() || !prisma) {
    return NextResponse.json(
      { error: "Database not configured; use mock data." },
      { status: 503 }
    );
  }

  const caseId = (await params).id;
  const caseRow = await prisma.case.findUnique({ where: { id: caseId } });
  if (!caseRow) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 }
    );
  }

  const entries = formData.getAll("files");
  const fileList = (Array.isArray(entries) ? entries : [entries]).filter(
    (f): f is File =>
      typeof f === "object" && f !== null && "size" in f && "name" in f
  ) as File[];

  if (fileList.length === 0) {
    return NextResponse.json(
      { error: "No files provided; use field name 'files'" },
      { status: 400 }
    );
  }

  const caseItem = prismaCaseToCaseItem(caseRow);
  const uploadedBy = caseItem.owner && caseItem.owner !== "Unassigned"
    ? caseItem.owner
    : DEFAULT_UPLOADED_BY;
  const uploadedDate = new Date().toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const root = process.cwd();
  const caseDir = path.join(root, UPLOADS_DIR, "cases", caseId);
  await mkdir(caseDir, { recursive: true });

  const created: Attachment[] = [];

  for (const file of fileList) {
    const id = randomUUID();
    const safeName = sanitizeFileName(file.name || "file");
    const ext = path.extname(file.name || "") || path.extname(safeName);
    const storageName = `${id}${ext}`;
    const storagePath = path.join("cases", caseId, storageName);
    const absolutePath = path.join(caseDir, storageName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, buffer);

    const type = attachmentTypeFromFileName(file.name || safeName);
    const size = formatFileSize(file.size);

    created.push({
      id,
      name: file.name || storageName,
      type,
      size,
      uploadedBy,
      uploadedDate,
      storagePath,
    });
  }

  return NextResponse.json(created);
}
