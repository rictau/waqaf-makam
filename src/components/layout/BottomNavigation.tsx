import React from 'react';
import { Paper, Box, Typography, useTheme } from '@mui/material';
import { Heart, Users, ShieldCheck } from 'lucide-react';
import type { AppTab } from '../../types';

interface BottomNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isAdminUser: boolean;
  showDonaturTab?: boolean;
}

export const BottomNavigation: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, isAdminUser, showDonaturTab = true }) => {
  const theme = useTheme();
  const donorTab: Array<{ id: AppTab; label: string; icon: typeof Heart; adminOnly?: boolean }> = showDonaturTab
    ? [{ id: 'donatur', label: 'Donatur', icon: Users }]
    : [];
  const tabs: Array<{ id: AppTab; label: string; icon: typeof Heart; adminOnly?: boolean }> = [
    { id: 'donasi', label: 'Donasi', icon: Heart },
    ...donorTab,
    { id: 'admin', label: 'Admin', icon: ShieldCheck, adminOnly: true }
  ];

  return (
    <Paper 
      elevation={0}
      sx={{ 
        flexShrink: 0, zIndex: 40,
        bgcolor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(24px) saturate(180%)', 
        borderTop: '1px solid', borderColor: 'divider', 
        pb: 'max(env(safe-area-inset-bottom), 12px)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.03)'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 60, px: 2, gap: 1 }}>
        {tabs.filter(tab => !tab.adminOnly || isAdminUser).map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <Box
              key={tab.id}
              component="button"
              onClick={() => setActiveTab(tab.id)}
              sx={{ 
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, 
                py: 1, px: 2, border: 'none', bgcolor: 'transparent', cursor: 'pointer', 
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                position: 'relative', borderRadius: 6,
                color: isActive ? 'primary.main' : 'text.disabled',
                '&:hover': { color: isActive ? 'primary.main' : 'text.secondary', bgcolor: isActive ? 'rgba(18, 76, 58, 0.05)' : 'rgba(0,0,0,0.02)' } 
              }}
              style={{ backgroundColor: isActive ? theme.palette.primary.main + '10' : undefined }}
            >
              <Box sx={{ transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', transform: isActive ? 'scale(1.15)' : 'scale(1)', display: 'flex' }}>
                <Icon size={18} strokeWidth={isActive ? 3 : 2} />
              </Box>
              
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, 
                  fontSize: '0.65rem', display: isActive ? 'block' : 'none',
                  animateIn: 'fade-in', duration: 200
                }}
              >
                {tab.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};
