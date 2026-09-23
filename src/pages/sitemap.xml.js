import { projects } from '../data/projects.js';

export async function GET({ site }) {
  const baseUrl = site ? site.toString().replace(/\/$/, '') : 'https://nabilshaikh.dev';

  const pages = [
    { url: '', changefreq: 'weekly', priority: 1.0 },
    { url: '/projects', changefreq: 'weekly', priority: 0.9 },
    { url: '/about', changefreq: 'monthly', priority: 0.8 },
    { url: '/contact', changefreq: 'monthly', priority: 0.8 },
    ...projects
      .filter((p) => p.caseStudyUrl.startsWith('/'))
      .map((p) => ({
        url: p.caseStudyUrl,
        changefreq: 'monthly',
        priority: 0.85,
      })),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
