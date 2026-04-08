import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import { DashboardBaseLayout } from '@/components/dashboard/DashboardBaseLayout';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Eco-Network Dashboard',
  description: 'Compute Marketplace — Decentralized Docker Compute',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardBaseLayout className={`min-h-screen text-slate-900 ${spaceGrotesk.className}`}>
      {children}
    </DashboardBaseLayout>
  );
}
