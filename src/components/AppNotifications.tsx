'use client';

import { useMantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';

export function AppNotifications() {
  const theme = useMantineTheme();
  // Matches mantine's 'sm' breakpoint (usually 48em / 768px)
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  return (
    <Notifications 
      position={isMobile ? 'top-center' : 'bottom-right'} 
      zIndex={1000} 
    />
  );
}
