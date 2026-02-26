import { NextResponse } from "next/server";
import { prisma, useDatabase } from "@/lib/db";

const dbUnavailable = () =>
  NextResponse.json(
    { error: "Database not configured; use mock data." },
    { status: 503 }
  );

/** GET /api/note-templates — list all templates (optionally filter by active) */
export async function GET(request: Request) {
  if (!useDatabase() || !prisma) return dbUnavailable();

  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    const templates = await prisma.noteTemplate.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(templates);
  } catch (e) {
    console.error("GET /api/note-templates", e);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

/** POST /api/note-templates — create a new template */
export async function POST(request: Request) {
  if (!useDatabase() || !prisma) return dbUnavailable();

  try {
    const body = await request.json();
    const { name, title, body: templateBody, active } = body as {
      name: string;
      title: string;
      body: string;
      active?: boolean;
    };

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const template = await prisma.noteTemplate.create({
      data: {
        name: name.trim(),
        title: title?.trim() ?? "",
        body: templateBody ?? "",
        active: active ?? true,
      },
    });
    return NextResponse.json(template, { status: 201 });
  } catch (e) {
    console.error("POST /api/note-templates", e);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
