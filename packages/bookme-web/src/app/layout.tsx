import type { Metadata } from 'next';
import '../../styles/global.css';

export const metadata: Metadata = {
  title: 'BookMe - AI Writing Platform',
  description: 'Professional AI-powered writing and content creation platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
