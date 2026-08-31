import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SynerPlat｜ESG、政策与研究情报平台',
  description: '每日检索可靠新闻、政策、学术论文、白皮书和行业报告，并以可视化方式呈现。',
  openGraph: {
    title: 'SynerPlat｜ESG、政策与研究情报平台',
    description: '每日检索可靠新闻、政策、学术论文、白皮书和行业报告。',
    images: [{ url: '/og.png', width: 1731, height: 909, alt: 'SynerPlat ESG 与研究情报平台' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SynerPlat｜ESG、政策与研究情报平台',
    description: '每日检索可靠新闻、政策、学术论文、白皮书和行业报告。',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
