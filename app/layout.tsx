import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '简历帮 — 专业简历制作',
  description: '30+ 专业模板，AI 智能优化，一键下载。打造令人印象深刻的简历。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
