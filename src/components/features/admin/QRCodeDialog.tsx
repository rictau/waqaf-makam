import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
  Tab,
  Tabs,
  CircularProgress
} from '@mui/material';
import {
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  Printer
} from 'lucide-react';
import QRCode from 'qrcode';
import { c, eyebrow, radius } from '../../../design';
import { Eyebrow } from '../../common/primitives';

interface QRCodeDialogProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  campaignTitle: string;
  shortName: string;
  locationText?: string;
}

export const QRCodeDialog: React.FC<QRCodeDialogProps> = ({
  open,
  onClose,
  campaignId,
  campaignTitle,
  shortName,
  locationText
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'standee'>('qr');
  const [url, setUrl] = useState('');
  const [includeLogo, setIncludeLogo] = useState(true);
  const [colorMode, setColorMode] = useState<'forest' | 'black'>('forest');
  const [isCopied, setIsCopied] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [standeeDataUrl, setStandeeDataUrl] = useState<string>('');

  // When dialog opens, initialize with canonical ziswaf.kmii.jp URL
  useEffect(() => {
    if (open) {
      setUrl(`https://ziswaf.kmii.jp/${campaignId || 'pemakaman'}`);
      setIsCopied(false);
    }
  }, [open, campaignId]);

  const fgColor = colorMode === 'forest' ? '#1E3A2F' : '#000000';

  // Render QR Code and Standee to offscreen canvases
  useEffect(() => {
    if (!open || !url) return;

    let isMounted = true;
    setIsRendering(true);

    const renderQR = async () => {
      try {
        // 1. Offscreen canvas for QR Code (1024x1024)
        const qrCanvas = document.createElement('canvas');
        qrCanvas.width = 1024;
        qrCanvas.height = 1024;

        await QRCode.toCanvas(qrCanvas, url, {
          errorCorrectionLevel: 'H',
          width: 1024,
          margin: 2,
          color: {
            dark: fgColor,
            light: '#FFFFFF'
          }
        });

        // 2. Draw center KMII logo badge if enabled
        if (includeLogo) {
          const ctx = qrCanvas.getContext('2d');
          if (ctx) {
            const logoImg = new Image();
            logoImg.crossOrigin = 'anonymous';
            logoImg.src = '/kmii-logo.png';

            await new Promise<void>((resolve) => {
              logoImg.onload = () => resolve();
              logoImg.onerror = () => resolve();
            });

            if (!isMounted) return;

            const canvasWidth = 1024;
            const targetLogoSize = Math.round(canvasWidth * 0.22);
            const badgePadding = Math.round(targetLogoSize * 0.08);
            const badgeTotalSize = targetLogoSize + badgePadding * 2;
            const startX = Math.round((canvasWidth - badgeTotalSize) / 2);
            const startY = Math.round((canvasWidth - badgeTotalSize) / 2);
            const cornerRadius = Math.round(badgeTotalSize * 0.16);

            ctx.save();
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.roundRect(startX, startY, badgeTotalSize, badgeTotalSize, cornerRadius);
            ctx.fill();

            ctx.strokeStyle = '#E5DFD7';
            ctx.lineWidth = 4;
            ctx.stroke();

            if (logoImg.complete && logoImg.naturalWidth > 0) {
              ctx.drawImage(
                logoImg,
                startX + badgePadding,
                startY + badgePadding,
                targetLogoSize,
                targetLogoSize
              );
            }
            ctx.restore();
          }
        }

        const generatedQrUrl = qrCanvas.toDataURL('image/png');
        if (isMounted) setQrDataUrl(generatedQrUrl);

        // 3. Offscreen canvas for Standee Flyer (1000x1400)
        const standeeCanvas = document.createElement('canvas');
        const W = 1000;
        const H = 1400;
        standeeCanvas.width = W;
        standeeCanvas.height = H;

        const sCtx = standeeCanvas.getContext('2d');
        if (sCtx) {
          // Warm stone background
          sCtx.fillStyle = '#FBF9F5';
          sCtx.fillRect(0, 0, W, H);

          // Subtle rounded border
          sCtx.strokeStyle = '#E5DFD7';
          sCtx.lineWidth = 2;
          sCtx.beginPath();
          sCtx.roundRect(30, 30, W - 60, H - 60, 32);
          sCtx.stroke();

          // Header logo
          const kmiiLogo = new Image();
          kmiiLogo.src = '/kmii-logo.png';
          await new Promise<void>((res) => {
            kmiiLogo.onload = () => res();
            kmiiLogo.onerror = () => res();
          });

          const logoW = 80;
          const logoH = 80;
          if (kmiiLogo.complete && kmiiLogo.naturalWidth > 0) {
            sCtx.drawImage(kmiiLogo, (W - logoW) / 2, 75, logoW, logoH);
          }

          // Eyebrow
          sCtx.fillStyle = '#9C6D37'; // brass
          sCtx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
          sCtx.textAlign = 'center';
          sCtx.fillText('KMII JEPANG', W / 2, 195);

          // Campaign Title
          sCtx.fillStyle = '#1E3A2F';
          sCtx.font = 'bold 42px "Fraunces", Georgia, serif';
          const displayTitle = campaignTitle || shortName || 'Program Donasi & ZISWAF';
          if (displayTitle.length > 35) {
            const words = displayTitle.split(' ');
            const mid = Math.ceil(words.length / 2);
            const line1 = words.slice(0, mid).join(' ');
            const line2 = words.slice(mid).join(' ');
            sCtx.fillText(line1, W / 2, 255);
            sCtx.fillText(line2, W / 2, 305);
          } else {
            sCtx.fillText(displayTitle, W / 2, 270);
          }

          // Subtitle / Location
          sCtx.fillStyle = '#6B7280';
          sCtx.font = '500 22px "Plus Jakarta Sans", sans-serif';
          const subLoc = locationText ? `${locationText} · KMII Jepang` : 'Keluarga Masyarakat Islam Indonesia (KMII) Jepang';
          sCtx.fillText(subLoc, W / 2, 345);

          // Divider rule
          sCtx.strokeStyle = '#E5DFD7';
          sCtx.lineWidth = 1.5;
          sCtx.beginPath();
          sCtx.moveTo(150, 380);
          sCtx.lineTo(W - 150, 380);
          sCtx.stroke();

          // QR Card Frame
          const qrCardSize = 600;
          const qrCardX = (W - qrCardSize) / 2;
          const qrCardY = 415;
          sCtx.fillStyle = '#FFFFFF';
          sCtx.strokeStyle = '#E5DFD7';
          sCtx.lineWidth = 2;
          sCtx.beginPath();
          sCtx.roundRect(qrCardX, qrCardY, qrCardSize, qrCardSize, 32);
          sCtx.fill();
          sCtx.stroke();

          // Draw QR onto card
          const qrInnerPadding = 30;
          const qrDrawSize = qrCardSize - qrInnerPadding * 2;
          sCtx.drawImage(
            qrCanvas,
            qrCardX + qrInnerPadding,
            qrCardY + qrInnerPadding,
            qrDrawSize,
            qrDrawSize
          );

          // Action Heading
          sCtx.fillStyle = '#1E3A2F';
          sCtx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
          sCtx.fillText('PINDAI UNTUK DONASI & CEK PROGRES', W / 2, 1080);

          // Pill button with URL
          const pillW = 460;
          const pillH = 72;
          const pillX = (W - pillW) / 2;
          const pillY = 1125;
          sCtx.fillStyle = '#1E3A2F';
          sCtx.beginPath();
          sCtx.roundRect(pillX, pillY, pillW, pillH, 36);
          sCtx.fill();

          sCtx.fillStyle = '#FFFFFF';
          sCtx.font = 'bold 28px "Plus Jakarta Sans", monospace';
          const cleanDisplayUrl = url.replace(/^https?:\/\//, '');
          sCtx.fillText(cleanDisplayUrl, W / 2, pillY + 46);

          // Footer
          sCtx.fillStyle = '#6B7280';
          sCtx.font = '500 20px "Plus Jakarta Sans", sans-serif';
          sCtx.fillText('Keluarga Masyarakat Islam Indonesia (KMII) Jepang', W / 2, 1265);

          const generatedStandeeUrl = standeeCanvas.toDataURL('image/png');
          if (isMounted) setStandeeDataUrl(generatedStandeeUrl);
        }
      } catch (err) {
        console.error('Failed to render QR/Standee:', err);
      } finally {
        if (isMounted) setIsRendering(false);
      }
    };

    renderQR();

    return () => {
      isMounted = false;
    };
  }, [open, url, includeLogo, fgColor, campaignTitle, shortName, locationText]);

  const handleCopyLink = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `qr-code-${campaignId || 'ziswaf'}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleDownloadStandee = () => {
    if (!standeeDataUrl) return;
    const link = document.createElement('a');
    link.download = `standee-${campaignId || 'ziswaf'}.png`;
    link.href = standeeDataUrl;
    link.click();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: radius.lg,
            overflowX: 'hidden'
          }
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: `1px solid ${c.rule}`, pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrCode size={20} color={c.forest} />
          <Eyebrow tone="brass">Generator QR Code Program</Eyebrow>
        </Box>
        <Typography variant="h2" sx={{ fontSize: '1.25rem', color: c.ink, mt: 0.5 }}>
          {shortName || campaignTitle || 'Program Donasi'}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5, overflowX: 'hidden' }}>
        {/* Tabs: QR Code vs Standee */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            textColor="primary"
            indicatorColor="primary"
            sx={{ minHeight: 40 }}
          >
            <Tab
              value="qr"
              label="QR Code Saja (PNG)"
              sx={{ ...eyebrow, fontSize: '0.6875rem', minHeight: 40, py: 0.5 }}
            />
            <Tab
              value="standee"
              label="Flyer Standee Siap Cetak"
              sx={{ ...eyebrow, fontSize: '0.6875rem', minHeight: 40, py: 0.5 }}
            />
          </Tabs>
        </Box>

        {/* URL Field */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Eyebrow sx={{ fontSize: '0.625rem' }}>Tautan Program (ziswaf.kmii.jp):</Eyebrow>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              helperText="URL halaman donasi yang terbuka saat donatur memindai QR code."
            />
            <Tooltip title={isCopied ? 'Tersalin!' : 'Salin Tautan'}>
              <IconButton
                onClick={handleCopyLink}
                color={isCopied ? 'success' : 'default'}
                sx={{ height: 40, width: 40, border: `1px solid ${c.rule}`, mt: 0.25 }}
              >
                {isCopied ? <Check size={18} /> : <Copy size={18} />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Buka Halaman">
              <IconButton
                component="a"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ height: 40, width: 40, border: `1px solid ${c.rule}`, mt: 0.25 }}
              >
                <ExternalLink size={18} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Options */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: c.well, p: 1.5, borderRadius: radius.md, border: `1px solid ${c.rule}`, flexWrap: 'wrap', gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={includeLogo}
                onChange={(e) => setIncludeLogo(e.target.checked)}
                size="small"
                color="primary"
              />
            }
            label={<Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: c.ink }}>Logo KMII di Tengah</Typography>}
            sx={{ m: 0 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={colorMode === 'forest'}
                onChange={(e) => setColorMode(e.target.checked ? 'forest' : 'black')}
                size="small"
                color="primary"
              />
            }
            label={
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: c.ink }}>
                Warna Hijau KMII ({colorMode === 'forest' ? 'Hijau' : 'Hitam'})
              </Typography>
            }
            sx={{ m: 0 }}
          />
        </Box>

        {/* Visual Previews - Completely responsive, zero window overflow */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2, bgcolor: c.well, borderRadius: radius.lg, border: `1px solid ${c.rule}`, minHeight: 250 }}>
          {isRendering && !qrDataUrl ? (
            <CircularProgress size={32} sx={{ color: c.forest, my: 4 }} />
          ) : (
            <>
              {/* QR Code Tab View */}
              <Box sx={{ display: activeTab === 'qr' ? 'flex' : 'none', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: '#FFFFFF',
                    borderRadius: radius.md,
                    border: `1px solid ${c.rule}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    maxWidth: 240,
                    width: '100%',
                    aspectRatio: '1/1'
                  }}
                >
                  {qrDataUrl && (
                    <Box
                      component="img"
                      src={qrDataUrl}
                      alt="Pratinjau QR Code"
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        display: 'block'
                      }}
                    />
                  )}
                </Box>
                <Typography sx={{ fontSize: '0.75rem', color: c.inkMuted, mt: 1.5, textAlign: 'center' }}>
                  Resolusi tinggi 1024×1024 px · Format PNG jernih untuk flyer, media sosial, atau stiker.
                </Typography>
              </Box>

              {/* Standee Tab View */}
              <Box sx={{ display: activeTab === 'standee' ? 'flex' : 'none', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <Box
                  sx={{
                    bgcolor: '#FFFFFF',
                    borderRadius: radius.md,
                    border: `1px solid ${c.rule}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                    maxWidth: 220,
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center'
                  }}
                >
                  {standeeDataUrl && (
                    <Box
                      component="img"
                      src={standeeDataUrl}
                      alt="Pratinjau Standee Flyer"
                      sx={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: 308,
                        objectFit: 'contain',
                        display: 'block'
                      }}
                    />
                  )}
                </Box>
                <Typography sx={{ fontSize: '0.75rem', color: c.inkMuted, mt: 1.5, textAlign: 'center' }}>
                  Standee A4 / Kartu Meja 1000×1400 px · Siap cetak langsung untuk meja registrasi dan masjid.
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: `1px solid ${c.rule}`, justifyContent: 'space-between' }}>
        <Button onClick={onClose} sx={{ ...eyebrow, fontSize: '0.6875rem', color: c.inkMuted }}>
          Tutup
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {activeTab === 'qr' ? (
            <Button
              variant="contained"
              startIcon={<Download size={15} />}
              onClick={handleDownloadQR}
              disabled={isRendering || !qrDataUrl}
              sx={{
                ...eyebrow,
                fontSize: '0.6875rem',
                bgcolor: c.forest,
                color: c.paper,
                px: 2.5,
                '&:hover': { bgcolor: c.forestDeep }
              }}
            >
              Unduh QR Code (PNG)
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<Printer size={15} />}
              onClick={handleDownloadStandee}
              disabled={isRendering || !standeeDataUrl}
              sx={{
                ...eyebrow,
                fontSize: '0.6875rem',
                bgcolor: c.forest,
                color: c.paper,
                px: 2.5,
                '&:hover': { bgcolor: c.forestDeep }
              }}
            >
              Unduh Standee Siap Cetak (PNG)
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};
