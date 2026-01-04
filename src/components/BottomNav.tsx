'use client';

import { navItems } from '@/config/navigation';
import { useActiveRoute } from '@/hooks/useActiveRoute';
import { useI18n } from '@/lib/i18n';
import { ActionIcon, Box, Group, Text } from '@mantine/core';
import Link from 'next/link';
import React from 'react';

const BottomNav: React.FC = () => {
  const { t } = useI18n();
  const { isActive, locale } = useActiveRoute();

  return (
    <Box
      component="nav"
      hiddenFrom="sm"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100vw',
        borderTop: '1px solid var(--mantine-color-default-border)',
        backgroundColor: 'var(--mantine-color-body)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 1000,
      }}
    >
      <Group justify="space-around" align="center" h={72} px="xs">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Box
              key={item.id}
              component={Link}
              href={`/${locale}${item.path}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                textDecoration: 'none',
              }}
            >
              <ActionIcon variant={active ? 'filled' : 'subtle'} size="md">
                {item.icon}
              </ActionIcon>
              <Text size="xs" c={active ? 'var(--mantine-color-text)' : 'dimmed'} mt={2} fw={500}>
                {t.nav[item.labelKey as keyof typeof t.nav]}
              </Text>
            </Box>
          );
        })}
      </Group>
    </Box>
  );
};

export default BottomNav;
