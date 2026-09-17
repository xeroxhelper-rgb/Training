import { NextResponse, type NextRequest } from "next/server";
import { getSafeNextPath, isDemoMode } from "@/lib/auth/guards";
import { updateSession } from "@/lib/supabase/proxy";

const publicPaths = ["/login", "/auth/confirm"];

export async function proxy(request: NextRequest) {
  if (isDemoMode()) return NextResponse.next();

  const { response, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!user && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", getSafeNextPath(`${pathname}${request.nextUrl.search}`));
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
