import rss from '@astrojs/rss';

export async function GET({ site }) {
  const locales = ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'pt', 'ru', 'ar', 'hi', 'bn', 'id', 'tr', 'vi'];
  
  const items = locales.map(locale => ({
    title: `Real Online Ruler (${locale})`,
    link: `${site}${locale === 'en' ? '' : `/${locale}`}/`,
    pubDate: new Date(),
  }));

  return rss({
    title: 'Real Online Ruler',
    description: 'Free online ruler with cm, mm, and inches. Calibrated to your screen.',
    site: site || 'https://real-online-ruler.com',
    items,
    customData: `<language>en</language>`,
  });
}