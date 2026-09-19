import React, { useState } from 'react';
import { Box, Typography, IconButton, Paper, TextField, Button, InputAdornment } from '@mui/material';
import { User, Settings, X, MapPin } from 'lucide-react';
import { signInWithEmailAndPassword, signOut, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '../../firebase';
import { c, eyebrow, overlayShadow, radius } from '../../design';
import { Eyebrow } from '../common/primitives';
import type { PublicConfig } from '../../types';

interface HeaderProps {
  user: FirebaseUser | null;
  isAdminUser: boolean;
  onAdminClick: () => void;
  publicConfig: PublicConfig;
  onHomeClick?: () => void;
}

/**
 * Two-band masthead, print-style: an organisation bar (partner logos + account)
 * over a solid forest title band. The title is a left-aligned display-serif
 * headline — no centred hero, no gradient text, no translucency.
 */
export const Header: React.FC<HeaderProps> = ({ user, isAdminUser, onAdminClick, publicConfig, onHomeClick }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Box component="header">
      {/* Organisation bar */}
      <Box sx={{ py: 1.25, px: 2, bgcolor: c.paper, borderBottom: `1px solid ${c.rule}`, position: 'relative' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              minWidth: 0,
              cursor: onHomeClick ? 'pointer' : 'default',
              userSelect: 'none'
            }}
            onClick={onHomeClick}
            title={onHomeClick ? 'Kembali ke Portal Donasi' : undefined}
          >
            {publicConfig.logos.map((logo, i) => (
              <React.Fragment key={logo.src}>
                {i > 0 && <Box sx={{ width: '1px', height: 26, bgcolor: c.rule, flexShrink: 0 }} />}
                <img src={logo.src} alt={logo.alt} style={{ height: 38, width: 'auto', objectFit: 'contain' }} />
              </React.Fragment>
            ))}
          </Box>

          <IconButton
            aria-label={isAdminUser ? 'Buka panel admin' : user ? 'Akun' : 'Login admin'}
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
              bgcolor: isAdminUser ? c.forestTint : c.well,
              color: isAdminUser ? c.forest : c.inkMuted,
              border: `1px solid ${isAdminUser ? c.forest : c.rule}`,
              width: 34,
              height: 34,
              flexShrink: 0,
              '&:hover': { bgcolor: c.forestTint, borderColor: c.forest, color: c.forest },
            }}
          >
            {isAdminUser ? <Settings size={17} /> : <User size={17} />}
          </IconButton>
        </Box>

        {!user && showLogin && (
          <Paper
            elevation={0}
            sx={{
              position: 'absolute',
              top: 56,
              left: 16,
              right: 16,
              zIndex: 100,
              p: 2.5,
              bgcolor: c.paper,
              border: `1px solid ${c.ruleStrong}`,
              borderRadius: radius.lg,
              boxShadow: overlayShadow,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 1.5, borderBottom: `1px solid ${c.rule}` }}>
              <Eyebrow tone="ink">Login Panitia</Eyebrow>
              <IconButton size="small" aria-label="Tutup" onClick={() => setShowLogin(false)} sx={{ color: c.inkFaint, mr: -0.5 }}>
                <X size={18} />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
              <TextField
                fullWidth size="small" label="Email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><User size={15} color={c.inkFaint} /></InputAdornment> } }}
              />
              <TextField
                fullWidth size="small" type="password" label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </Box>

            <Button
              variant="contained" fullWidth
              onClick={async () => { try { await signInWithEmailAndPassword(auth, email, password); setShowLogin(false); } catch (error) { alert(error instanceof Error ? error.message : "Gagal Login"); } }}
              sx={{ py: 1.1, ...eyebrow, color: c.paper, fontSize: '0.6875rem' }}
            >
              Masuk
            </Button>
          </Paper>
        )}
      </Box>

      {/* Title band */}
      <Box
        sx={{
          px: 2.5,
          pt: 2,
          pb: 1.75,
          bgcolor: c.forest,
          borderBottom: `2px solid ${c.brassBright}`,
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        <Eyebrow tone="inverse" sx={{ mb: 0.75, fontSize: '0.625rem' }}>
          {publicConfig.category ? `Program ${publicConfig.category}` : 'Program'} · {publicConfig.shortName}
        </Eyebrow>
        <Typography
          variant="h2"
          sx={{ color: c.paper, fontSize: { xs: '1.25rem', sm: '1.4rem' }, lineHeight: 1.15, maxWidth: '30ch' }}
        >
          {publicConfig.campaignTitle}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1 }}>
          <MapPin size={12} color={c.brassBright} strokeWidth={2.25} />
          <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(251,249,244,0.8)', letterSpacing: '0.01em' }}>
            {publicConfig.locationText}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
