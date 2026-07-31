import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/constants";

declare module "next-auth" {
  interface User {
    role: Role;
    uniqueId?: string | null;
    groupId?: number | null;
    isLeader?: boolean;
    biodataComplete?: boolean;
    department?: string | null;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: Role;
      uniqueId?: string | null;
      groupId?: number | null;
      isLeader?: boolean;
      biodataComplete?: boolean;
      department?: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: Role;
    uniqueId?: string | null;
    groupId?: number | null;
    isLeader?: boolean;
    biodataComplete?: boolean;
    department?: string | null;
  }
}

const credentialsSchema = z.object({
  uniqueId: z.string().min(1),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        uniqueId: {},
        password: {},
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const uniqueId = parsed.data.uniqueId.trim();
        const { password } = parsed.data;

        const admin = await prisma.admin.findUnique({ where: { uniqueId } });
        if (admin && (await bcrypt.compare(password, admin.passwordHash))) {
          return {
            id: String(admin.id),
            name: admin.fullName,
            email: admin.email,
            role: "admin" as const,
            uniqueId: admin.uniqueId,
          };
        }

        const faculty = await prisma.faculty.findUnique({ where: { uniqueId } });
        if (faculty?.isActive && (await bcrypt.compare(password, faculty.passwordHash))) {
          return {
            id: String(faculty.id),
            name: faculty.fullName,
            email: faculty.email,
            role: "faculty" as const,
            uniqueId: faculty.uniqueId,
            department: faculty.department,
          };
        }

        const student = await prisma.student.findUnique({ where: { uniqueId } });
        if (student?.isActive && (await bcrypt.compare(password, student.passwordHash))) {
          return {
            id: String(student.id),
            name: student.fullName,
            email: student.email,
            role: "student" as const,
            uniqueId: student.uniqueId,
            groupId: student.groupId,
            isLeader: student.isLeader,
            biodataComplete: student.biodataComplete,
            department: student.department,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role;
        token.uniqueId = user.uniqueId ?? null;
        token.groupId = user.groupId ?? null;
        token.isLeader = user.isLeader ?? false;
        token.biodataComplete = user.biodataComplete ?? true;
        token.department = user.department ?? null;
      }

      if (trigger === "update" && token.role === "student" && token.sub) {
        const student = await prisma.student.findUnique({
          where: { id: Number(token.sub) },
          select: { groupId: true, isLeader: true, biodataComplete: true, fullName: true },
        });
        if (student) {
          token.groupId = student.groupId;
          token.isLeader = student.isLeader;
          token.biodataComplete = student.biodataComplete;
          token.name = student.fullName;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as Role;
        session.user.uniqueId = token.uniqueId;
        session.user.groupId = token.groupId;
        session.user.isLeader = token.isLeader;
        session.user.biodataComplete = token.biodataComplete;
        session.user.department = token.department;
        if (token.name) session.user.name = token.name as string;
      }
      return session;
    },
  },
});
