import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { authConfig } from "@/auth.config";

// Edge-safe instance (authConfig has no Prisma/bcrypt) — role-gates at the edge
// from the signed JWT with zero DB hits. Fine-grained ownership is enforced
// again at the action layer.
const { auth } = NextAuth(authConfig);

const ROUTE_ROLES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/provider", roles: ["PROVIDER"] },
  { prefix: "/customer", roles: ["CUSTOMER"] },
  { prefix: "/dashboard", roles: ["ADMIN", "PROVIDER", "CUSTOMER"] },
  { prefix: "/bookings", roles: ["ADMIN", "PROVIDER", "CUSTOMER"] },
];

// Public routes that live under an otherwise-gated prefix (marketing pages).
const PUBLIC_PATHS = new Set<string>(["/provider/apply"]);

export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;

  if (PUBLIC_PATHS.has(path)) return NextResponse.next();

  const rule = ROUTE_ROLES.find((r) => path === r.prefix || path.startsWith(`${r.prefix}/`));
  if (!rule) return NextResponse.next();

  const session = req.auth;
  if (!session?.user) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("callbackUrl", path + nextUrl.search);
    return NextResponse.redirect(url);
  }

  const role = session.user.role;
  if (!role || !rule.roles.includes(role)) {
    return NextResponse.redirect(new URL("/403", nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  // Run on everything except API routes, Next internals, and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
