const setMeta = (selector: string, value: string) => {
  document.querySelector(selector)?.setAttribute('content', value);
};

const siteUrl = 'https://ziswaf.kmii.jp';
const defaultTitle = 'KMII Jepang - Portal ZISWAF & Donasi';
const defaultDescription = 'Salurkan zakat, infaq, sedekah, dan wakaf Anda untuk berbagai program dakwah dan kemaslahatan muslim di Jepang.';

const toAbsoluteUrl = (value: string) => {
  try {
    return new URL(value, siteUrl).toString();
  } catch {
    return value;
  }
};

export const updateDocumentMetadata = ({
  title = defaultTitle,
  description,
  image = '/og-preview.png',
  url = siteUrl
}: {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}) => {
  const absoluteUrl = toAbsoluteUrl(url);

  document.title = title;
  setMeta('meta[property="og:url"]', absoluteUrl);
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[name="twitter:title"]', title);

  if (description) {
    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[name="twitter:description"]', description);
  } else {
    document.querySelector('meta[name="description"]')?.remove();
    document.querySelector('meta[property="og:description"]')?.remove();
    document.querySelector('meta[name="twitter:description"]')?.remove();
  }

  if (image) {
    const absoluteImage = toAbsoluteUrl(image);
    setMeta('meta[property="og:image"]', absoluteImage);
    setMeta('meta[name="twitter:image"]', absoluteImage);
  } else {
    document.querySelector('meta[property="og:image"]')?.remove();
    document.querySelector('meta[name="twitter:image"]')?.remove();
  }
};
