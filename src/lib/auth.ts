import type { NextAuthOptions, User, DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { validateCredentials, Tenant, DbUser } from "@/services/auth.server";
import { getBaseUrl } from "./env";
import { getCookieSettings, getAuthUrl } from "@/app/api/auth/session-config";

// Custom User type for the authorization return value
interface CustomUser {
  id: string;
  email: string;
  name: string;
  role: string;
  allowedTenants: string[];
  currentTenant: string | undefined;
  tenantData?: Tenant[];
}

// Extended session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      allowedTenants: string[];
      currentTenant: string;
      tenantData?: Tenant[];
    } & DefaultSession["user"];
  }

  // Extend the User type within next-auth
  interface User {
    id: string;
    role: string;
    allowedTenants: string[];
    currentTenant: string | undefined;
    tenantData?: Tenant[];
  }
}

// Extended JWT type
declare module "next-auth/jwt" {
  interface JWT {
    role: string;
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
          
          // Extract tenant IDs from tenant objects
          const allowedTenantIds = user.allowedTenants.map((t: Tenant) => t.id);
          
          // Return complete user object with all necessary data
          // This will be available in the JWT token and session
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            allowedTenants: allowedTenantIds,
            // Select first tenant by default if available
            currentTenant: allowedTenantIds.length > 0 ? allowedTenantIds[0] : undefined,
            // Include additional user metadata if needed
            tenantData: user.allowedTenants // Include full tenant objects for reference
          } as User;
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
      // Initial sign in - store all user data in the token
      if (user) {
        // Store essential data
        token.role = user.role;
        token.allowedTenants = user.allowedTenants;
        
        // Set current tenant, ensuring it's never null
        token.currentTenant = user.currentTenant || 
          (user.allowedTenants && user.allowedTenants.length > 0 ? user.allowedTenants[0] : "");
        
        // Store tenant data for UI display
        if (user.tenantData) {
          token.tenantData = user.tenantData;
        }
      }
      
      // Handle tenant switching from client
      if (trigger === "update" && session?.currentTenant) {
        // Validate tenant access before switching
        if (token.allowedTenants && token.allowedTenants.includes(session.currentTenant)) {
          token.currentTenant = session.currentTenant;
        } else {
          console.warn(`JWT: Cannot switch to unauthorized tenant ${session.currentTenant}`);
        }
      }
      
      return token;
    },
    
    // Provide complete session data to client components
    async session({ session, token }) {
      // Initialize user object if needed
      if (!session.user) {
        session.user = {
          id: "",
          role: "user",
          allowedTenants: [],
          currentTenant: "",
          name: "",
          email: "",
          image: ""
        };
      }
      
      // Pass all required data to the session
      session.user.id = token.sub || "";
      session.user.role = token.role || "user";
      session.user.allowedTenants = token.allowedTenants || [];
      session.user.currentTenant = token.currentTenant || "";
      
      // Include tenant data
      if (token.tenantData) {
        session.user.tenantData = token.tenantData;
      }
      
      return session;
    },
  },
  
  // Configure pages
  pages: {
    signIn: "/signin",
    error: "/error",
  },
}; 