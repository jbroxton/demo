import type { NextAuthOptions, User, DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { validateCredentials, Tenant, DbUser } from "@/services/auth.server";
import { getBaseUrl } from "./env";
import { getCookieSettings, getAuthUrl } from "@/utils/auth-config";

// Custom User type for the authorization return value
interface CustomUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string; // Single tenant ID
  allowedTenants: string[];
  currentTenant: string;
  tenantData?: Tenant[];
}

// Extended session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      tenantId: string; // Single tenant ID
      allowedTenants: string[];
      currentTenant: string;
      tenantData?: Tenant[];
    } & DefaultSession["user"];
  }

  // Extend the User type within next-auth
  interface User {
    id: string;
    role: string;
    tenantId: string; // Single tenant ID  
    allowedTenants: string[];
    currentTenant: string;
    tenantData?: Tenant[];
  }
}

// Extended JWT type
declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    tenantId: string; // Single tenant ID
    allowedTenants: string[];
    currentTenant: string;
    tenantData?: Tenant[];
  }
}

export const authOptions: NextAuthOptions = {
  // Enable debug in development
  debug: process.env.NODE_ENV === "development",
  
  // Configure session handling
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Ensure proper JWT encryption
  jwt: {
    // Maximum token age
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Use secure secret from environment variable
  secret: process.env.NEXTAUTH_SECRET,
  
  // Use dynamic cookie settings based on environment
  ...getCookieSettings(),
  
  // Specify auth providers
  providers: [
    CredentialsProvider({
      name: "Credentials",
      // The credentials for login (email/password)
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // Centralized authentication logic
      async authorize(credentials) {
        // Input validation
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        try {
          // Get comprehensive user data in a single DB call
          // validateCredentials already includes tenant information
          const user = await validateCredentials(credentials.email, credentials.password) as DbUser;
          
          if (!user) {
            return null;
          }
          
          console.log('Authorize - User from DB:', user);
          console.log('Authorize - User allowedTenants:', user.allowedTenants);
          
          // Extract the tenant ID - users have exactly one tenant
          const tenantId = user.allowedTenants[0]?.id;
          
          if (!tenantId) {
            console.error('User has no tenant assigned:', user.email);
            return null; // Reject login if no tenant
          }
          
          console.log('Authorize - User tenant ID:', tenantId);
          
          // Return user object with tenant ID
          const authorizedUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: tenantId,  // Single tenant ID
            // Keep these for backwards compatibility
            allowedTenants: [tenantId],
            currentTenant: tenantId,
          } as User;
          
          console.log('Authorize - Returning user:', authorizedUser);
          
          return authorizedUser;
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  
  // Configure callbacks
  callbacks: {
    // Store comprehensive user data in the JWT token
    async jwt({ token, user, trigger, session }) {
      console.log('JWT callback - trigger:', trigger);
      console.log('JWT callback - user:', user);
      console.log('JWT callback - existing token:', token);
      
      // Initial sign in - store all user data in the token
      if (user) {
        console.log('JWT - Setting user data in token');
        console.log('JWT - User tenantId:', user.tenantId);
        
        // Store essential data including tenant ID
        token.role = user.role;
        token.tenantId = user.tenantId; // Store the single tenant ID
        
        // Keep these for backwards compatibility
        token.allowedTenants = user.allowedTenants;
        token.currentTenant = user.currentTenant || user.tenantId;
        
        // Store tenant data for UI display if needed
        if (user.tenantData) {
          token.tenantData = user.tenantData;
        }
        
        console.log('JWT - Token after setting:', token);
      }
      
      // Ensure tenant ID is always present
      if (!token.tenantId && token.currentTenant) {
        token.tenantId = token.currentTenant;
      }
      
      return token;
    },
    
    // Provide complete session data to client components
    async session({ session, token }) {
      console.log('Session callback - token:', token);
      console.log('Session callback - initial session:', session);
      
      // Initialize user object if needed
      if (!session.user) {
        session.user = {
          id: "",
          role: "user",
          tenantId: "", // Include tenant ID
          allowedTenants: [],
          currentTenant: "",
          name: "",
          email: "",
          image: ""
        };
      }
      
      // Pass all required data to the session including tenant ID
      session.user.id = token.sub || "";
      session.user.role = token.role || "user";
      session.user.tenantId = token.tenantId || ""; // Pass the single tenant ID
      
      // Keep these for backwards compatibility
      session.user.allowedTenants = token.allowedTenants || [];
      session.user.currentTenant = token.currentTenant || token.tenantId || "";
      
      console.log('Session - tenantId from token:', token.tenantId);
      console.log('Session - tenantId set on session:', session.user.tenantId);
      
      // Include tenant data if needed
      if (token.tenantData) {
        session.user.tenantData = token.tenantData;
      }
      
      console.log('Session callback - final session:', session);
      
      return session;
    },
  },
  
  // Configure pages
  pages: {
    signIn: "/signin",
    error: "/error",
  },
}; 