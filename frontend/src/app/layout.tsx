import type { Metadata } from 'next'
import { Geist, Geist_Mono, Lora, Playfair_Display, Crimson_Text, Source_Serif_4, Noto_Serif_SC, Long_Cang, Ma_Shan_Zheng } from 'next/font/google'
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

// Artistic fonts for user selection (English)
const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const crimson = Crimson_Text({
  variable: '--font-crimson',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
})

const sourceSerif = Source_Serif_4({
  variable: '--font-source-serif',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

// Chinese artistic fonts
const notoSerifSC = Noto_Serif_SC({
  variable: '--font-noto-serif-sc',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const longCang = Long_Cang({
  variable: '--font-long-cang',
  subsets: ['latin'],
  weight: ['400'],
})

const maShanZheng = Ma_Shan_Zheng({
  variable: '--font-ma-shan-zheng',
  subsets: ['latin'],
  weight: ['400'],
})

export const metadata: Metadata = {
  title: {
    default: 'AI Chat Note',
    template: '%s | AI Chat Note',
  },
  description: 'AI 聊天聚合与知识库管理平台，支持多模型对话、智能笔记生成、知识库管理',
  keywords: ['AI', 'Chat', 'Notes', 'Knowledge Base', 'LLM', 'GPT', 'Claude'],
  authors: [{ name: 'AI Chat Note' }],
  creator: 'AI Chat Note',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    title: 'AI Chat Note',
    description: 'AI 聊天聚合与知识库管理平台',
    siteName: 'AI Chat Note',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Chat Note',
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
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} ${playfair.variable} ${crimson.variable} ${sourceSerif.variable} ${notoSerifSC.variable} ${longCang.variable} ${maShanZheng.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
