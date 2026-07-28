import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // Usa el directorio desde el que se ejecuta npm run dev
  outputFileTracingRoot: path.resolve(process.cwd()),
};

export default nextConfig;
