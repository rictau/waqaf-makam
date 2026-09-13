const setMeta = (selector: string, value: string) => {
  document.querySelector(selector)?.setAttribute('content', value);
};

const siteUrl = 'https://honjo.kmii.jp';
const defaultTitle = 'Wakaf Tanah Makam Muslim - KMII Jepang';
const defaultDescription = 'Bersama Wujudkan Pemakaman Muslim untuk WNI di Jepang - Pemakaman Muslim Honjo. Amal jariyah abadi bersama KMII Jepang.';

const toAbsoluteUrl = (value: string) => {
  try {
    return new URL(value, siteUrl).toString();
  } catch {
    return value;
  }
};

export const updateDocumentMetadata = ({
  title = defaultTitle,
  description = defaultDescription,
  image = '/kmii-logo.png',
  url = siteUrl
}: {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}) => {
  const absoluteUrl = toAbsoluteUrl(url);
  const absoluteImage = toAbsoluteUrl(image);

  document.title = title;
  setMeta('meta[name="description"]', description);
  setMeta('meta[property="og:url"]', absoluteUrl);
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[property="og:image"]', absoluteImage);
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', description);
  setMeta('meta[name="twitter:image"]', absoluteImage);
};
