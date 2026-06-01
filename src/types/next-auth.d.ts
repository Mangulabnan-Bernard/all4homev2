import type { UserRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

// Augment Auth.js session/user/JWT with our domain fields. The JWT carries the
// minimal identity ({ id, role }); requireUser() re-reads isActive/role from the
// DB on sensitive actions so a banned user is rejected even with a valid token.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
    remember?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    remember?: boolean;
  }
}
