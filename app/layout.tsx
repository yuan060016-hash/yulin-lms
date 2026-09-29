import "./globals.css";
import type { Metadata } from "next";
import { ToastProvider } from "@/components/providers/toaster-provider";
import { ConfettiProvider } from "@/components/providers/confetti-provider";
import { ClientRecovery } from "@/components/client-recovery";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "react-horizontal-scrolling-menu/dist/styles.css";

export const metadata: Metadata = {
  title: "雨林外贸实战课程",
  description: "雨林外贸线上培训课程平台，仅限购买学员学习",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <link rel="dns-prefetch" href="//vod.yfxshowers.com" />
        <link rel="preconnect" href="https://vod.yfxshowers.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//1395361200.vod-qcloud.com" />
        <link rel="preconnect" href="https://1395361200.vod-qcloud.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-slate-50 font-sans antialiased">
        <ClientRecovery />
        <ConfettiProvider />
        <ToastProvider />
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  );
}
