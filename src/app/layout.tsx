import { ColorSchemeScript } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import type { Metadata } from 'next';
import { Barlow_Semi_Condensed, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const font = Barlow_Semi_Condensed({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Kart Telemetry',
  description: 'GPS telemetry extraction and lap analysis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body className={`${font.className} ${mono.variable}`}>
        {children}
      </body>
    </html>
  );
}
