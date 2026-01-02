import type { Section } from '@/types/types';
import { BarChart3, Database, FileDown, Settings } from 'lucide-react';
import React from 'react';

export interface NavItemConfig {
  id: Section;
  path: string;
  labelKey: 'extract' | 'savedLaps' | 'analyze' | 'settings';
  icon: React.ReactNode;
}

export const navItems: NavItemConfig[] = [
  { id: 'extract', path: '/extract', labelKey: 'extract', icon: <FileDown size={18} /> },
  { id: 'saved', path: '/saved', labelKey: 'savedLaps', icon: <Database size={18} /> },
  { id: 'analyze', path: '/analyze', labelKey: 'analyze', icon: <BarChart3 size={18} /> },
  { id: 'settings', path: '/settings', labelKey: 'settings', icon: <Settings size={18} /> },
];

export const mainNavItems = navItems.slice(0, 3);
export const settingsNavItem = navItems[3];
