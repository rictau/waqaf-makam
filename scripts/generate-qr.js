import fs from 'fs';
import QRCode from 'qrcode';
import { PNG } from 'pngjs';

async function makeQr() {
  const targetUrl = process.argv[2] || 'https://ziswaf.kmii.jp/pemakaman';
  console.log(`Generating QR code for: ${targetUrl}`);

  // 1. Raw QR Code
  const cleanBuffer = await QRCode.toBuffer(targetUrl, {
    errorCorrectionLevel: 'H',
    width: 1024,
    margin: 2,
    color: {
      dark: '#1E3A2F',
      light: '#FFFFFF'
    }
  });
  fs.writeFileSync('public/qr-code-clean.png', cleanBuffer);

  // 2. Branded QR Code with KMII Logo badge in center
  const qrPng = PNG.sync.read(cleanBuffer);
  const logoBuffer = fs.readFileSync('public/kmii-logo.png');
  const logoPng = PNG.sync.read(logoBuffer);

  const targetLogoSize = Math.round(qrPng.width * 0.22);
  const badgePadding = Math.round(targetLogoSize * 0.08);
  const badgeTotalSize = targetLogoSize + badgePadding * 2;
  const startX = Math.round((qrPng.width - badgeTotalSize) / 2);
  const startY = Math.round((qrPng.height - badgeTotalSize) / 2);
  const radius = Math.round(badgeTotalSize * 0.16);

  // Draw rounded white badge
  for (let y = 0; y < badgeTotalSize; y++) {
    for (let x = 0; x < badgeTotalSize; x++) {
      let inside = true;
      const checkCorner = (cx, cy) => {
        const dx = x - cx;
        const dy = y - cy;
        return (dx * dx + dy * dy) <= (radius * radius);
      };

      if (x < radius && y < radius) inside = checkCorner(radius, radius);
      else if (x >= badgeTotalSize - radius && y < radius) inside = checkCorner(badgeTotalSize - radius - 1, radius);
      else if (x < radius && y >= badgeTotalSize - radius) inside = checkCorner(radius, badgeTotalSize - radius - 1);
      else if (x >= badgeTotalSize - radius && y >= badgeTotalSize - radius) inside = checkCorner(badgeTotalSize - radius - 1, badgeTotalSize - radius - 1);

      if (inside) {
        const idx = ((startY + y) * qrPng.width + (startX + x)) << 2;
        qrPng.data[idx] = 255;
        qrPng.data[idx + 1] = 255;
        qrPng.data[idx + 2] = 255;
        qrPng.data[idx + 3] = 255;
      }
    }
  }

  // Draw logo with alpha blending
  const logoStartX = startX + badgePadding;
  const logoStartY = startY + badgePadding;

  for (let y = 0; y < targetLogoSize; y++) {
    for (let x = 0; x < targetLogoSize; x++) {
      const srcX = Math.min(Math.floor((x / targetLogoSize) * logoPng.width), logoPng.width - 1);
      const srcY = Math.min(Math.floor((y / targetLogoSize) * logoPng.height), logoPng.height - 1);
      const srcIdx = (srcY * logoPng.width + srcX) << 2;

      const alpha = logoPng.data[srcIdx + 3] / 255;
      if (alpha > 0) {
        const dstIdx = ((logoStartY + y) * qrPng.width + (logoStartX + x)) << 2;
        qrPng.data[dstIdx] = Math.round(logoPng.data[srcIdx] * alpha + qrPng.data[dstIdx] * (1 - alpha));
        qrPng.data[dstIdx + 1] = Math.round(logoPng.data[srcIdx + 1] * alpha + qrPng.data[dstIdx + 1] * (1 - alpha));
        qrPng.data[dstIdx + 2] = Math.round(logoPng.data[srcIdx + 2] * alpha + qrPng.data[dstIdx + 2] * (1 - alpha));
      }
    }
  }

  const outBuffer = PNG.sync.write(qrPng);
  fs.writeFileSync('public/qr-code.png', outBuffer);
  fs.writeFileSync('public/qr-code-pemakaman.png', outBuffer);
  console.log(`Generated branded QR Code (${outBuffer.length} bytes) saved to public/qr-code.png & public/qr-code-pemakaman.png`);
}

makeQr().catch(console.error);
