import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  allowedDevOrigins: ['192.168.1.107:3000', '192.168.1.107'], 
  experimental: {
    // 这里保持为空或放置其他实验性配置
  },
}

export default nextConfig
