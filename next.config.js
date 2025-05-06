/** @type {import('next').NextConfig} */
const nextConfig = {
  /* 
   * Standard Next.js configuration
   * Simple configuration to prepare for NextAuth
   */
  reactStrictMode: true,
  
  // Set webpack to handle client-side only libraries like React Quill
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },

  // Ensure proper handling of experimental features
  experimental: {
    // Required for NextAuth to work with App Router
    serverComponentsExternalPackages: ["next-auth"],
  },
  
  // Let NextAuth handle dynamic URLs via our custom env helpers
  // No need to set NEXTAUTH_URL here as it's now handled by lib/env.ts
};

module.exports = nextConfig; 