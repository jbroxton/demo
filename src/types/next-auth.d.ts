import "next-auth";
import { DefaultSession } from "next-auth";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      allowedTenants: string[];
      currentTenant: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    allowedTenants: string[];
    currentTenant: string;
  }
}

// Extend the JWT types
declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    allowedTenants: string[];
    currentTenant: string;
  }
}