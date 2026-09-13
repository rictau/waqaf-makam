import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App.tsx';
import theme from './theme';
import './index.css';
import { updateDocumentMetadata } from './utils/metadata';

// Typefaces (Fraunces display serif + Plus Jakarta Sans) are loaded in index.html
// so the masthead paints with the right face on first frame.

updateDocumentMetadata({});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
