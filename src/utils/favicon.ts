import type { PublicLogo } from '../types';

export const updateDynamicFavicon = async (logos?: PublicLogo[]) => {
  const setFavicon = (href: string) => {
    document.querySelectorAll<HTMLLinkElement>("link[rel~='icon'], link[rel='apple-touch-icon'], link[rel='shortcut icon']").forEach(el => el.remove());

    const iconLink = document.createElement('link');
    iconLink.rel = 'icon';
    iconLink.type = 'image/png';
    iconLink.href = href;
    document.head.appendChild(iconLink);

    const shortcutLink = document.createElement('link');
    shortcutLink.rel = 'shortcut icon';
    shortcutLink.type = 'image/png';
    shortcutLink.href = href;
    document.head.appendChild(shortcutLink);

    const appleLink = document.createElement('link');
    appleLink.rel = 'apple-touch-icon';
    appleLink.href = href;
    document.head.appendChild(appleLink);
  };

  const defaultFavicon = '/kmii-logo.png?v=2';
  const kmiiLogoSrc = logos?.[0]?.src || '/kmii-logo.png';
  const partnerLogoSrc = logos?.[1]?.src;
  const hasPartner = Boolean(logos && logos.length > 1 && partnerLogoSrc);

  try {
    const canvas = document.createElement('canvas');
    const size = 128; // High-DPI 128x128
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setFavicon(defaultFavicon);
      return;
    }

    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load ${src}`));
        img.src = src;
      });
    };

    // Draw background (pure white rounded rectangle for contrast in light/dark browser tabs)
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, 24);
    ctx.fill();

    // Subtle border
    ctx.strokeStyle = '#E5DFD7';
    ctx.lineWidth = 4;
    ctx.stroke();

    if (hasPartner && partnerLogoSrc) {
      const [imgKmii, imgPartner] = await Promise.all([
        loadImage(kmiiLogoSrc),
        loadImage(partnerLogoSrc)
      ]);

      // Vertical divider line in the middle
      ctx.strokeStyle = '#E5DFD7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(size / 2, 16);
      ctx.lineTo(size / 2, size - 16);
      ctx.stroke();

      // Calculate dimensions
      const padding = 10;
      const halfW = size / 2 - padding * 2;
      const maxH = size - padding * 2;

      // Draw KMII on left half
      const scaleKmii = Math.min(halfW / imgKmii.naturalWidth, maxH / imgKmii.naturalHeight);
      const kw = imgKmii.naturalWidth * scaleKmii;
      const kh = imgKmii.naturalHeight * scaleKmii;
      const kx = padding + (halfW - kw) / 2;
      const ky = (size - kh) / 2;
      ctx.drawImage(imgKmii, kx, ky, kw, kh);

      // Draw Partner on right half
      const scalePartner = Math.min(halfW / imgPartner.naturalWidth, maxH / imgPartner.naturalHeight);
      const pw = imgPartner.naturalWidth * scalePartner;
      const ph = imgPartner.naturalHeight * scalePartner;
      const px = size / 2 + padding + (halfW - pw) / 2;
      const py = (size - ph) / 2;
      ctx.drawImage(imgPartner, px, py, pw, ph);
    } else {
      const imgKmii = await loadImage(kmiiLogoSrc);

      // Draw KMII single logo centered
      const padding = 12;
      const maxW = size - padding * 2;
      const maxH = size - padding * 2;
      const scale = Math.min(maxW / imgKmii.naturalWidth, maxH / imgKmii.naturalHeight);
      const kw = imgKmii.naturalWidth * scale;
      const kh = imgKmii.naturalHeight * scale;
      const kx = (size - kw) / 2;
      const ky = (size - kh) / 2;
      ctx.drawImage(imgKmii, kx, ky, kw, kh);
    }

    const dataUrl = canvas.toDataURL('image/png');
    setFavicon(dataUrl);
  } catch (err) {
    console.warn('Could not generate dynamic favicon, using fallback:', err);
    setFavicon(defaultFavicon);
  }
};
