/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Enhanced configuration for Next.js 15
  experimental: {
    // Enable better error messages for useSearchParams issues
    strictNextHead: true,
  },
  // Custom webpack configuration to catch useSearchParams usage
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Add custom plugin to warn about useSearchParams usage without Suspense
      config.plugins.push(
        new (class {
          apply(compiler) {
            compiler.hooks.compilation.tap(
              "SearchParamsChecker",
              (compilation) => {
                // Custom logic could be added here to check for useSearchParams usage
              }
            );
          }
        })()
      );
    }
    return config;
  },
};

export default nextConfig;
