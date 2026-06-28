import NextAuth from "next-auth";
import { NextResponse } from "next/server";

const { auth } = NextAuth({
  secret: process.env.AUTH_SECRET || "fallback_secret_for_build_only_please_change",
  session: { strategy: "jwt" },
  providers: []
});

/**
 * Next.js Middleware — Route Protection
 *
 * Protects dashboard, classroom, and API v1 routes.
 * Public routes are explicitly whitelisted below.
 */

// Routes that do NOT require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/search",
  "/enterprise",
];

// Route prefixes that are always public
const PUBLIC_PREFIXES = [
  "/tutor/",         // Tutor profile pages (public)
  "/api/auth/",      // NextAuth handlers
  "/api/webhooks/",  // Stripe & Daily.co webhooks
  "/_next/",         // Next.js internals
  "/favicon",        // Favicon
  "/fonts/",         // Fonts
  "/hero-",          // Public images
];

// Route prefixes that require authentication
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/classroom",
  "/api/v1/",
];

function isPublicRoute(pathname: string): boolean {
  // Check exact matches
  if (PUBLIC_ROUTES.includes(pathname)) return true;

  // Check prefix matches
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }

  return false;
}

function isProtectedRoute(pathname: string): boolean {
  for (const prefix of PROTECTED_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  return false;
}

export default auth((req: any) => {
  const { pathname } = req.nextUrl;

  // Always allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // For protected routes, check authentication
  if (isProtectedRoute(pathname)) {
    if (!req.auth?.user) {
      // API routes return 401 JSON
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Unauthorized", message: "You must be logged in to perform this action." },
          { status: 401 }
        );
      }

      // Page routes redirect to login
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  // Match all routes except static files and Next.js internals
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
