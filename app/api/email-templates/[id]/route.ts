import { NextResponse } from "next/server";
import { prisma, useDatabase } from "@/lib/db";
import { MOCK_EMAIL_TEMPLATES } from "@/lib/mock-email-templates";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;

  if (!useDatabase() || !prisma) {
    const mock = MOCK_EMAIL_TEMPLATES.find((t) => t.id === id);
    if (!mock) return NextResponse.json(null, { status: 404 });
    const body = await request.json();
    return NextResponse.json({ ...mock, ...body });
  }

  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name.trim();
    if (typeof body.subject === "string") data.subject = body.subject.trim();
    if (typeof body.body === "string") data.body = body.body;
    if (typeof body.active === "boolean") data.active = body.active;
    if (typeof body.category === "string") data.category = body.category;
    if (typeof body.description === "string") data.description = body.description;

    if (Object.keys(data).length === 0) {
      const row = await prisma.emailTemplate.findUnique({ where: { id } });
      if (!row) return NextResponse.json(null, { status: 404 });
      return NextResponse.json(row);
    }

    const updated = await prisma.emailTemplate.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH /api/email-templates/[id]", e);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!useDatabase() || !prisma) {
    return NextResponse.json({ ok: true });
  }

  const id = (await params).id;
  try {
    await prisma.emailTemplate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/email-templates/[id]", e);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
