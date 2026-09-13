import React, { useState } from 'react';
import { Box, Typography, IconButton, Paper, TextField, Button, Avatar, InputAdornment } from '@mui/material';
import { User, Settings, X, ShieldCheck, MapPin, LogOut } from 'lucide-react';
import { signInWithEmailAndPassword, signOut, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '../../firebase';
import { useTheme } from '@mui/material/styles';
import type { PublicConfig } from '../../types';

interface HeaderProps {
  user: FirebaseUser | null;
  isAdminUser: boolean;
  onAdminClick: () => void;
  publicConfig: PublicConfig;
}

export const Header: React.FC<HeaderProps> = ({ user, isAdminUser, onAdminClick, publicConfig }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const theme = useTheme();

  return (
    <>
      <Box sx={{ pt: 1.25, pb: 1.25, px: 2, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', position: 'relative' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {publicConfig.logos.map((logo, idx) => (
              <React.Fragment key={logo.src}>
                {idx > 0 && (
                  <Typography variant="body2" sx={{ color: 'text.disabled', fontWeight: 900, mx: 0.25 }}>
                    ×
                  </Typography>
                )}
                <img
                  src={logo.src}
                  alt={logo.alt}
                  style={{ height: 36, width: 'auto', objectFit: 'contain' }}
                />
              </React.Fragment>
            ))}
          </Box>

          <IconButton 
            onClick={async () => {
              if (user) {
                if (isAdminUser) {
                  onAdminClick();
                } else {
                  if (window.confirm(`Login sebagai ${user.email}.\nLogout?`)) {
                    signOut(auth);
                  }
                }
              } else {
                setShowLogin(!showLogin);
              }
            }}
            sx={{ 
              bgcolor: isAdminUser ? 'rgba(19, 56, 39, 0.08)' : 'background.default', 
              color: isAdminUser ? 'primary.main' : 'text.secondary',
              border: '1px solid', borderColor: 'divider',
              width: 36, height: 36,
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            {isAdminUser ? <Settings size={18} /> : <User size={18} />}
          </IconButton>
        </Box>

        {!user && showLogin && (
          <Paper 
            elevation={0}
            sx={{ 
              position: 'absolute', top: 50, left: 16, right: 16, zIndex: 100, p: 3, 
              borderRadius: 4, border: '1px solid', borderColor: 'divider',
              boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
              animateIn: 'fade-in slide-in-from-top-4', duration: 300 
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                   <ShieldCheck size={18} />
                </Avatar>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Admin Login</Typography>
              </Box>
              <IconButton size="small" onClick={() => setShowLogin(false)} sx={{ color: 'text.disabled' }}>
                <X size={20} />
              </IconButton>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
              <TextField 
                fullWidth size="small" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} 
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><User size={16} /></InputAdornment>, sx: { borderRadius: 2 } } }} 
              />
              <TextField 
                fullWidth size="small" type="password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)} 
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><ShieldCheck size={16} /></InputAdornment>, sx: { borderRadius: 2 } } }} 
              />
            </Box>

            <Button 
              variant="contained" fullWidth onClick={async () => { try { await signInWithEmailAndPassword(auth, email, password); setShowLogin(false); } catch (error) { alert(error instanceof Error ? error.message : "Gagal Login"); } }} 
              sx={{ py: 1.2, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, borderRadius: 2, boxShadow: 0 }}
            >
              Login
            </Button>
          </Paper>
        )}
      </Box>

      <Box sx={{ 
        pt: 2.2, pb: 2.2, px: 3, bgcolor: 'primary.main', color: 'white', 
        backgroundImage: 'linear-gradient(135deg, rgba(10, 34, 23, 1) 0%, rgba(19, 56, 39, 1) 100%)', 
        position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backdropFilter: 'blur(8px)' 
      }}>
        <Typography variant="h2" sx={{ fontWeight: 900, color: 'white', lineHeight: 1.25, fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
          {publicConfig.campaignTitle}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', opacity: 0.95, mt: 0.75 }}>
          <MapPin size={12} style={{ marginRight: 6, color: theme.palette.secondary.main }} /> 
          <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: 0.2 }}>
            {publicConfig.locationText}
          </Typography>
        </Box>
      </Box>
    </>
  );
};
