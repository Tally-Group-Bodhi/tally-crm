import { NextResponse } from "next/server";
import { prisma, useDatabase } from "@/lib/db";
import { MOCK_EMAIL_TEMPLATES } from "@/lib/mock-email-templates";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("active") === "true";

  if (!useDatabase() || !prisma) {
    const list = activeOnly
      ? MOCK_EMAIL_TEMPLATES.filter((t) => t.active)
      : MOCK_EMAIL_TEMPLATES;
    return NextResponse.json(list);
  }

  try {
    const templates = await prisma.emailTemplate.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(templates);
  } catch (e) {
    console.error("GET /api/email-templates", e);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!useDatabase() || !prisma) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { name, subject, body: templateBody, category, description, active } = body as {
      name: string;
      subject: string;
      body: string;
      category?: string;
      description?: string;
      active?: boolean;
    };

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name: name.trim(),
        subject: subject?.trim() ?? "",
        body: templateBody ?? "",
        category: category?.trim() ?? "",
        description: description?.trim() ?? "",
        active: active ?? true,
      },
    });
    return NextResponse.json(template, { status: 201 });
  } catch (e) {
    console.error("POST /api/email-templates", e);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
