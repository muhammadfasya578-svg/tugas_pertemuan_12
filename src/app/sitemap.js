export default function sitemap() {
  const baseUrl = 'https://tugas-pertemuan-12.vercel.app'
  const bookIds = [1, 2, 3, 4, 5, 6, 7, 8]

  const staticRoutes = ['', '/login', '/register', '/riwayat'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily',
    priority: route === '' ? 1.0 : 0.8,
  }))

  const bookRoutes = bookIds.map((id) => ({
    url: `${baseUrl}/buku/${id}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticRoutes, ...bookRoutes]
}
