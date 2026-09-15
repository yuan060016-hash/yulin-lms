import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/session";

const publicExact = new Set([
  "/sign-in",
  "/sign-up",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/register",
  "/api/auth/me",
]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublic =
    publicExact.has(pathname) ||
    pathname.startsWith("/sign-in/") ||
    pathname.startsWith("/sign-up/");

  const session = await getSessionFromRequest(req);

  if (!session && !isPublic) {
    // For API, return JSON 401 instead of redirect
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("redirect_url", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
