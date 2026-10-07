import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Data Migration Planner — Enterprise Staging Platform',
  description: 'Plan, validate, version, and execute safe schema migrations with approval workflows and quarantine reconciliation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen selection:bg-indigo-500 selection:text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
