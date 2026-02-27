import { NextResponse } from "next/server";
import { createReadStream, existsSync, statSync } from "fs";
import path from "path";
import { Readable } from "stream";
import { prisma, useDatabase, prismaCaseToCaseItem } from "@/lib/db";
import { UPLOADS_DIR, mimeTypeFromFileName } from "@/lib/attachments";

export const dynamic = "force-dynamic";

/** GET /api/cases/[id]/attachments/[attachmentId] — download or view a case attachment.
 *  Append ?inline=true to serve with Content-Disposition: inline (for PDF/image preview). */
export async function GET(
  request: Request,
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

  const { searchParams } = new URL(request.url);
  const inline = searchParams.get("inline") === "true";
  const mime = mimeTypeFromFileName(attachment.name);
  const filename = attachment.name.replace(/[^\w\s.-]/gi, "_");
  const disposition = inline ? `inline; filename="${filename}"` : `attachment; filename="${filename}"`;

  const nodeStream = createReadStream(absolutePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
  const fileSize = statSync(absolutePath).size;

  return new Response(webStream, {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": disposition,
      "Content-Length": String(fileSize),
    },
  });
}
