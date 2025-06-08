import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Extend the user object in the session
   */
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
  }

  /**
   * Extend the JWT token type
   */
  interface JWT {
    id?: string
  }
} 