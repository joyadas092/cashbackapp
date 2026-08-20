import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation/schemas";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (!user) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        // A blocked account cannot sign in. Checked here rather than only in the
        // UI, so blocking from the admin panel actually ends access instead of
        // just changing a label. RESTRICTED still signs in — it limits what the
        // account can do (see the withdrawal endpoint), not whether it exists.
        if (user.riskStatus === "BLOCKED") return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          riskStatus: user.riskStatus,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: string }).role;
        token.riskStatus = (user as { riskStatus: string }).riskStatus;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.riskStatus = token.riskStatus as string;
      }
      return session;
    },
  },
});
