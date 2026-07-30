import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/constants";

declare module "next-auth" {
  interface User {
    role: Role;
    facultyId?: string | null;
    studentId?: string | null;
    groupId?: number | null;
    isLeader?: boolean;
    department?: string | null;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: Role;
      facultyId?: string | null;
      studentId?: string | null;
      groupId?: number | null;
      isLeader?: boolean;
      department?: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: Role;
    facultyId?: string | null;
    studentId?: string | null;
    groupId?: number | null;
    isLeader?: boolean;
    department?: string | null;
  }
}

const credentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  role: z.enum(["admin", "faculty", "student"]),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: {},
        password: {},
        role: {},
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { username, password, role } = parsed.data;

        if (role === "admin") {
          const row = await prisma.admin.findUnique({ where: { username } });
          if (!row || !(await bcrypt.compare(password, row.passwordHash))) return null;
          return {
            id: String(row.id),
            name: row.fullName,
            email: row.email,
            role: "admin" as const,
          };
        }

        if (role === "faculty") {
          const row = await prisma.faculty.findUnique({ where: { username } });
          if (!row || !row.isActive || !(await bcrypt.compare(password, row.passwordHash)))
            return null;
          return {
            id: String(row.id),
            name: row.fullName,
            email: row.email,
            role: "faculty" as const,
            facultyId: row.facultyId,
            department: row.department,
          };
        }

        const row = await prisma.student.findUnique({ where: { username } });
        if (!row || !row.isActive || !(await bcrypt.compare(password, row.passwordHash)))
          return null;
        return {
          id: String(row.id),
          name: row.fullName,
          email: row.email,
          role: "student" as const,
          studentId: row.studentId,
          groupId: row.groupId,
          isLeader: row.isLeader,
          department: row.department,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.facultyId = user.facultyId ?? null;
        token.studentId = user.studentId ?? null;
        token.groupId = user.groupId ?? null;
        token.isLeader = user.isLeader ?? false;
        token.department = user.department ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as Role;
        session.user.facultyId = token.facultyId;
        session.user.studentId = token.studentId;
        session.user.groupId = token.groupId;
        session.user.isLeader = token.isLeader;
        session.user.department = token.department;
      }
      return session;
    },
  },
});
