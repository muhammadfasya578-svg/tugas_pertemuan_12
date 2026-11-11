# The Books Digital Library (Perpus)

Aplikasi web modern untuk sistem informasi dan manajemen sirkulasi perpustakaan digital berbasis **Next.js (App Router)**, **Tailwind CSS**, dan **Supabase (PostgreSQL)**. Dirancang dengan antarmuka bersih bertema hijau-putih (*emerald*), responsif penuh dari layar ponsel (375px) hingga desktop, serta dilengkapi keamanan berbasis *Row Level Security* (RLS) dan transaksi atomik via *Postgres RPC*.

---

## Daftar Isi
1. [Ikhtisar Aplikasi](#ikhtisar-aplikasi)
2. [Fitur Utama](#fitur-utama)
   - [Fitur Pengguna / Anggota](#1-fitur-pengguna--anggota-pembaca)
   - [Fitur Administrator](#2-fitur-administrator-pengelola)
3. [Arsitektur & Teknologi](#arsitektur--teknologi)
4. [Aturan Bisnis & Validasi](#aturan-bisnis--validasi)
5. [Skema Database](#skema-database)
6. [Struktur Folder Proyek](#struktur-folder-proyek)
7. [Panduan Instalasi & Menjalankan](#panduan-instalasi--menjalankan)
8. [Akun Percobaan (Demo)](#akun-percobaan-demo)

---

## Ikhtisar Aplikasi

**The Books Digital Library** memudahkan interaksi dua arah antara pembaca dan staf perpustakaan:
- **Pembaca** dapat menjelajahi koleksi buku, membaca sinopsis, meminjam buku secara mandiri, mencetak resi resmi peminjaman, memiliki kartu anggota digital dengan foto profil, serta mengusulkan buku baru.
- **Administrator** dapat mengelola katalog buku (tambah, edit, hapus, upload cover), mengelola kategori, memantau sirkulasi peminjaman dan denda keterlambatan secara *real-time*, memvalidasi usulan pembaca, serta mengaudit aktivitas sistem.

---

## Fitur Utama

### 1. Fitur Pengguna / Anggota (Pembaca)

- **Katalog & Eksplorasi Buku (`/`)**:
  - Pencarian cepat berdasarkan judul buku atau nama penulis.
  - Filter kategori berbentuk *chip* interaktif (Novel, Teknologi, Sejarah, Self-help, dll).
  - Status ketersediaan stok buku secara *real-time* ("Tersedia" atau "Habis").
  - Tampilan kartu buku modern dengan cover dan informasi ringkas.
- **Detail Buku & Rating (`/buku/[id]`)**:
  - Informasi lengkap buku: judul, penulis, kategori, stok tersisa.
  - Tombol peminjaman langsung dengan konfirmasi modal yang jelas.
  - Ulasan dan penilaian bintang (1 hingga 5 bintang) beserta komentar dari pembaca lain.
- **Sirkulasi Peminjaman Mandiri**:
  - Durasi standar 7 hari kalender.
  - Perpanjangan masa pinjam mandiri (+7 hari tambahan, maksimal 1 kali).
  - Pengembalian buku langsung dari halaman riwayat.
- **Riwayat Peminjaman (`/riwayat`)**:
  - Tab terpisah untuk pinjaman aktif dan buku yang telah selesai dibaca.
  - Indikator status visual: `Dipinjam` (kuning/amber), `Dikembalikan` (hijau), dan `Terlambat` (merah).
  - Penghitungan denda otomatis jika melewati batas waktu jatuh tempo (Rp1.000 per hari).
- **Resi Peminjaman Digital (Struk Cetak)**:
  - Resi resmi dilengkapi nomor transaksi unik, barcode 1D (*Code 128 style*), tanggal pinjam, batas kembali, dan status verifikasi sistem.
  - Tombol **Cetak Resi** untuk mencetak langsung ke kertas atau menyimpannya sebagai format PDF.
- **Kartu Anggota Digital (`/kartu-anggota`)**:
  - ID Anggota perpustakaan berformat standar (contoh: `LIB-2026-8B3D86`).
  - Barcode dan QR Code verifikasi keanggotaan.
  - **Unggah Foto Profil**: Anggota dapat mengunggah dan mengganti foto profil pribadi dengan kompresi otomatis langsung di peramban.
  - Tombol cetak kartu anggota seukuran ID Card fisik.
  - Ringkasan statistik jumlah pinjaman aktif dan total buku yang selesai dibaca.
- **Usulan Buku Baru**:
  - Pembaca dapat mengusulkan buku yang belum ada di perpustakaan melalui formulir usulan disertai alasan rekomendasi.

---

### 2. Fitur Administrator (Pengelola)

- **Dashboard Ringkasan (`/admin`)**:
  - 4 Kartu Statistik Utama: Total Buku, Total Anggota Terdaftar, Peminjaman Aktif, dan Peminjaman Terlambat.
  - Indikator estimasi total akumulasi denda keterlambatan sirkulasi.
  - Tabel 5 peminjaman terbaru untuk pemantauan cepat harian.
- **Kelola Buku (`/admin/buku`)**:
  - Tabel data buku dengan pencarian judul/penulis dan filter kategori.
  - Tambah buku baru dengan unggah cover gambar (*canvas auto-compression* ke format WebP/JPEG ringan).
  - Edit informasi buku (judul, penulis, kategori, stok, cover).
  - Hapus buku dengan proteksi ketat: buku yang masih memiliki transaksi peminjaman aktif tidak dapat dihapus.
  - Ekspor seluruh koleksi buku ke file CSV.
- **Kelola Kategori (`/admin/kategori`)**:
  - Tambah kategori buku baru dan pemantauan jumlah buku di tiap kategori.
- **Kelola Peminjaman (`/admin/peminjaman`)**:
  - Daftar seluruh peminjaman dari semua anggota.
  - Filter status: Semua, Sedang Dipinjam, Selesai Dikembalikan, dan Terlambat.
  - Tindakan konfirmasi pengembalian buku langsung oleh admin.
  - Cetak resi peminjaman resmi untuk arsip fisik perpustakaan.
  - Ekspor riwayat transaksi peminjaman ke format CSV.
- **Daftar Pengguna (`/admin/user`)**:
  - Daftar anggota terdaftar lengkap dengan foto profil, nama, email, dan jumlah peminjaman yang sedang aktif.
  - Status keanggotaan (Bebas Pinjaman atau Sedang Meminjam).
- **Usulan Buku Pembaca (`/admin/usulan`)**:
  - Menampilkan daftar permohonan buku dari pembaca.
  - Aksi persetujuan: tombol **Setujui**, **Tolak**, atau langsung klik **Tambah Buku**.
  - Tombol **Tambah Buku** langsung mengarahkan admin ke formulir kelola buku dengan isian judul, penulis, dan kategori yang sudah terisi otomatis (*prefilled*).
  - Tombol **Tambahkan ke Buku** otomatis hilang jika buku telah diterbitkan ke katalog untuk mencegah entri ganda, digantikan dengan status badge **Diterbitkan** dan tautan **Di Katalog**.
- **Log Aktivitas Sistem (`/admin/log`)**:
  - Rekaman jejak audit (*audit trail*) otomatis mencakup waktu kejadian, aktor yang melakukan tindakan, dan deskripsi aktivitas (login, registrasi, tambah buku, pinjam buku, persetujuan usulan, dsb).

---

## Arsitektur & Teknologi

| Komponen | Teknologi | Keterangan |
|---|---|---|
| **Framework** | Next.js 16 (App Router) + React 19 | Server & Client Components, Turbopack, Fast Refresh |
| **Bahasa** | JavaScript (ESNext) + TypeScript Types | Standar modern ES Modules |
| **Styling** | Tailwind CSS v4 | Desain sistem terintegrasi, responsif mobile hingga desktop |
| **Database & Auth** | Supabase (PostgreSQL) | Managed Postgres, Supabase Auth, Row Level Security (RLS) |
| **Integritas Data** | PostgreSQL Stored Procedures (RPC) | Transaksi atomik untuk pinjam (`borrow_book`) dan kembali (`return_book`) |
| **Ikonografi** | Lucide React | Ikon modern dan konsisten |
| **State & Penyimpanan** | Cookie HTTP Ringan + LocalStorage Fallback | Penanganan sesi anti HTTP 431, sinkronisasi profil instan |

---

## Aturan Bisnis & Validasi

1. **Batas Peminjaman**: 1 anggota maksimal memiliki **3 peminjaman aktif** (`status = 'dipinjam'`). Peminjaman ke-4 akan ditolak otomatis oleh sistem.
2. **Durasi Peminjaman**: Masa pinjam standar adalah **7 hari kalender**.
3. **Pencegahan Duplikasi**: Pengguna tidak dapat meminjam buku yang sama jika buku tersebut masih tercatat aktif sedang ia pinjam.
4. **Perpanjangan Waktu**: Pengguna berhak memperpanjang masa pinjam sebanyak **1 kali** (+7 hari) sebelum batas tempo terlewati.
5. **Keterlambatan & Denda**: Peminjaman berstatus aktif yang melewati `due_date` otomatis ditandai badge merah **Terlambat** dengan denda berjalan sebesar **Rp1.000 per hari terlambat**.
6. **Atomisitas Stok**: Penambahan dan pengurangan stok buku dilakukan di level database melalui fungsi Postgres RPC (`FOR UPDATE`), mencegah *race condition* stok negatif.
7. **Proteksi Hak Akses (Route Guard)**:
   - Pengguna belum login dialihkan ke `/login`.
   - Pengguna non-admin yang membuka rute `/admin/*` otomatis diarahkan kembali ke halaman utama katalog (`/`).

---

## Skema Database

Skema database PostgreSQL dapat dilihat dan dieksekusi melalui SQL Editor Supabase pada file [supabase_setup.sql](file:///home/blehkenzz/Docker/belajar_react/tugas_pertemuan_12/supabase_setup.sql).

### Tabel Utama:
1. `public.profiles`: Menyimpan profil anggota (`id`, `name`, `email`, `role`, `avatar_url`).
2. `public.books`: Menyimpan koleksi buku (`id`, `title`, `author`, `category`, `stock`, `cover`).
3. `public.loans`: Menyimpan transaksi peminjaman (`id`, `user_id`, `book_id`, `status`, `created_at`, `due_date`, `returned_at`, `renewed`).
4. `public.categories`: Menyimpan daftar kategori buku.
5. `public.book_requests`: Menyimpan usulan buku baru dari pembaca (`id`, `user_id`, `title`, `author`, `category`, `reason`, `status`).
6. `public.book_reviews`: Menyimpan rating bintang (1-5) dan komentar ulasan pembaca.

---

## Struktur Folder Proyek

```
tugas_pertemuan_12/
├── public/                     # Aset statis & placeholder cover buku
├── src/
│   ├── app/
│   │   ├── (auth)/             # Halaman login & register
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── admin/              # Portal khusus Administrator
│   │   │   ├── layout.js       # Shell navigasi sidebar & mobile drawer admin
│   │   │   ├── page.js         # Dashboard ringkasan metrik
│   │   │   ├── buku/           # Manajemen katalog buku (CRUD)
│   │   │   ├── kategori/       # Manajemen kategori buku
│   │   │   ├── peminjaman/     # Monitoring peminjaman & konfirmasi pengembalian
│   │   │   ├── user/           # Daftar anggota perpustakaan
│   │   │   ├── usulan/         # Kelola rekomendasi buku pengguna
│   │   │   └── log/            # Jejak audit trail aktivitas sistem
│   │   ├── buku/[id]/          # Halaman detail buku, pinjam, dan rating
│   │   ├── kartu-anggota/      # Kartu anggota digital & cetak ID card
│   │   ├── riwayat/            # Riwayat peminjaman & pengembalian buku
│   │   ├── layout.js           # Root layout dengan penyedia dialog & notifikasi
│   │   └── page.js             # Katalog utama pembaca
│   ├── components/             # Komponen UI modular
│   │   ├── AdminBooksManager.js# Komponen CRUD buku & integrasi usulan
│   │   ├── AdminSidebar.js     # Navigasi admin desktop & mobile
│   │   ├── AppNavbar.js        # Navbar atas
│   │   ├── AppSidebar.js       # Navigasi pembaca
│   │   ├── DialogContext.js    # Modal dialog, alert, konfirmasi & toast
│   │   ├── LoanReceiptModal.js # Modal cetak struk resi peminjaman resmi
│   │   └── ...
│   ├── lib/
│   │   ├── storage.js          # Layanan data Supabase & fallback LocalStorage
│   │   ├── utils.js            # Fungsi utilitas (format tanggal Indonesia, mata uang, dll)
│   │   └── supabase/           # Konfigurasi Supabase Client & SSR
│   └── proxy.js                # Proteksi middleware / route guard
├── supabase_setup.sql          # Skrip inisialisasi tabel, RLS, trigger, & RPC
├── package.json                # Dependensi & skrip perintah
└── README.md                   # Dokumentasi resmi aplikasi
```

---

## Panduan Instalasi & Menjalankan

### Prasyarat
- **Node.js** versi 18.18 atau lebih baru.
- Akun atau instans database **Supabase** (opsional untuk sinkronisasi cloud; aplikasi memiliki sistem fallback otomatis).

### Langkah Instalasi

1. **Clone repositori dan masuk ke direktori proyek**:
   ```bash
   cd /path/to/tugas_pertemuan_12
   ```

2. **Pasang dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variable (`.env.local`)**:
   Buat atau pastikan file `.env.local` memiliki kredensial Supabase publishable:
   ```env
   SUPABASE_URL=https://oeoutziokvtkwjsxeves.supabase.co
   SUPABASE_PUBLISHABLE_KEY=sb_publishable_PBApL-Ock4okOdg8_IuGFQ_oEyZ3t8O
   ```

4. **Jalankan Skrip Database (Jika Menggunakan Supabase Baru)**:
   Buka menu **SQL Editor** pada Supabase Dashboard, lalu salin dan jalankan seluruh isi file `supabase_setup.sql`.

5. **Jalankan Server Pengembangan**:
   ```bash
   npm run dev
   ```
   Aplikasi dapat diakses melalui peramban di alamat: **`http://localhost:3000`**.

6. **Build untuk Produksi**:
   ```bash
   npm run build
   npm run start
   ```

---

## Akun Percobaan (Demo)

Untuk keperluan pengujian dan demonstrasi, Anda dapat mendaftar akun baru melalui halaman `/register` atau menggunakan akun percobaan berikut:

| Peran | Email | Password | Halaman Awal |
|---|---|---|---|
| **Administrator** | `admin1@perpus.com` | *(password akun admin)* | `/admin` |
| **Anggota (User)** | `user@perpus.com` | *(password akun user)* | `/` |

> **Catatan Pengaturan Akun Admin Baru**:
> Setiap pendaftaran melalui halaman `/register` secara bawaan mendapatkan peran `user`. Untuk mengubah peran menjadi `admin`, jalankan kueri SQL berikut pada SQL Editor Supabase:
> ```sql
> UPDATE public.profiles SET role = 'admin' WHERE email = 'email_anda@perpus.com';
> ```
