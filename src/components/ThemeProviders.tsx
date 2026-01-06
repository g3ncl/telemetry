'use client';

import { AppNotifications } from '@/components/AppNotifications';
import { I18nProvider } from '@/lib/i18n';
import { createTheme, MantineProvider } from '@mantine/core';
import { ReactNode } from 'react';

interface ThemeProvidersProps {
  children: ReactNode;
}

export function ThemeProviders({ children }: ThemeProvidersProps) {
  const theme = createTheme({
    fontFamily: '"Barlow Semi Condensed", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontFamilyMonospace: '"JetBrains Mono", ui-monospace, monospace',
    primaryColor: 'brand',
    colors: {
      brand: [
        '#ffe5e5',
        '#ffc9c9',
        '#ffa8a8',
        '#ff8787',
        '#ff6b6b',
        '#fa5252',
        '#d62d2d',
        '#c92a2a',
        '#b02525',
        '#962020',
      ],
      dark: [
        '#C1C2C5',
        '#A6A7AB',
        '#909296',
        '#5c5f66',
        '#373A40',
        '#2C2E33',
        '#25262b',
        '#1A1B1E',
        '#141517',
        '#101113',
      ],
    },
    defaultRadius: 'sm',
    components: {
      Notification: {
        styles: (_theme: unknown, props: { color?: string }) => {
          if (props.color === 'green') {
            return {
              root: {
                // Mix green-filled with body background, 75% green
                backgroundColor: 'color-mix(in srgb, var(--mantine-color-green-filled), var(--mantine-color-body) 25%)',
                borderColor: 'transparent',
              },
              title: {
                color: 'var(--mantine-color-white)',
              },
              description: {
                color: 'var(--mantine-color-white)',
              },
              icon: {
                backgroundColor: 'transparent',
                color: 'var(--mantine-color-white)',
              },
              closeButton: {
                color: 'var(--mantine-color-white)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              },
            };
          }
          return {};
        },
      },
    },
  });

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <AppNotifications />
      <I18nProvider>{children}</I18nProvider>
    </MantineProvider>
  );
}
