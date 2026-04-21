import './global.css';
import { Inter, Manrope } from 'next/font/google';
import { GlobalLoaderProvider } from '@/components/ui/global-loader-provider';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fontDisplay = Manrope({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata = {
  title: 'Wrectifai Web',
  description: 'Wrectifai Next.js frontend',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/wrectifai_logo.png" type="image/png" />
      </head>
      <body
        className={`${fontSans.variable} ${fontDisplay.variable} bg-background text-foreground antialiased`}
      >
        <GlobalLoaderProvider>{children}</GlobalLoaderProvider>
      </body>
    </html>
  );
}
