import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const PROTECTED_PATHS = ["/dashboard", "/projects", "/admin"];
const GUEST_ONLY_PATHS = ["/auth/login", "/auth/register"];
const ADMIN_ONLY_PATHS = ["/admin"];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isRelevant =
    PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    GUEST_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!isRelevant) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;
  let isAuthenticated = false;
  let userRole: string | null = null;

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      isAuthenticated = true;
      userRole = payload.role;
    }
  }

  if (
    PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) &&
    !isAuthenticated
  ) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    GUEST_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) &&
    isAuthenticated
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (
    ADMIN_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) &&
    userRole !== "admin"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};