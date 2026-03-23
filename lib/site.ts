function normalizeSiteUrl(value?: string) {
  if (!value) {
    return 'http://localhost:3000';
  }

  const trimmedValue = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;

  try {
    return new URL(withProtocol).toString().replace(/\/$/, '');
  } catch {
    return 'http://localhost:3000';
  }
}

const siteUrl = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL,
);

export const siteConfig = {
  name: 'Webply',
  title: 'Webply - JPG, PNG, and WebP Image Converter',
  description:
    'Convert PNG, JPG, and WebP images online with batch uploads, per-file progress, and ZIP downloads.',
  creator: 'nyeinminhtet',
  url: siteUrl,
  locale: 'en_US',
};
