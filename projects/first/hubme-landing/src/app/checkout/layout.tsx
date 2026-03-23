import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Get Started - HubMe AI',
  description: 'Simple and transparent pricing for AI solutions. Choose from Starter, Pro, or Enterprise packages. 30-day money-back guarantee.',
  openGraph: {
    title: 'Get Started - HubMe AI',
    description: 'Simple and transparent pricing for AI solutions.',
    type: 'website',
    url: 'https://hubme.tech/checkout',
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
