export async function GET({ site }) {
  const sitemapUrl = new URL('sitemap.xml', site || 'https://nabilshaikh.dev').href;
  const content = `User-agent: *
Allow: /

Sitemap: ${sitemapUrl}
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
