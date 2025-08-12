/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'lh3.googleusercontent.com', // Add Google's domain for profile pictures
      'firebasestorage.googleapis.com' // Add Firebase Storage domain for club images
    ],
  },
}

module.exports = nextConfig 