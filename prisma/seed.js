const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const INITIAL_BOOKS = [
  { id: 1n, title: 'Laskar Pelangi', author: 'Andrea Hirata', category: 'Novel', stock: 3, cover: '/covers/laskar-pelangi.svg' },
  { id: 2n, title: 'Bumi Manusia', author: 'Pramoedya A. Toer', category: 'Novel', stock: 2, cover: '/covers/bumi-manusia.svg' },
  { id: 3n, title: 'Filosofi Teras', author: 'Henry Manampiring', category: 'Self-help', stock: 4, cover: '/covers/filosofi-teras.svg' },
  { id: 4n, title: 'Atomic Habits', author: 'James Clear', category: 'Self-help', stock: 2, cover: '/covers/atomic-habits.svg' },
  { id: 5n, title: 'Clean Code', author: 'Robert C. Martin', category: 'Teknologi', stock: 3, cover: '/covers/clean-code.svg' },
  { id: 6n, title: 'The Pragmatic Programmer', author: 'Andrew Hunt', category: 'Teknologi', stock: 1, cover: '/covers/the-pragmatic-programmer.svg' },
  { id: 7n, title: 'Sapiens', author: 'Yuval Noah Harari', category: 'Sejarah', stock: 2, cover: '/covers/sapiens.svg' },
  { id: 8n, title: 'Cantik Itu Luka', author: 'Eka Kurniawan', category: 'Novel', stock: 0, cover: '/covers/cantik-itu-luka.svg' },
]

async function main() {
  console.log('Seeding books to Supabase database...')
  for (const book of INITIAL_BOOKS) {
    await prisma.book.upsert({
      where: { id: book.id },
      update: {
        title: book.title,
        author: book.author,
        category: book.category,
        stock: book.stock,
        cover: book.cover,
      },
      create: {
        id: book.id,
        title: book.title,
        author: book.author,
        category: book.category,
        stock: book.stock,
        cover: book.cover,
      },
    })
  }
  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
