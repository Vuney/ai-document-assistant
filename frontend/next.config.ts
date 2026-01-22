import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Mengabaikan error ESLint agar build tidak gagal
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Mengabaikan error tipe data TypeScript saat build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;