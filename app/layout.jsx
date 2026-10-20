import { Viga, Nunito } from 'next/font/google';
import '../src/styles.css';

// Self-hosted at build time (no render-blocking external request, better privacy
// and performance). Exposed as CSS variables consumed by styles.css.
// Viga = display / headings (single weight 400). Nunito = body text.
const viga = Viga({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
  display: 'swap',
});
const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
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
  themeColor: '#5F58A6',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${viga.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
