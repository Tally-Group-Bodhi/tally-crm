import { NextResponse } from "next/server";
import { prisma, useDatabase } from "@/lib/db";

const dbUnavailable = () =>
  NextResponse.json(
    { error: "Database not configured; use mock data." },
    { status: 503 }
  );

/** PATCH /api/note-templates/[id] — update a template */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!useDatabase() || !prisma) return dbUnavailable();

  const id = (await params).id;
  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name.trim();
    if (typeof body.title === "string") data.title = body.title.trim();
    if (typeof body.body === "string") data.body = body.body;
    if (typeof body.active === "boolean") data.active = body.active;

    if (Object.keys(data).length === 0) {
      const row = await prisma.noteTemplate.findUnique({ where: { id } });
      if (!row) return NextResponse.json(null, { status: 404 });
      return NextResponse.json(row);
    }

    const updated = await prisma.noteTemplate.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH /api/note-templates/[id]", e);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

/** DELETE /api/note-templates/[id] — delete a template */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!useDatabase() || !prisma) return dbUnavailable();

  const id = (await params).id;
  try {
    await prisma.noteTemplate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/note-templates/[id]", e);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
