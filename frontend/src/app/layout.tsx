import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Providers } from '@/components/providers'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'AI Chat Notes',
    template: '%s | AI Chat Notes',
  },
  description: 'AI 聊天聚合与知识库管理平台，支持多模型对话、智能笔记生成、知识库管理',
  keywords: ['AI', 'Chat', 'Notes', 'Knowledge Base', 'LLM', 'GPT', 'Claude'],
  authors: [{ name: 'AI Chat Notes' }],
  creator: 'AI Chat Notes',
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    title: 'AI Chat Notes',
    description: 'AI 聊天聚合与知识库管理平台',
    siteName: 'AI Chat Notes',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Chat Notes',
    description: 'AI 聊天聚合与知识库管理平台',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
