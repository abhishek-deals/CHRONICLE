import type { Metadata } from 'next';
import { Cinzel_Decorative, Lora } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const gameFont = Cinzel_Decorative({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-press-start',
  display: 'swap',
});

const bodyFont = Lora({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Chronicle — Life RPG',
  description: 'Turn Your Life Into a Legend. Gamify your daily tasks with XP, levels, boss battles, and AI-powered quest suggestions.',
  keywords: ['life rpg', 'gamification', 'productivity', 'quests', 'xp', 'level up'],
  openGraph: {
    title: 'Chronicle — Life RPG',
    description: 'Turn Your Life Into a Legend.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${gameFont.variable} ${bodyFont.variable}`}>
      <body className="font-inter bg-gray-950 text-gray-100 min-h-screen antialiased">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a0a2e',
              border: '1px solid #7c3aed',
              color: '#e2e8f0',
              fontFamily: 'var(--font-inter)',
            },
          }}
        />
      </body>
    </html>
  );
}
