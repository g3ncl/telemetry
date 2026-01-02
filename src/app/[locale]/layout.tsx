import { ThemeProviders } from '@/components/ThemeProviders';
import { SUPPORTED_LOCALES, type Locale } from '@/constants';
import { ColorSchemeScript } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import type { Metadata } from 'next';
import { Barlow_Semi_Condensed, JetBrains_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import '../globals.css';

const font = Barlow_Semi_Condensed({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800'],
});



export const metadata: Metadata = {
  title: 'Kart Telemetry',
  description: 'GPS telemetry extraction and lap analysis',
};

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!SUPPORTED_LOCALES.includes(locale as Locale)) {
    notFound();
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body className={font.className}>
        <ThemeProviders
          locale={locale as Locale}
          fontFamily={font.style.fontFamily}
          fontFamilyMonospace={mono.style.fontFamily}
        >
          {children}
        </ThemeProviders>
      </body>
    </html>
  );
}
