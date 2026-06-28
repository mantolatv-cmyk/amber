import { NextRequest, NextResponse } from "next/server";
import prisma from "@ailearn/database";
import { TutorSearchSchema } from "@ailearn/shared";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const rawParams = Object.fromEntries(searchParams.entries());
    const parsed = TutorSearchSchema.safeParse(rawParams);

    const subject = parsed.success ? parsed.data.subject : searchParams.get("subject");
    const minPrice = parsed.success ? parsed.data.priceMin?.toString() : searchParams.get("minPrice");
    const maxPrice = parsed.success ? parsed.data.priceMax?.toString() : searchParams.get("maxPrice");
    const minRating = parsed.success ? parsed.data.ratingMin?.toString() : searchParams.get("minRating");
    const query = parsed.success ? parsed.data.q : searchParams.get("q");
    const sort = parsed.success ? parsed.data.sortBy : searchParams.get("sort");

    // Build Prisma query dynamically
    const whereClause: any = {
      status: "approved",
    };

    if (query) {
      whereClause.OR = [
        { user: { fullName: { contains: query, mode: "insensitive" } } },
        { headline: { contains: query, mode: "insensitive" } },
      ];
    }

    if (subject) {
      whereClause.subjects = {
        some: {
          subject: {
            slug: subject,
          },
        },
      };
    }

    if (minPrice) {
      whereClause.hourlyRateCents = {
        ...whereClause.hourlyRateCents,
        gte: parseInt(minPrice, 10) * 100, // Convert to cents
      };
    }

    if (maxPrice) {
      whereClause.hourlyRateCents = {
        ...whereClause.hourlyRateCents,
        lte: parseInt(maxPrice, 10) * 100,
      };
    }

    if (minRating) {
      whereClause.avgRating = {
        gte: parseFloat(minRating),
      };
    }

    let orderBy: any = { avgRating: "desc" };
    if (sort === "price_asc") {
      orderBy = { hourlyRateCents: "asc" };
    } else if (sort === "price_desc") {
      orderBy = { hourlyRateCents: "desc" };
    }

    // Execute query
    const tutors = await prisma.tutorProfile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            fullName: true,
            avatarUrl: true,
          },
        },
        subjects: {
          include: {
            subject: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy,
      take: 20,
    });

    // Format response
    const formattedTutors = tutors.map((tutor: any) => ({
      id: tutor.id,
      userId: tutor.userId,
      name: tutor.user.fullName,
      avatarUrl: tutor.user.avatarUrl,
      headline: tutor.headline,
      bio: tutor.bio,
      hourlyRateCents: tutor.hourlyRateCents,
      trialRateCents: tutor.trialRateCents,
      avgRating: Number(tutor.avgRating),
      totalSessions: tutor.totalSessions,
      subjects: tutor.subjects.map((s: any) => s.subject.name),
    }));

    return NextResponse.json({
      success: true,
      data: formattedTutors,
      meta: {
        total: formattedTutors.length,
      }
    });

  } catch (error) {
    console.error("Error in GET /v1/tutors/search:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
