import { Nunito, Figtree } from 'next/font/google';
import '../src/styles.css';

// Self-hosted at build time (no render-blocking external request, better privacy
// and performance). Exposed as CSS variables consumed by styles.css.
const nunito = Nunito({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});
const figtree = Figtree({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata = {
  title: 'BalanceConnect — a calmer way to manage teaching messages',
  description: 'Set clear availability, triage student messages, protect family time, and review your well-being. Clear boundaries, meaningful connections.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#7A62C4',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${nunito.variable} ${figtree.variable}`}>
      <body>{children}</body>
    </html>
  );
}
