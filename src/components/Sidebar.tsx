'use client';

import { mainNavItems, settingsNavItem } from '@/config/navigation';
import { useActiveRoute } from '@/hooks/useActiveRoute';
import { useBasePath } from '@/hooks/useBasePath';
import { useI18n } from '@/lib/i18n';
import { Box, NavLink, Stack, Text } from '@mantine/core';
import Link from 'next/link';
import React from 'react';

const Sidebar: React.FC = () => {
  const { t } = useI18n();
  const { isActive } = useActiveRoute();
  const basePath = useBasePath();

  return (
    <Box
      component="nav"
      style={{
        width: 220,
        height: '100dvh',
        position: 'fixed',
        left: 0,
        top: 0,
        borderRight: '1px solid var(--mantine-color-default-border)',
        backgroundColor: 'var(--mantine-color-body)',
        display: 'flex',
        flexDirection: 'column',
      }}
      visibleFrom="sm"
    >
      <Box
        px="md"
        py="md"
        style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
      >
        <Text size="lg" fw={700}>
          {t.appName}
        </Text>
      </Box>

      <Stack gap={4} px="xs" py="xs" style={{ flex: 1 }}>
        {mainNavItems.map((item) => (
          <NavLink
            key={item.id}
            component={Link}
            href={`${basePath}${item.path}`}
            label={t.nav[item.labelKey as keyof typeof t.nav]}
            leftSection={item.icon}
            active={isActive(item.path)}
            variant="filled"
            styles={{
              root: { borderRadius: 'var(--mantine-radius-sm)' },
            }}
          />
        ))}
      </Stack>

      <Box
        px="xs"
        py="xs"
        style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
      >
        <NavLink
          component={Link}
          href={`${basePath}${settingsNavItem.path}`}
          label={t.nav[settingsNavItem.labelKey as keyof typeof t.nav]}
          leftSection={settingsNavItem.icon}
          active={isActive(settingsNavItem.path)}
          variant="filled"
          styles={{
            root: { borderRadius: 'var(--mantine-radius-sm)' },
          }}
        />
      </Box>
    </Box>
  );
};

export default Sidebar;
