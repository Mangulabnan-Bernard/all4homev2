import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { loginSchema } from "@/lib/validators/auth";

/**
 * Node-runtime NextAuth instance: spreads the edge-safe config and adds the
 * Prisma adapter (OAuth Account/User linking), the Credentials provider, and
 * the bcrypt password check. Session is JWT (see auth.config) so middleware can
 * gate at the edge with zero DB hits.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: { email: {}, password: {}, remember: {} },
      authorize: async (raw) => {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password, remember } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        // OAuth-only accounts have no password; banned accounts can't sign in.
        if (!user?.password || !user.isActive) return null;
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          remember,
        };
      },
    }),
  ],
  events: {
    // OAuth sign-ups default to CUSTOMER and are treated as email-verified.
    createUser: async ({ user }) => {
      if (!user.id) return;
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "CUSTOMER", isVerified: true },
      });
      await prisma.auditLog.create({
        data: { action: "CREATE", entity: "User", entityId: user.id, metadata: { via: "oauth" } },
      });
    },
  },
});
