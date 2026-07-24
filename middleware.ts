import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public paths
  if (pathname.startsWith("/auth") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get("auth_session")?.value;

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  try {
    const secretStr = process.env.AUTH_SECRET;
    if (!secretStr) throw new Error("Missing secret");
    const secret = new TextEncoder().encode(secretStr);
    await jwtVerify(sessionToken, secret);
    return NextResponse.next();
  } catch (error) {
    // Invalid or expired token
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    const response = NextResponse.redirect(url);
    response.cookies.delete("auth_session");
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
