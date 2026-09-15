import './globals.css'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { ToastProvider } from '@/components/providers/toaster-provider'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import 'react-horizontal-scrolling-menu/dist/styles.css'

const ConfettiProvider = dynamic(
  () =>
    import('@/components/providers/confetti-provider').then(
      (m) => m.ConfettiProvider
    ),
  { ssr: false }
)

export const metadata: Metadata = {
  title: '雨林外贸实战课程',
  description: '雨林外贸线上培训课程平台，仅限购买学员学习',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="dns-prefetch" href="//1395361200.vod-qcloud.com" />
        <link rel="preconnect" href="https://1395361200.vod-qcloud.com" crossOrigin="" />
        <link rel="dns-prefetch" href="//web.sdk.qcloud.com" />
      </head>
      <body className="min-h-screen bg-slate-50 font-sans antialiased">
        <ConfettiProvider />
        <ToastProvider />
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  )
}
