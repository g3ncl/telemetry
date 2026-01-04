import type { NavItem } from '@/types/types';
import { BarChart3, FileInput, Map, Save, Settings } from 'lucide-react';

export const navItems: (NavItem & { path: string })[] = [
  {
    id: 'extract',
    labelKey: 'extract',
    icon: <FileInput size={20} />,
    path: '/extract',
  },
  {
    id: 'saved',
    labelKey: 'savedLaps',
    icon: <Save size={20} />,
    path: '/saved',
  },
  {
    id: 'analyze',
    labelKey: 'analyze',
    icon: <BarChart3 size={20} />,
    path: '/analyze',
  },
  {
    id: 'tracks',
    labelKey: 'tracks',
    icon: <Map size={20} />,
    path: '/tracks',
  },
  {
    id: 'settings',
    labelKey: 'settings',
    icon: <Settings size={20} />,
    path: '/settings',
  },
];

export const mainNavItems = navItems.slice(0, 4);
export const settingsNavItem = navItems[4];

