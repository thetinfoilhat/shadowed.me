/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'], // Add Google's domain for profile pictures
  },
  eslint: {
    // Disable ESLint during build
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['firebase'],
  webpack: (config, { isServer }) => {
    // Fix for Firebase import errors
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig 