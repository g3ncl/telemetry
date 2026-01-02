import { ThemeProviders } from '@/components/ThemeProviders';
import { SUPPORTED_LOCALES, type Locale } from '@/constants';
import { notFound } from 'next/navigation';

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
    <ThemeProviders locale={locale as Locale}>
      {children}
    </ThemeProviders>
  );
}
