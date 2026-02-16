/**
 * Next.js Middleware
 *
 * Refreshes the Supabase auth session on every request and:
 * 1. Redirects unauthenticated users away from protected routes
 * 2. Redirects authenticated users away from auth pages
 *
 * Update protected routes in src/lib/supabase/middleware.ts
 */
import { NextResponse, type NextRequest } from "next/server";
import { updateSession, isProtectedPath } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Refresh the session — this keeps auth tokens alive
  const { supabaseResponse, user } = await updateSession(request);

  const pathname = request.nextUrl.pathname;

  // Redirect unauthenticated users away from protected routes
  if (!user && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (
    user &&
    (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/signup"))
  ) {
    const url = request.nextUrl.clone();
    const redirect = url.searchParams.get("redirect") || "/";
    url.pathname = redirect;
    url.searchParams.delete("redirect");
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
