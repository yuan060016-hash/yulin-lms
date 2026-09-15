import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ToastProvider } from '@/components/providers/toaster-provider'
import { ConfettiProvider } from '@/components/providers/confetti-provider'
import { AntdRegistry } from '@ant-design/nextjs-registry';
import 'react-horizontal-scrolling-menu/dist/styles.css';

const inter = Inter({ subsets: ['latin'] })

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
      <body className={inter.className}>
        <ConfettiProvider />
        <ToastProvider />
        <AntdRegistry>
          {children}
        </AntdRegistry>
      </body>
    </html>
  )
}
