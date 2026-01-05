import type { NavItem } from '@/types/types';
import { BarChart3, FileInput, Save, Settings } from 'lucide-react';

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
    id: 'settings',
    labelKey: 'settings',
    icon: <Settings size={20} />,
    path: '/settings',
  },
];

export const mainNavItems = navItems.slice(0, 3);
export const settingsNavItem = navItems[3];
