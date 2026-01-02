'use client';

import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import { Box } from '@mantine/core';
import React from 'react';

interface SectionsLayoutProps {
  children: React.ReactNode;
}

const SectionsLayout: React.FC<SectionsLayoutProps> = ({ children }) => {
  return (
    <Box style={{ display: 'flex', minHeight: '100dvh', overflowX: 'hidden' }}>
      <Sidebar />
      <Box
        component="main"
        style={{
          flex: 1,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '100%',
          overflowX: 'hidden',
        }}
        ml={{ base: 0, sm: 220 }}
        pb={{ base: 90, sm: 0 }}
      >
        {children}
      </Box>
      <BottomNav />
    </Box>
  );
};

export default SectionsLayout;
