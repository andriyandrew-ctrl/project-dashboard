import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // BYPASS TOTAL: Tanpa koneksi database apapun.
        // Langsung cek apakah email dan password sesuai dengan data manual ini.
        
        if (
          credentials?.email === "andri.setyawan@krakatausteel.com" && 
          credentials?.password === "rahasia123" // Ganti dengan password yang Bapak inginkan
        ) {
          return {
            id: "1",
            name: "Andri Setyawan",
            email: "andri.setyawan@krakatausteel.com",
            role: "MANAGER", 
          }
        }

        // Jika salah, tolak
        return null
      }
    })
  ],
})