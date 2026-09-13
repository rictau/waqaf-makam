import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { c, eyebrow, mono, radius } from '../../design';
import { Eyebrow } from './primitives';

export function ErrorView({ error }: { error: unknown }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, bgcolor: c.canvas }}>
      <Box sx={{ maxWidth: 420, width: '100%', p: 3, bgcolor: c.paper, border: `1px solid ${c.ruleStrong}`, borderRadius: radius.lg }}>
        <Eyebrow sx={{ color: c.danger }}>Kesalahan Aplikasi</Eyebrow>
        <Typography variant="h2" sx={{ mt: 1, color: c.ink }}>
          Terjadi Kesalahan
        </Typography>
        <Typography sx={{ mt: 1.25, fontSize: '0.875rem', lineHeight: 1.6, color: c.inkMuted }}>
          Mohon maaf, aplikasi mengalami kendala teknis. Silakan muat ulang halaman atau hubungi admin.
        </Typography>
        {error && (
          <Box sx={{ mt: 2, px: 1.5, py: 1.25, bgcolor: c.well, borderLeft: `3px solid ${c.danger}`, borderRadius: `0 ${radius.md} ${radius.md} 0` }}>
            <Typography component="pre" sx={{ m: 0, fontFamily: mono, fontSize: '0.6875rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: c.danger }}>
              {error instanceof Error ? error.message : String(error)}
            </Typography>
          </Box>
        )}
        <Button
          variant="contained"
          fullWidth
          onClick={() => window.location.reload()}
          sx={{ mt: 2.5, py: 1.25, ...eyebrow, fontSize: '0.6875rem', color: c.paper }}
        >
          Muat Ulang Halaman
        </Button>
      </Box>
    </Box>
  );
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: unknown }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorView error={this.state.error} />;
    }
    return this.props.children;
  }
}
