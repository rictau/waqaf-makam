import React from 'react';
import { useTheme } from '@mui/material/styles';

export const IOSToggle = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => {
  const theme = useTheme();
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{ backgroundColor: checked ? theme.palette.primary.main : '#e2e8f0' }}
      className={`w-9 h-5 rounded-full transition-colors duration-300 relative focus:outline-none`}
    >
      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-300 ${checked ? 'translate-x-4 left-0.5' : 'translate-x-0.5 left-0'}`} />
    </button>
  );
};
