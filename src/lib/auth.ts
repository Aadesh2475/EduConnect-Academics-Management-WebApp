import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    password: {
      hash: async (password) => {
        return bcrypt.hashSync(password, 10);
      },
      verify: async ({ hash, password }) => {
        return bcrypt.compareSync(password, hash);
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "STUDENT",
        input: true,
      },
      onboarded: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: true,
      },
    },
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ],
  callbacks: {
    session: async ({ session, user }: { session: any; user: any }) => {
      // Get role from database if not in session
      if (session && user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, onboarded: true }
        });
        return {
          ...session,
          user: {
            ...session.user,
            role: dbUser?.role || "STUDENT",
            onboarded: dbUser?.onboarded || false,
          }
        };
      }
      return session;
    }
  }
});

export type Session = typeof auth.$Infer.Session;
