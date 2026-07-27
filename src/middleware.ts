import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role as string | undefined;
    const path = req.nextUrl.pathname;

    if (path.startsWith("/dueno") && role !== "OWNER") {
      return NextResponse.redirect(new URL("/login/dueno", req.url));
    }

    if (path.startsWith("/doctor") && role !== "DOCTOR") {
      return NextResponse.redirect(new URL("/login/doctor", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (path.startsWith("/dueno") || path.startsWith("/doctor")) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/dueno/:path*", "/doctor/:path*"],
};
