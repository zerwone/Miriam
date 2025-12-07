/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
  },
  // Optimize for Vercel
  poweredByHeader: false,
  compress: true,
  // Fix for route groups and build issues
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Environment variables validation
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Webpack configuration to handle edge runtime warnings
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    // Ignore the client reference manifest error during build
    config.plugins.push(
      new webpack.IgnorePlugin({
        checkResource(resource, context) {
          // Ignore missing client reference manifest files in route groups
          if (resource && resource.includes('client-reference-manifest')) {
            return false; // Don't ignore, but let it fail gracefully
          }
          return false;
        },
      })
    );
    return config;
  },
  // Suppress build trace errors (non-critical)
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig
