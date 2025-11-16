/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    domains: [
      "storage.hongpung.com",
      "hongpung-bucket-1.s3.ap-northeast-2.amazonaws.com",
      "s3.ap-northeast-2.amazonaws.com",
    ],
  },
};

export default nextConfig;
