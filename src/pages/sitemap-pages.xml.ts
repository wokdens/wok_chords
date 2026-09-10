export const prerender = true;

export async function GET() {
  const baseUrl = 'https://wokchords.wokdens.com';
  const now = new Date().toISOString().split('T')[0];

  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const letterPages = [
    ...letters.map((l) => ({ url: `${baseUrl}/songs/${l}/`, priority: '0.8', changefreq: 'weekly' })),
    { url: `${baseUrl}/songs/num/`, priority: '0.8', changefreq: 'weekly' },
  ];

  const pages = [
    { url: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
    { url: `${baseUrl}/songs/`, priority: '0.9', changefreq: 'daily' },
    { url: `${baseUrl}/artists/`, priority: '0.9', changefreq: 'weekly' },
    { url: `${baseUrl}/movies/`, priority: '0.9', changefreq: 'weekly' },
    { url: `${baseUrl}/tuner/`, priority: '0.9', changefreq: 'weekly' },
    { url: `${baseUrl}/setlist/`, priority: '0.7', changefreq: 'weekly' },
    { url: `${baseUrl}/about/`, priority: '0.5', changefreq: 'monthly' },
    { url: `${baseUrl}/privacy-policy/`, priority: '0.3', changefreq: 'monthly' },
    ...letterPages,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (p) => `  <url>
    <loc>${p.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml.trim(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
    },
  });
}
