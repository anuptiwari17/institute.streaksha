import './globals.css';
import { Inter } from 'next/font/google';
import { ToastProvider } from '@/components/ui/Toast';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter', // 👈 important
  display: 'swap',
});

export const metadata = {
  title: 'Streaksha — Quiz Platform for Institutes',
  description: 'Run quizzes, track performance, and ace your assessments.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#FAFAF8] text-[#0A0A0A] antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}