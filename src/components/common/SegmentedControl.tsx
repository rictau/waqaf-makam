import React from 'react';
import { Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export interface SegmentedControlOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export const SegmentedControl = ({ 
  options, 
  active, 
  onChange 
}: { 
  options: SegmentedControlOption[], 
  active: string, 
  onChange: (v: string) => void 
}) => {
  const theme = useTheme();
  return (
    <div className="flex bg-slate-100 p-0.5 rounded-lg w-full border border-slate-200/50">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          style={{ 
            color: active === opt.id ? theme.palette.primary.main : undefined,
            backgroundColor: active === opt.id ? 'white' : 'transparent'
          }}
          className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center ${
            active === opt.id 
            ? 'shadow-sm border border-slate-200/50' 
            : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {opt.icon && <span className="mr-1">{opt.icon}</span>}
          <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>{opt.label}</Typography>
        </button>
      ))}
    </div>
  );
};
