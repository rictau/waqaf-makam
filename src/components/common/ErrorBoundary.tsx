import React, { Component, ReactNode, ErrorInfo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Paper, Avatar, Typography, Button } from '@mui/material';
import { AlertCircle } from 'lucide-react';

export function ErrorView({ error }: { error: unknown }) {
  const theme = useTheme();
  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        p: 3,
        bgcolor: 'background.default'
      }}
    >
      <Paper 
        elevation={0}
        sx={{ 
          maxWidth: 400, 
          w: '100%', 
          p: 4, 
          textAlign: 'center'
        }}
      >
        <Avatar 
          sx={{ 
            width: 64, 
            height: 64, 
            bgcolor: 'error.light', 
            color: 'error.main',
            mx: 'auto',
            mb: 3
          }}
        >
          <AlertCircle size={32} />
        </Avatar>
        <Typography variant="h2" gutterBottom sx={{ fontWeight: 700 }}>
          Terjadi Kesalahan
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Mohon maaf, aplikasi mengalami kendala teknis. Silakan muat ulang halaman atau hubungi admin.
        </Typography>
        {error && (
          <Box 
            sx={{ 
              bgcolor: 'error.light', 
              p: 2, 
              borderRadius: 2, 
              mb: 3, 
              overflow: 'hidden',
              opacity: 0.8
            }}
          >
            <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-words', color: 'error.dark' }}>
              {error instanceof Error ? error.message : String(error)}
            </Typography>
          </Box>
        )}
        <Button 
          variant="contained" 
          fullWidth 
          size="large"
          onClick={() => window.location.reload()}
          sx={{ py: 1.5 }}
        >
          Muat Ulang Halaman
        </Button>
      </Paper>
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
