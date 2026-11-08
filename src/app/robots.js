export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/'],
    },
    sitemap: 'https://tugas-pertemuan-12.vercel.app/sitemap.xml',
  }
}
