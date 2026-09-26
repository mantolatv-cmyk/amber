import { NextResponse } from "next/server";
import prisma from "@ailearn/database";

export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        description: true,
      },
    });

    return NextResponse.json({ success: true, data: subjects });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
