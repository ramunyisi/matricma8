import { NextResponse, type NextRequest } from "next/server";
import { mirroredSessionCookieName } from "@/lib/session-cookie";

const protectedPrefixes = [
  "/admin",
  "/aps",
  "/bursaries",
  "/caps-content",
  "/dashboard",
  "/classroom",
  "/guardian",
  "/notifications",
  "/onboarding",
  "/past-papers",
  "/pathways",
  "/profile",
  "/study-coach",
  "/universities"
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (!isProtected) return NextResponse.next();

  const hasMirroredSession = request.cookies.has(mirroredSessionCookieName);
  if (hasMirroredSession) return NextResponse.next();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/auth/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/aps/:path*",
    "/bursaries/:path*",
    "/caps-content/:path*",
    "/dashboard/:path*",
    "/classroom/:path*",
    "/guardian/:path*",
    "/notifications/:path*",
    "/onboarding/:path*",
    "/past-papers/:path*",
    "/pathways/:path*",
    "/profile/:path*",
    "/study-coach/:path*",
    "/universities/:path*"
  ]
};
