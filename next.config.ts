import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  allowedDevOrigins: ['192.168.1.107:3000', '192.168.1.107'],
}

export default nextConfig