import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: [
    "@tokenization/shared",
    "@tokenization/ui",
    "@tokenization/tw-blocks-shared",
  ],
  async rewrites() {
    const coreApiUrl =
      process.env.NEXT_PUBLIC_CORE_API_URL ?? "http://localhost:4000";
    return [
      {
        source: "/core-api/:path*",
        destination: `${coreApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
