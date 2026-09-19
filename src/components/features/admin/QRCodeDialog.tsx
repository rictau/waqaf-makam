import React, { useState, useEffect, useRef } from 'react';
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
  Chip
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
  const [domainOption, setDomainOption] = useState<'ziswaf' | 'infaq' | 'honjo' | 'custom'>('ziswaf');
  const [url, setUrl] = useState('');
  const [includeLogo, setIncludeLogo] = useState(true);
  const [colorMode, setColorMode] = useState<'forest' | 'black'>('forest');
  const [isCopied, setIsCopied] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const standeeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Default URL logic based on campaign
  useEffect(() => {
    const slug = campaignId || 'pemakaman';
    if (domainOption === 'ziswaf') {
      setUrl(`https://ziswaf.kmii.jp/${slug}`);
    } else if (domainOption === 'infaq') {
      setUrl(`https://infaq.kmii.jp/${slug}`);
    } else if (domainOption === 'honjo') {
      setUrl('https://honjo.kmii.jp');
    }
  }, [campaignId, domainOption]);

  // When dialog opens, reset to ziswaf domain
  useEffect(() => {
    if (open) {
      setDomainOption('ziswaf');
      setUrl(`https://ziswaf.kmii.jp/${campaignId || 'pemakaman'}`);
      setIsCopied(false);
    }
  }, [open, campaignId]);

  const fgColor = colorMode === 'forest' ? '#1E3A2F' : '#000000';

  // Render QR Code onto canvas
  useEffect(() => {
    if (!open || !url) return;

    let isMounted = true;
    setIsRendering(true);

    const renderQR = async () => {
      try {
        const qrCanvas = qrCanvasRef.current;
        if (!qrCanvas) return;

        // 1. Generate base high-res QR code (1024x1024)
        await QRCode.toCanvas(qrCanvas, url, {
          errorCorrectionLevel: 'H',
          width: 1024,
          margin: 2,
          color: {
            dark: fgColor,
            light: '#FFFFFF'
          }
        });

        // 2. If includeLogo is true, draw KMII logo badge in center
        if (includeLogo) {
          const ctx = qrCanvas.getContext('2d');
          if (!ctx) return;

          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          logoImg.src = '/kmii-logo.png';

          await new Promise<void>((resolve) => {
            logoImg.onload = () => resolve();
            logoImg.onerror = () => resolve(); // fallback gracefully
          });

          if (!isMounted) return;

          const canvasWidth = qrCanvas.width;
          const targetLogoSize = Math.round(canvasWidth * 0.22);
          const badgePadding = Math.round(targetLogoSize * 0.08);
          const badgeTotalSize = targetLogoSize + badgePadding * 2;
          const startX = Math.round((canvasWidth - badgeTotalSize) / 2);
          const startY = Math.round((canvasWidth - badgeTotalSize) / 2);
          const cornerRadius = Math.round(badgeTotalSize * 0.16);

          // Draw rounded white background
          ctx.save();
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.roundRect(startX, startY, badgeTotalSize, badgeTotalSize, cornerRadius);
          ctx.fill();

          // Subtle hairline border around badge
          ctx.strokeStyle = '#E5DFD7';
          ctx.lineWidth = 4;
          ctx.stroke();

          // Draw logo
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

        // 3. Render Standee Canvas (1000 x 1400)
        const standeeCanvas = standeeCanvasRef.current;
        if (standeeCanvas) {
          const sCtx = standeeCanvas.getContext('2d');
          if (sCtx) {
            const W = 1000;
            const H = 1400;
            standeeCanvas.width = W;
            standeeCanvas.height = H;

            // Background stone
            sCtx.fillStyle = '#FBF9F5';
            sCtx.fillRect(0, 0, W, H);

            // Subtle outer border
            sCtx.strokeStyle = '#E5DFD7';
            sCtx.lineWidth = 2;
            sCtx.beginPath();
            sCtx.roundRect(30, 30, W - 60, H - 60, 32);
            sCtx.stroke();

            // Load header logos
            const kmiiLogo = new Image();
            kmiiLogo.src = '/kmii-logo.png';
            await new Promise<void>((res) => {
              kmiiLogo.onload = () => res();
              kmiiLogo.onerror = () => res();
            });

            // Draw header KMII logo
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

            // Title
            sCtx.fillStyle = '#1E3A2F';
            sCtx.font = 'bold 42px "Fraunces", Georgia, serif';
            const displayTitle = campaignTitle || shortName || 'Program Donasi & Wakaf';
            // Simple wrap if title is too long
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

            // Subtitle location & info
            sCtx.fillStyle = '#6B7280';
            sCtx.font = '500 22px "Plus Jakarta Sans", sans-serif';
            const subLoc = locationText ? `${locationText} · KMII Jepang` : 'Keluarga Masyarakat Islam Indonesia (KMII) Jepang';
            sCtx.fillText(subLoc, W / 2, 345);

            // Divider hairline
            sCtx.strokeStyle = '#E5DFD7';
            sCtx.lineWidth = 1.5;
            sCtx.beginPath();
            sCtx.moveTo(150, 380);
            sCtx.lineTo(W - 150, 380);
            sCtx.stroke();

            // QR Frame Card
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

            // Draw QR code onto Standee card
            const qrInnerPadding = 30;
            const qrDrawSize = qrCardSize - qrInnerPadding * 2;
            sCtx.drawImage(
              qrCanvas,
              qrCardX + qrInnerPadding,
              qrCardY + qrInnerPadding,
              qrDrawSize,
              qrDrawSize
            );

            // Action Callout
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

            // Footer note
            sCtx.fillStyle = '#6B7280';
            sCtx.font = '500 20px "Plus Jakarta Sans", sans-serif';
            sCtx.fillText('Keluarga Masyarakat Islam Indonesia (KMII) Jepang', W / 2, 1265);
          }
        }
      } catch (err) {
        console.error('Failed to generate QR Code canvas:', err);
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
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `qr-code-${campaignId || 'ziswaf'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleDownloadStandee = () => {
    const canvas = standeeCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `standee-${campaignId || 'ziswaf'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ borderBottom: `1px solid ${c.rule}`, pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrCode size={20} color={c.forest} />
          <Eyebrow tone="brass">Generator QR Code Program</Eyebrow>
        </Box>
        <Typography variant="h2" sx={{ fontSize: '1.25rem', color: c.ink, mt: 0.5 }}>
          {shortName || campaignTitle || 'Program Donasi'}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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

        {/* URL Selection & Customization */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Eyebrow sx={{ fontSize: '0.625rem' }}>Pilih Domain / Tautan Cepat:</Eyebrow>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              <Chip
                size="small"
                label="ziswaf.kmii.jp"
                clickable
                color={domainOption === 'ziswaf' ? 'primary' : 'default'}
                variant={domainOption === 'ziswaf' ? 'filled' : 'outlined'}
                onClick={() => setDomainOption('ziswaf')}
                sx={{ fontSize: '0.6875rem', fontWeight: 600 }}
              />
              <Chip
                size="small"
                label="infaq.kmii.jp"
                clickable
                color={domainOption === 'infaq' ? 'primary' : 'default'}
                variant={domainOption === 'infaq' ? 'filled' : 'outlined'}
                onClick={() => setDomainOption('infaq')}
                sx={{ fontSize: '0.6875rem', fontWeight: 600 }}
              />
              {campaignId === 'pemakaman' && (
                <Chip
                  size="small"
                  label="honjo.kmii.jp"
                  clickable
                  color={domainOption === 'honjo' ? 'primary' : 'default'}
                  variant={domainOption === 'honjo' ? 'filled' : 'outlined'}
                  onClick={() => setDomainOption('honjo')}
                  sx={{ fontSize: '0.6875rem', fontWeight: 600 }}
                />
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              label="Tautan Tujuan (Target URL)"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setDomainOption('custom');
              }}
              helperText="URL yang akan terbuka saat donatur memindai QR Code."
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: c.well, p: 1.5, borderRadius: radius.md, border: `1px solid ${c.rule}` }}>
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

        {/* Canvas Visual Previews */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2, bgcolor: c.well, borderRadius: radius.lg, border: `1px solid ${c.rule}` }}>
          {/* QR Code Tab View */}
          <Box sx={{ display: activeTab === 'qr' ? 'flex' : 'none', flexDirection: 'column', alignItems: 'center' }}>
            <Box
              sx={{
                p: 2,
                bgcolor: '#FFFFFF',
                borderRadius: radius.md,
                border: `1px solid ${c.rule}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <canvas
                ref={qrCanvasRef}
                style={{
                  width: 240,
                  height: 240,
                  display: 'block'
                }}
              />
            </Box>
            <Typography sx={{ fontSize: '0.75rem', color: c.inkMuted, mt: 1.5, textAlign: 'center' }}>
              Resolusi tinggi 1024×1024 px · Format PNG jernih untuk flyer, media sosial, atau stiker.
            </Typography>
          </Box>

          {/* Standee Tab View */}
          <Box sx={{ display: activeTab === 'standee' ? 'flex' : 'none', flexDirection: 'column', alignItems: 'center' }}>
            <Box
              sx={{
                bgcolor: '#FFFFFF',
                borderRadius: radius.md,
                border: `1px solid ${c.rule}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                overflow: 'hidden'
              }}
            >
              <canvas
                ref={standeeCanvasRef}
                style={{
                  width: 240,
                  height: 336, // aspect 1000:1400
                  display: 'block'
                }}
              />
            </Box>
            <Typography sx={{ fontSize: '0.75rem', color: c.inkMuted, mt: 1.5, textAlign: 'center' }}>
              Standee A4 / Kartu Meja 1000×1400 px · Siap cetak langsung untuk meja registrasi dan masjid.
            </Typography>
          </Box>
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
              disabled={isRendering}
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
              disabled={isRendering}
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
