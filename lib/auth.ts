import NextAuth, { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import type { 
  User, 
  Account, 
  Profile as NextAuthProfile, 
  Profile
} from "next-auth"
import type { AdapterUser } from "next-auth/adapters"
import prisma from "@/db"

// Extended interfaces for better type safety
interface GoogleProfile extends NextAuthProfile {
  email: string
  name: string
  picture: string
  email_verified: boolean
  given_name?: string
  family_name?: string
  locale?: string
}

interface RedirectCallbackParams {
  url: string
  baseUrl: string
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }: { user: User | AdapterUser; account: Account | null; profile?: Profile }) {
      const googleProfile = profile as GoogleProfile | undefined;
      console.log("signIn callback triggered", { 
        user: user?.email, 
        account: account?.provider, 
        profile: googleProfile?.email 
      });
      return true;
    },

    async jwt({token, user}){
      if(user){
        token.id = user.id;
      }
      return token;
    },

    async session({session, token}){
      if(token.id){
        session.user.id = token.id as string;
      }
      return session;
    },
    
    async redirect({ url, baseUrl }: RedirectCallbackParams): Promise<string> {
      // If url is a relative path, make it absolute
      if (url.startsWith("/")) return `${baseUrl}${url}`
      
      // If url is on the same origin, allow it
      if (new URL(url).origin === baseUrl) return url
      
      // Otherwise redirect to dashboard
      return `${baseUrl}/chat`
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }