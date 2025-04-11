/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '**',
      },
    ],
  },
  eslint: {
    // Disable ESLint during build
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['firebase', '@firebase/app', '@firebase/firestore', '@firebase/auth', '@firebase/storage'],
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
    
    // Ensure proper aliasing for Firebase modules
    config.resolve.alias = {
      ...config.resolve.alias,
      'firebase/app': require.resolve('firebase/app'),
      'firebase/auth': require.resolve('firebase/auth'),
      'firebase/firestore': require.resolve('firebase/firestore'),
      'firebase/storage': require.resolve('firebase/storage'),
    };
    
    return config;
  },
}

module.exports = nextConfig 