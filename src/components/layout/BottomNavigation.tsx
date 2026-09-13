import React from 'react';
import { Box, Typography } from '@mui/material';
import { Heart, Users, ShieldCheck } from 'lucide-react';
import { c, eyebrow } from '../../design';
import type { AppTab } from '../../types';

interface BottomNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isAdminUser: boolean;
  showDonaturTab?: boolean;
}

/**
 * Solid navigation bar: opaque surface, one structural top rule, and labels
 * that are always visible (the old version hid them until active, which moved
 * the icons on every tab change). Active state is a forest top marker.
 */
export const BottomNavigation: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, isAdminUser, showDonaturTab = true }) => {
  const donorTab: Array<{ id: AppTab; label: string; icon: typeof Heart; adminOnly?: boolean }> = showDonaturTab
    ? [{ id: 'donatur', label: 'Donatur', icon: Users }]
    : [];
  const tabs: Array<{ id: AppTab; label: string; icon: typeof Heart; adminOnly?: boolean }> = [
    { id: 'donasi', label: 'Donasi', icon: Heart },
    ...donorTab,
    { id: 'admin', label: 'Admin', icon: ShieldCheck, adminOnly: true }
  ];

  return (
    <Box
      component="nav"
      aria-label="Navigasi utama"
      sx={{
        flexShrink: 0,
        zIndex: 40,
        bgcolor: c.paper,
        borderTop: `1px solid ${c.ruleStrong}`,
        pb: 'max(env(safe-area-inset-bottom), 8px)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'stretch', height: 62 }}>
        {tabs.filter(tab => !tab.adminOnly || isAdminUser).map((tab, i) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <Box
              key={tab.id}
              component="button"
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => setActiveTab(tab.id)}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                py: 1,
                border: 'none',
                borderLeft: i === 0 ? 'none' : `1px solid ${c.rule}`,
                borderTop: `3px solid ${isActive ? c.forest : 'transparent'}`,
                bgcolor: isActive ? c.forestTint : 'transparent',
                color: isActive ? c.forest : c.inkMuted,
                cursor: 'pointer',
                transition: 'background-color 150ms ease, color 150ms ease, border-color 150ms ease',
                '&:hover': { color: c.forest, bgcolor: isActive ? c.forestTint : 'rgba(20,58,40,0.035)' },
                '&:active': { transform: 'scale(0.98)' },
              }}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.75} />
              <Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'inherit', letterSpacing: '0.02em' }}>
                {tab.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
