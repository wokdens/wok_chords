export const prerender = true;

export async function GET() {
  const baseUrl = 'https://wokchords.wokdens.com';
  const now = new Date().toISOString().split('T')[0];

  const sitemaps = [
    `${baseUrl}/sitemap-pages.xml`,
    `${baseUrl}/sitemap-songs.xml`,
    `${baseUrl}/sitemap-artists.xml`,
    `${baseUrl}/sitemap-movies.xml`,
    `${baseUrl}/sitemap-tags.xml`,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    (loc) => `  <sitemap>
    <loc>${loc}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`
  )
  .join('\n')}
</sitemapindex>`;

  return new Response(xml.trim(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
    },
  });
}
