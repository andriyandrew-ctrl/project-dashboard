import type { NextAuthConfig } from "next-auth"

// Konfigurasi utama Satpam
export const authConfig = {
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [], 
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Trik 'as any' agar TypeScript berhenti mencari deklarasi modul JWT
        (token as any).role = (user as any).role;
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // Trik 'as any' agar TypeScript menerima tambahan properti 'role'
        (session.user as any).role = (token as any).role;
      }
      return session
    }
  }
} satisfies NextAuthConfig