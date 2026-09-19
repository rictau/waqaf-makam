import type { PublicLogo } from '../types';

export const updateDynamicFavicon = async (logos?: PublicLogo[]) => {
  let iconLink = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  let appleLink = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");

  if (!iconLink) {
    iconLink = document.createElement('link');
    iconLink.rel = 'icon';
    iconLink.type = 'image/png';
    document.head.appendChild(iconLink);
  }

  const defaultFavicon = '/kmii-logo.png';

  // If no partner (only 1 or 0 logos), use standard KMII logo
  if (!logos || logos.length <= 1) {
    iconLink.href = defaultFavicon;
    if (appleLink) appleLink.href = defaultFavicon;
    return;
  }

  const kmiiLogoSrc = logos[0]?.src || defaultFavicon;
  const partnerLogoSrc = logos[1]?.src;

  if (!partnerLogoSrc) {
    iconLink.href = defaultFavicon;
    if (appleLink) appleLink.href = defaultFavicon;
    return;
  }

  try {
    const canvas = document.createElement('canvas');
    const size = 128; // High-DPI 128x128
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load ${src}`));
        img.src = src;
      });
    };

    const [imgKmii, imgPartner] = await Promise.all([
      loadImage(kmiiLogoSrc),
      loadImage(partnerLogoSrc)
    ]);

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

    const dataUrl = canvas.toDataURL('image/png');
    iconLink.href = dataUrl;
    if (appleLink) appleLink.href = dataUrl;
  } catch (err) {
    console.warn('Could not generate dynamic favicon, using fallback:', err);
    iconLink.href = defaultFavicon;
    if (appleLink) appleLink.href = defaultFavicon;
  }
};
