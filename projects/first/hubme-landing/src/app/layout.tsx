import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HubMe AI - AI Solutions That Save You 20+ Hours Per Week',
  description: 'Custom AI chatbots, automation workflows, and full-stack web applications. We build AI-powered solutions that deliver measurable results for your business.',
  keywords: 'AI automation, custom chatbot, AI developer, business automation, web application, API development',
  openGraph: {
    title: 'HubMe AI - AI Solutions That Save You 20+ Hours Per Week',
    description: 'Custom AI chatbots, automation workflows, and full-stack web applications.',
    type: 'website',
    url: 'https://hubme.tech',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
