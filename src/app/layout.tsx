import type { Metadata } from 'next';
import { Space_Grotesk, Syne, Manrope } from 'next/font/google';
import { StoreProvider } from '@/components/store';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import './globals.css';
import { MotionProvider } from '@/components/motion-provider';
const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-space', display: 'swap' });
const syne = Syne({ subsets: ['latin'], variable: '--font-syne', display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
export const metadata: Metadata = {
  title: { default: 'CineVibz — Find your next feeling.', template: '%s · CineVibz' },
  description:
    'An unexpected way into movies, series and anime. Follow a mood. Find your next feeling.',
  icons: { icon: '/icon.svg' },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Cursor/accessibility extensions may add attributes to these two elements
    // before hydration. This is shallow: app-component mismatches still warn.
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${space.variable} ${syne.variable} ${manrope.variable}`}
      >
        <MotionProvider>
          <StoreProvider>
            <div id="top" />
            <a className="skip-link" href="#main">
              Skip to content
            </a>
            <Nav />
            {children}
            <Footer />
          </StoreProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
