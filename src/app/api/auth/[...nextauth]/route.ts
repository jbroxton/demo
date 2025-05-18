import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCookieSettings } from "@/utils/auth-config";

// Create the auth handler with dynamic configuration
const handler = NextAuth({
  ...authOptions,
  // Apply dynamic cookie settings based on environment
  ...getCookieSettings()
});

// Export the GET and POST functions according to Next.js conventions
export { handler as GET, handler as POST };