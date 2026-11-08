import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  metadataBase: new URL("https://tugas-pertemuan-12.vercel.app"),
  title: {
    default: "Perpus - Web Peminjaman Buku Online",
    template: "%s | Perpus",
  },
  description: "Platform peminjaman buku perpustakaan online modern dan simpel. Jelajahi katalog buku, pinjam instan durasi 7 hari, dan kelola sirkulasi buku dengan mudah.",
  keywords: [
    "perpustakaan online",
    "peminjaman buku",
    "katalog buku",
    "pinjam buku online",
    "perpus digital",
    "buku novel",
    "buku teknologi",
  ],
  authors: [{ name: "Perpus Team" }],
  creator: "Perpus",
  publisher: "Perpus",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Perpus - Web Peminjaman Buku Online",
    description: "Pinjam buku favoritmu dengan mudah dan cepat secara online.",
    url: "https://tugas-pertemuan-12.vercel.app",
    siteName: "Perpus",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Perpus - Web Peminjaman Buku Online",
    description: "Pinjam buku favoritmu dengan mudah dan cepat secara online.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} font-sans antialiased`}>
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        {children}
      </body>
    </html>
  );
}
