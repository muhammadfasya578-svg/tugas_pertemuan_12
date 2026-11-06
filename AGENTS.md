<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


# PRD — Perpus (Web Peminjaman Buku)

## 1. Ringkasan
Web sederhana untuk peminjaman buku dengan login dan 2 role (`admin` & `user`). Dibuat untuk tugas kuliah menggunakan Next.js dan Supabase.

**Tujuan:** user bisa mencari dan meminjam buku secara online, admin bisa mengelola buku dan memantau peminjaman.

## 2. Tech Stack
| Bagian | Pilihan |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Backend & DB | **Supabase** (PostgreSQL) |
| Auth | **Supabase Auth** (email + password) |
| Client library | `@supabase/supabase-js` + `@supabase/ssr` |
| Mutasi data | Server Actions (memanggil query / RPC Supabase) |
| Keamanan data | Row Level Security (RLS) + fungsi Postgres (RPC) |
| Ikon | `lucide-react` |

### Environment (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://oeoutziokvtkwjsxeves.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_PBApL-Ock4okOdg8_IuGFQ_oEyZ3t8O
```
- Hanya memakai **publishable key**. Jangan pernah memakai atau menaruh `secret` / `service_role` key di kode frontend atau repo.
- `.env.local` tidak boleh di-commit (sudah masuk `.gitignore` bawaan Next.js).
- Di Supabase Dashboard → Authentication → Providers → Email: **matikan "Confirm email"** agar register langsung bisa login saat demo.

## 3. Role
| Role | Cara dibuat | Akses |
|---|---|---|
| `admin` | Register biasa, lalu ubah role lewat SQL Editor (lihat bagian 9) | `/admin/*` |
| `user` | Register (otomatis role `user`) | `/`, `/buku/*`, `/riwayat` |

Hanya 2 role. Register selalu membuat role `user`; user tidak boleh bisa mengubah role-nya sendiri.

## 4. Fitur

### 4.1 Auth (umum)
- **Register** (`/register`): nama, email, password (min. 6 karakter), konfirmasi password. Nama dikirim lewat `options.data.name` pada `signUp`. Role otomatis `user`.
- **Login** (`/login`): email + password (`signInWithPassword`).
- **Logout**: tombol di navbar (`signOut`).
- **Redirect sesuai role** setelah login: admin → `/admin`, user → `/`.
- **Proteksi route**: belum login → `/login`. User membuka `/admin/*` → redirect `/`. Admin membuka halaman user boleh.

### 4.2 Admin
- **Dashboard** (`/admin`): total buku, total user, peminjaman aktif, peminjaman terlambat.
- **CRUD Buku** (`/admin/buku`): tabel, tambah, edit, hapus. Field: judul, penulis, kategori, stok. Buku yang masih punya peminjaman aktif tidak boleh dihapus (tampilkan pesan error yang jelas).
- **Daftar Peminjaman** (`/admin/peminjaman`): semua peminjaman (user, buku, tgl pinjam, jatuh tempo, status). Admin bisa menandai **dikembalikan**. Baris terlambat diberi badge merah.
- **Daftar User** (`/admin/user`): nama, email, jumlah pinjaman aktif.

### 4.3 User
- **Katalog** (`/`): daftar buku, search judul/penulis, filter kategori. Stok 0 = "Habis".
- **Detail Buku** (`/buku/[id]`): info buku + tombol **Pinjam**.
- **Pinjam Buku**: stok berkurang 1, jatuh tempo otomatis 7 hari dari sekarang.
- **Riwayat** (`/riwayat`): peminjaman milik user sendiri (judul, tgl pinjam, jatuh tempo, status, tgl kembali). Tombol **Kembalikan** untuk yang masih dipinjam.
- **Kembalikan Buku**: stok bertambah 1, status `dikembalikan`, `returned_at` diisi.

## 5. Aturan Bisnis
1. **Batas pinjam:** 1 user maksimal **3 peminjaman aktif** (`status = 'dipinjam'`). Lebih dari itu → ditolak dengan pesan error.
2. **Durasi pinjam:** 7 hari. `due_date = now() + 7 hari`.
3. **Terlambat:** `status = 'dipinjam'` dan `now() > due_date`. Dihitung saat ditampilkan (tidak disimpan sebagai status). Tampilkan badge "Terlambat" + jumlah hari telat.
4. Stok harus > 0 untuk meminjam.
5. User tidak boleh meminjam buku yang sama selagi masih aktif dipinjam.
6. Pinjam & kembali dilakukan lewat **fungsi Postgres (RPC)** agar atomik dan stok konsisten. Tabel `loans` tidak boleh di-insert/update langsung dari client.
7. User hanya boleh mengembalikan/melihat peminjaman miliknya sendiri. Admin bisa semua.
8. Cek role dilakukan **di server dan di RLS**, bukan hanya di UI. Gunakan `supabase.auth.getUser()` (bukan `getSession()`) di sisi server.

## 6. Skema Database (jalankan di Supabase SQL Editor)

```sql
-- TABEL
create table public.profiles (
  id    uuid primary key references auth.users(id) on delete cascade,
  name  text not null,
  email text not null,
  role  text not null default 'user' check (role in ('admin','user'))
);

create table public.books (
  id       bigint generated always as identity primary key,
  title    text not null,
  author   text not null,
  category text not null,
  stock    int  not null default 1 check (stock >= 0)
);

create table public.loans (
  id          bigint generated always as identity primary key,
  user_id     uuid   not null references public.profiles(id) on delete cascade,
  book_id     bigint not null references public.books(id),
  status      text   not null default 'dipinjam' check (status in ('dipinjam','dikembalikan')),
  created_at  timestamptz not null default now(),
  due_date    timestamptz not null,
  returned_at timestamptz
);

-- PROFIL OTOMATIS SAAT REGISTER (role selalu 'user')
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.email, 'user');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- HELPER CEK ADMIN
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.books    enable row level security;
alter table public.loans    enable row level security;

create policy "profiles: baca sendiri atau admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

create policy "books: semua user login boleh baca" on public.books
  for select to authenticated using (true);
create policy "books: admin insert" on public.books
  for insert to authenticated with check (public.is_admin());
create policy "books: admin update" on public.books
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "books: admin delete" on public.books
  for delete to authenticated using (public.is_admin());

create policy "loans: baca milik sendiri atau admin" on public.loans
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
-- tidak ada policy insert/update/delete di loans: hanya lewat RPC di bawah

-- RPC: PINJAM BUKU
create or replace function public.borrow_book(p_book_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_stock int;
begin
  if v_uid is null then raise exception 'Harus login'; end if;

  if (select count(*) from loans where user_id = v_uid and status = 'dipinjam') >= 3 then
    raise exception 'Batas pinjam maksimal 3 buku aktif';
  end if;

  if exists (select 1 from loans where user_id = v_uid and book_id = p_book_id and status = 'dipinjam') then
    raise exception 'Buku ini sedang kamu pinjam';
  end if;

  select stock into v_stock from books where id = p_book_id for update;
  if v_stock is null then raise exception 'Buku tidak ditemukan'; end if;
  if v_stock <= 0 then raise exception 'Stok buku habis'; end if;

  update books set stock = stock - 1 where id = p_book_id;
  insert into loans (user_id, book_id, due_date)
  values (v_uid, p_book_id, now() + interval '7 days');
end $$;

-- RPC: KEMBALIKAN BUKU
create or replace function public.return_book(p_loan_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_loan loans%rowtype;
begin
  select * into v_loan from loans where id = p_loan_id for update;
  if not found then raise exception 'Peminjaman tidak ditemukan'; end if;
  if v_loan.user_id <> auth.uid() and not public.is_admin() then
    raise exception 'Tidak diizinkan';
  end if;
  if v_loan.status <> 'dipinjam' then raise exception 'Buku sudah dikembalikan'; end if;

  update loans set status = 'dikembalikan', returned_at = now() where id = p_loan_id;
  update books set stock = stock + 1 where id = v_loan.book_id;
end $$;

grant execute on function public.borrow_book(bigint) to authenticated;
grant execute on function public.return_book(bigint) to authenticated;
```

Pemanggilan dari Server Action: `supabase.rpc('borrow_book', { p_book_id })` dan `supabase.rpc('return_book', { p_loan_id })`. Pesan dari `raise exception` ditampilkan ke user sebagai error.

## 7. Daftar Route
| Route | Akses | Keterangan |
|---|---|---|
| `/login` | publik | Form login |
| `/register` | publik | Form register |
| `/` | login | Katalog |
| `/buku/[id]` | login | Detail + pinjam |
| `/riwayat` | login | Riwayat milik sendiri |
| `/admin` | admin | Dashboard |
| `/admin/buku` | admin | CRUD buku |
| `/admin/peminjaman` | admin | Semua peminjaman |
| `/admin/user` | admin | Daftar user |

## 8. Struktur Folder (target)

```
perpus/
├─ .env.local
├─ middleware.ts            # refresh session Supabase + redirect ke /login
│                           # (jika Next.js 16: namanya proxy.ts, ikuti versi terpasang)
├─ lib/
│  ├─ supabase/
│  │  ├─ client.ts          # createBrowserClient
│  │  ├─ server.ts          # createServerClient (cookies)
│  │  └─ middleware.ts      # helper updateSession
│  ├─ auth.ts               # getCurrentUser(), getProfile(), requireAdmin()
│  └─ actions/              # server actions: auth, book, loan
├─ components/              # Navbar, BookCard, StatusBadge, dll
└─ app/
   ├─ login/page.tsx
   ├─ register/page.tsx
   ├─ page.tsx              # katalog
   ├─ buku/[id]/page.tsx
   ├─ riwayat/page.tsx
   └─ admin/
      ├─ layout.tsx         # guard role admin (cek profiles.role di server)
      ├─ page.tsx
      ├─ buku/page.tsx
      ├─ peminjaman/page.tsx
      └─ user/page.tsx
```

## 9. Seed Data (jalankan di SQL Editor)

```sql
insert into public.books (title, author, category, stock) values
('Laskar Pelangi',        'Andrea Hirata',     'Novel',   3),
('Bumi Manusia',          'Pramoedya A. Toer', 'Novel',   2),
('Filosofi Teras',        'Henry Manampiring', 'Self-help', 4),
('Atomic Habits',         'James Clear',       'Self-help', 2),
('Clean Code',            'Robert C. Martin',  'Teknologi', 3),
('The Pragmatic Programmer','Andrew Hunt',     'Teknologi', 1),
('Sapiens',               'Yuval Noah Harari', 'Sejarah', 2),
('Cantik Itu Luka',       'Eka Kurniawan',     'Novel',   0);
```

**Membuat admin:** register 1 akun lewat halaman `/register` (mis. `admin@perpus.com`), lalu jalankan:

```sql
update public.profiles set role = 'admin' where email = 'admin@perpus.com';
```

Akun user biasa: register satu lagi (mis. `user@perpus.com`).

## 10. Desain & UI

**Gaya:** modern, simpel, bersih. Dominan putih dengan aksen hijau. Banyak ruang kosong, sudut membulat, bayangan tipis, tanpa ornamen berlebihan.

### 10.1 Palet Warna (Tailwind)
| Peran | Warna | Tailwind |
|---|---|---|
| Primary (tombol utama, link aktif) | `#059669` | `emerald-600` |
| Primary hover | `#047857` | `emerald-700` |
| Aksen lembut (badge, highlight, hover baris) | `#ECFDF5` / `#D1FAE5` | `emerald-50` / `emerald-100` |
| Background halaman | `#FFFFFF` / `#F8FAFC` | `white` / `slate-50` |
| Kartu / panel | `#FFFFFF` + border `#E2E8F0` | `white` + `slate-200` |
| Teks utama | `#0F172A` | `slate-900` |
| Teks sekunder | `#64748B` | `slate-500` |
| Error / terlambat | `#DC2626` (bg `red-50`) | `red-600` |
| Peringatan / sedang dipinjam | `#D97706` (bg `amber-50`) | `amber-600` |

Atur warna lewat design token (CSS variable / konfigurasi Tailwind) supaya mudah diganti. Tidak ada dark mode.

### 10.2 Tipografi & Bentuk
- Font: **Plus Jakarta Sans** atau **Inter** (via `next/font/google`).
- Judul halaman `text-2xl font-semibold`, teks isi `text-sm`/`text-base`, teks bantu `text-slate-500`.
- Kartu: `rounded-2xl border border-slate-200 bg-white shadow-sm`.
- Tombol & input: `rounded-xl`, tinggi nyaman (`h-10`/`h-11`).
- Tombol utama: `bg-emerald-600 text-white hover:bg-emerald-700`. Tombol sekunder: `border border-slate-200 bg-white hover:bg-slate-50`. Tombol hapus: merah, dengan konfirmasi.
- Input fokus: `focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`.
- Konten dibatasi `max-w-6xl mx-auto px-4`.

### 10.3 Komponen Wajib
- **Navbar**: putih, border bawah tipis, logo teks "Perpus" dengan ikon buku hijau, menu sesuai role, nama user + tombol Logout. Menu aktif diberi warna hijau.
- **BookCard**: placeholder cover (blok `emerald-50` dengan ikon buku), judul, penulis, badge kategori, badge stok ("Tersedia" hijau / "Habis" abu-abu), tombol Lihat/Pinjam. Efek hover: bayangan sedikit naik.
- **StatusBadge**: `Dipinjam` (amber), `Dikembalikan` (hijau), `Terlambat` (merah).
- **StatCard** (dashboard admin): ikon dalam lingkaran `emerald-50`, angka besar, label kecil.
- **DataTable** (admin): header `slate-50`, baris hover `emerald-50/50`, scroll horizontal di mobile.
- **Form (login/register/buku)**: label di atas input, pesan error merah di bawah field.
- **Empty state**: ikon + teks singkat + tombol aksi.
- **Toast/alert** untuk sukses dan error (termasuk pesan dari RPC).
- **Loading**: skeleton sederhana atau teks "Memuat...".

### 10.4 Layout Halaman
- **Login & Register**: satu kartu di tengah layar (`max-w-md`), background `slate-50` atau gradasi tipis `emerald-50` → putih, judul + deskripsi singkat, link silang ke halaman satunya.
- **Katalog (`/`)**: hero kecil (judul + kolom search), baris filter kategori berbentuk chip (aktif = hijau), lalu grid kartu buku (1 kolom mobile, 2 tablet, 3-4 desktop).
- **Detail buku**: dua kolom (cover placeholder di kiri, info + tombol Pinjam di kanan), info stok dan aturan pinjam (maks. 3 buku, 7 hari).
- **Riwayat**: tabel/daftar kartu dengan StatusBadge, tombol Kembalikan di baris yang masih aktif.
- **Admin**: layout dengan sidebar kiri (Dashboard, Buku, Peminjaman, User) di desktop, jadi menu atas/drawer di mobile. Konten di kanan.
- **Dashboard admin**: 4 StatCard di atas, lalu tabel "Peminjaman terbaru".

### 10.5 Aturan Konsistensi
- Gunakan hanya palet di atas; jangan menambah warna lain.
- Spasi konsisten kelipatan 4 (`gap-4`, `p-4`, `p-6`).
- Ikon pakai satu library: `lucide-react`.
- Semua halaman wajib responsif dan tampil rapi di lebar 375px.

## 11. Non-Fungsional
- Responsif (mobile & desktop).
- Validasi input di server; tampilkan pesan error yang jelas (termasuk dari RPC).
- Tampilan bersih dan konsisten (Tailwind), ada loading/empty state.
- Tanggal tampil format Indonesia (contoh: `7 Nov 2026`).
- Tidak ada secret key di kode atau repo.

## 12. Tahapan Pengerjaan
1. Setup project, install `@supabase/supabase-js`, `@supabase/ssr`, `lucide-react`, `.env.local`, helper client/server, font + design token warna (bagian 10).
2. Jalankan SQL schema + RLS + RPC + seed di Supabase SQL Editor.
3. Auth: register, login, logout, middleware, guard admin, redirect sesuai role.
4. Admin: CRUD buku.
5. User: katalog, search, filter, detail buku.
6. Pinjam & kembalikan (RPC, batas 3, jatuh tempo, terlambat).
7. Admin: daftar peminjaman, daftar user, dashboard.
8. Polish UI, empty state, error handling, tes manual semua alur.

## 13. Kriteria Selesai
- [ ] Register user baru lalu login berhasil
- [ ] Admin dan user diarahkan ke halaman yang benar
- [ ] User tidak bisa membuka `/admin`, dan tidak bisa mengubah role sendiri
- [ ] Admin bisa tambah, edit, hapus buku
- [ ] User bisa search, filter, dan lihat detail buku
- [ ] Pinjam mengurangi stok; kembalikan menambah stok
- [ ] Pinjam ke-4 ditolak (batas 3 aktif)
- [ ] Jatuh tempo terisi otomatis; peminjaman lewat tempo ditandai terlambat
- [ ] Dashboard admin menampilkan angka yang benar
- [ ] Tampilan konsisten tema hijau-putih dan responsif sampai 375px
- [ ] `npm run build` tanpa error