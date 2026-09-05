import { getCollection } from 'astro:content';

export async function GET({ site }) {
  const locales = ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'pt', 'ru', 'ar', 'hi', 'bn', 'id', 'tr', 'vi'];
  const baseUrl = site || 'https://real-online-ruler.com';
  
  const urls = locales.map(locale => ({
    url: `${baseUrl}${locale === 'en' ? '' : `/${locale}`}/`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: locale === 'en' ? 1.0 : 0.8,
    alternates: locales.map(l => ({
      lang: l === 'en' ? 'x-default' : l,
      href: `${baseUrl}${l === 'en' ? '' : `/${l}`}/`
    }))
  }));

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map(u => `  <url>
    <loc>${u.url}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
${u.alternates.map(a => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${a.href}"/>`).join('\n')}
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}