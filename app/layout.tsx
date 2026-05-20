import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '简力全开 — AI赋能专业简历制作',
  description: '50+ 专业模板，AI 智能优化，一键下载。打造令人印象深刻的简历。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        {/* Explicit viewport tag — the most reliable cross-browser way to enable mobile layout */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
      </head>
      <body>{children}</body>
    </html>
  )
}
