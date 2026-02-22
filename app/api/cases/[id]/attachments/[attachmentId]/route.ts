import { NextResponse } from "next/server";
import { createReadStream, existsSync } from "fs";
import path from "path";
import { Readable } from "stream";
import { prisma, useDatabase, prismaCaseToCaseItem } from "@/lib/db";
import { UPLOADS_DIR } from "@/lib/attachments";

export const dynamic = "force-dynamic";

/** GET /api/cases/[id]/attachments/[attachmentId] — download a case attachment */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  if (!useDatabase() || !prisma) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const { id: caseId, attachmentId } = await params;
  const caseRow = await prisma.case.findUnique({ where: { id: caseId } });
  if (!caseRow) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const caseItem = prismaCaseToCaseItem(caseRow);
  const attachments = caseItem.attachments ?? [];
  const attachment = attachments.find((a) => a.id === attachmentId);
  if (!attachment?.storagePath) {
    return NextResponse.json(
      { error: "Attachment not found or not downloadable" },
      { status: 404 }
    );
  }

  const absolutePath = path.join(process.cwd(), UPLOADS_DIR, attachment.storagePath);
  if (!existsSync(absolutePath)) {
    return NextResponse.json(
      { error: "File no longer available" },
      { status: 404 }
    );
  }

  const nodeStream = createReadStream(absolutePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
  const filename = attachment.name.replace(/[^\w\s.-]/gi, "_");
  return new Response(webStream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
