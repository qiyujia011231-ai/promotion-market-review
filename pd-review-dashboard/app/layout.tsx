import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PD大盘复盘 Dashboard',
  description: '上传大盘源数据，自动生成促销大盘复盘图表和数据表。'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
