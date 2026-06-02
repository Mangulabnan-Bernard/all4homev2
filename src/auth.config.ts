import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import type { UserRole } from "@prisma/client";

/**
 * Edge-safe NextAuth config shared by `middleware.ts` and `src/auth.ts`.
 * MUST NOT import Prisma, bcrypt, or the adapter (those are Node-only and are
 * added in src/auth.ts). OAuth providers register only when their credentials
 * are present, so missing env vars never crash startup.
 */
const providers: NextAuthConfig["providers"] = [];
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      // Pass creds explicitly: Auth.js v5 otherwise defaults to AUTH_GOOGLE_ID/
      // AUTH_GOOGLE_SECRET, which don't match the env var names we gate on.
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: false,
    }),
  );
}
if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHub({
      // Pass creds explicitly: Auth.js v5 otherwise reads AUTH_GITHUB_ID/
      // AUTH_GITHUB_SECRET, so GITHUB_ID alone yields clientId=undefined.
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      allowDangerousEmailAccountLinking: false,
    }),
  );
}

export const authConfig = {
  providers,
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 }, // 30-day ceiling
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: UserRole }).role ?? "CUSTOMER";
        token.remember = (user as { remember?: boolean }).remember ?? false;
      }
      // Allow `useSession().update({ role })` to refresh the claim (e.g. after approval).
      if (trigger === "update" && session && typeof session === "object" && "role" in session) {
        token.role = (session as { role: UserRole }).role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
