# Dokumentasi Alur Bisnis Sistem Perpus (Web Peminjaman Buku)

Dokumen ini menjelaskan arsitektur, alur bisnis, aturan validasi, siklus data, dan hak akses aplikasi **Perpus** yang dibangun menggunakan **Next.js (App Router)**, **Supabase PostgreSQL**, **Prisma ORM**, dan **Tailwind CSS**.

---

## 1. Ikhtisar Sistem & Aktor

Aplikasi memiliki **dua peran utama (Role)**:

| Peran | Deskripsi | Hak Akses Utama |
|---|---|---|
| **Admin** | Pengelola operasional perpustakaan | Mengakses Dashboard Admin, CRUD Buku, Memantau Peminjaman Seluruh User, Mengembalikan Buku User, Melihat Data Pengguna. |
| **User (Peminjam)** | Pengguna umum / anggota perpustakaan | Melihat Katalog Buku, Mencari & Memfilter Kategori, Melihat Detail & Meminjam Buku, Mengembalikan Buku yang Dipinjam, Memantau Riwayat Peminjaman Pribadi. |

---

## 2. Diagram Alur Utama (End-to-End Workflow)

```mermaid
flowchart TD
    A[Mulai / Buka Web] --> B{Sudah Login?}
    
    %% Alur Belum Login
    B -- Tidak --> C[Halaman Login / Register]
    C --> D{Pilih Aksi}
    D -- Daftar Akun --> E[Form Register /register]
    E --> F[Trigger DB Buat Profil Otomatis: Role 'user']
    F --> G[Sesi Terbuat & Redirect ke /]
    D -- Masuk --> H[Form Login /login]
    H --> I[Autentikasi Supabase Auth]
    I --> J{Cek Role}
    J -- Role Admin --> K[Redirect ke /admin]
    J -- Role User --> L[Redirect ke /]

    %% Alur User
    B -- Ya (User) --> L
    L[Katalog Buku /] --> M[Pencarian & Filter Kategori]
    M --> N[Pilih Buku -> Detail Buku /buku/:id]
    N --> O{Klik Pinjam Buku}
    O --> P[Panggil RPC borrow_book]
    P --> Q{Validasi Bisnis RPC}
    Q -- Gagal (Maks 3 / Sedang Dipinjam / Stok Habis) --> R[Tampilkan Pesan Error Spesifik]
    Q -- Berhasil --> S[Stok Berkurang 1, Pinjaman Dicatat Jatuh Tempo +7 Hari]
    S --> T[Lihat Riwayat /riwayat]
    T --> U[Klik Kembalikan Buku]
    U --> V[Panggil RPC return_book]
    V --> W[Status 'dikembalikan', returned_at Terisi, Stok Bertambah 1]

    %% Alur Admin
    B -- Ya (Admin) --> K
    K[Dashboard Admin /admin] --> X{Pilih Menu}
    X -- Kelola Buku --> Y[CRUD Buku: Tambah / Edit / Hapus]
    X -- Peminjaman --> Z[Daftar Seluruh Peminjaman & Konfirmasi Kembali]
    X -- Daftar User --> AA[Pantau Pengguna & Jumlah Pinjaman Aktif]
```

---

## 3. Rincian Alur Bisnis

### 3.1. Alur Autentikasi & Pendaftaran Pengguna

1. **Registrasi (`/register`)**:
   - Pengguna menginput `Nama Lengkap`, `Email`, dan `Password` (minimal 6 karakter).
   - Sistem mendaftarkan akun ke Supabase Auth (`supabase.auth.signUp`).
   - Trigger Postgres `handle_new_user()` secara otomatis menyalin data akun ke tabel `public.profiles` dengan role default **`user`**.
   - Pengguna tidak diperbolehkan menentukan atau memanipulasi role miliknya sendiri.

2. **Login (`/login`)**:
   - Pengguna memasukkan `Email` dan `Password`.
   - Sistem memverifikasi kredensial ke Supabase Auth (`supabase.auth.signInWithPassword`).
   - Sistem mengambil informasi role dari `public.profiles`:
     - Jika role = **`admin`**, pengguna diarahkan ke `/admin`.
     - Jika role = **`user`**, pengguna diarahkan ke `/`.
   - Token sesi disimpan dengan aman dalam cookie HTTP (`perpus_session`).

3. **Logout**:
   - Pengguna mengklik tombol Logout di navbar atau sidebar.
   - Sesi di Supabase Auth ditutup (`supabase.auth.signOut`), cookie dan cache lokal dibersihkan, lalu pengguna diarahkan kembali ke `/login`.

4. **Proteksi Rute (Middleware / Proxy Guard)**:
   - Pengguna yang belum login otomatis dialihkan ke `/login` jika mencoba membuka rute tertutup.
   - Pengguna ber-role `user` yang mencoba mengakses rute `/admin/*` akan langsung dipaksa kembali (*redirect*) ke `/`.

---

### 3.2. Alur Peminjaman Buku (User)

```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna (User)
    participant UI as Antarmuka (Next.js)
    participant RPC as Postgres RPC (borrow_book)
    participant DB as Database (Books & Loans)

    User->>UI: Memilih buku & klik "Pinjam Buku Ini"
    UI->>RPC: supabase.rpc('borrow_book', { p_book_id })
    Note over RPC: Verifikasi Keamanan Sisi Server
    RPC->>DB: Cek user_id (auth.uid)
    alt Belum Login
        RPC-->>UI: Exception: 'Harus login terlebih dahulu'
    end
    RPC->>DB: Hitung peminjaman aktif user (status = 'dipinjam')
    alt Pinjaman Aktif >= 3
        RPC-->>UI: Exception: 'Batas pinjam maksimal 3 buku aktif'
    end
    RPC->>DB: Cek apakah buku ini sedang aktif dipinjam user
    alt Sudah Dipinjam
        RPC-->>UI: Exception: 'Buku ini sedang kamu pinjam'
    end
    RPC->>DB: Kunci baris buku (FOR UPDATE) & cek stok
    alt Stok <= 0
        RPC-->>UI: Exception: 'Stok buku habis'
    end
    Note over RPC,DB: Transaksi Atomik (ACID)
    RPC->>DB: UPDATE books SET stock = stock - 1
    RPC->>DB: INSERT INTO loans (due_date = now() + 7 days)
    RPC-->>UI: Eksekusi Berhasil
    UI-->>User: Tampilkan notifikasi sukses & update stok di layar
```

#### Aturan Bisnis Peminjaman:
1. **Batas Kuota Pinjam**: 1 user maksimal hanya boleh memiliki **3 peminjaman aktif** (`status = 'dipinjam'`). Pinjaman ke-4 akan otomatis ditolak oleh database.
2. **Durasi Peminjaman**: Ditentukan otomatis selama **7 hari** terhitung dari detik transaksi peminjaman (`due_date = now() + interval '7 days'`).
3. **Pencegahan Duplikasi**: Pengguna tidak dapat meminjam buku yang sama jika buku tersebut masih belum dikembalikan.
4. **Konsistensi Stok Atomik**: Pemotongan stok dilakukan di dalam fungsi RPC dengan row-level lock (`SELECT ... FOR UPDATE`), mencegah kondisi *race condition* (misalnya 2 user meminjam bersamaan ketika sisa stok tinggal 1).

---

### 3.3. Alur Pengembalian Buku

```mermaid
sequenceDiagram
    autonumber
    actor Aktor as Peminjam / Admin
    participant UI as Antarmuka (Riwayat / Kelola Pinjaman)
    participant RPC as Postgres RPC (return_book)
    participant DB as Database (Books & Loans)

    Aktor->>UI: Klik tombol "Kembalikan"
    UI->>RPC: supabase.rpc('return_book', { p_loan_id })
    RPC->>DB: Ambil baris peminjaman (FOR UPDATE)
    alt Pinjaman Tidak Ditemukan
        RPC-->>UI: Exception: 'Peminjaman tidak ditemukan'
    end
    alt Bukan Pemilik & Bukan Admin
        RPC-->>UI: Exception: 'Tidak diizinkan'
    end
    alt Status Bukan 'dipinjam'
        RPC-->>UI: Exception: 'Buku sudah dikembalikan'
    end
    Note over RPC,DB: Transaksi Atomik
    RPC->>DB: UPDATE loans SET status = 'dikembalikan', returned_at = now()
    RPC->>DB: UPDATE books SET stock = stock + 1
    RPC-->>UI: Eksekusi Berhasil
    UI-->>Aktor: Refresh tabel & update status menjadi 'Selesai'
```

#### Aturan Bisnis Pengembalian:
1. **Otorisasi**: Buku hanya boleh dikembalikan oleh peminjam yang bersangkutan ATAU oleh akun dengan role **Admin**.
2. **Pencegahan Pengembalian Ganda**: Jika status sudah `'dikembalikan'`, pengembalian ulang akan ditolak.
3. **Restorasi Stok Otomatis**: Stok buku bertambah 1 secara atomik bersamaan dengan pembaruan status peminjaman dan pencatatan tanggal kembali (`returned_at`).

---

### 3.4. Logika Perhitungan Status & Keterlambatan (Overdue)

Status peminjaman dihitung secara dinamis saat data dibaca:

| Status Visual | Kondisi Logika | Keterangan |
|---|---|---|
| **Dipinjam** | `status == 'dipinjam'` dan `now() <= due_date` | Peminjaman normal dalam batas waktu 7 hari. |
| **Terlambat** | `status == 'dipinjam'` dan `now() > due_date` | Melewati batas tempo 7 hari. Menampilkan badge merah dan jumlah hari keterlambatan (`Terlambat (X hari)`). |
| **Dikembalikan** | `status == 'dikembalikan'` | Peminjaman sudah selesai dikembalikan. Tanggal pengembalian tercatat di kolom `returned_at`. |

---

### 3.5. Alur Bisnis Panel Admin

```mermaid
graph TD
    subgraph Dashboard ["1. Dashboard Ringkasan (/admin)"]
        D1[Total Buku]
        D2[Total Pengguna]
        D3[Peminjaman Aktif]
        D4[Peminjaman Terlambat]
        D5[Tabel 5 Peminjaman Terbaru]
    end

    subgraph KelolaBuku ["2. Kelola Koleksi Buku (/admin/buku)"]
        B1[Lihat Tabel Koleksi & Stok]
        B2[Tambah Buku Baru]
        B3[Edit Informasi & Jumlah Stok]
        B4[Hapus Buku]
        B5{Ada Pinjaman Aktif?}
        B4 --> B5
        B5 -- Ya --> B6[Ditolak: Masih ada peminjam aktif]
        B5 -- Tidak --> B7[Buku Dihapus dari Database]
    end

    subgraph KelolaPinjam ["3. Sirkulasi Peminjaman (/admin/peminjaman)"]
        L1[Semua Transaksi Seluruh User]
        L2[Filter: Semua / Dipinjam / Dikembalikan / Terlambat]
        L3[Aksi Admin: Kembalikan Buku Mewakili User]
    end

    subgraph KelolaUser ["4. Daftar Pengguna (/admin/user)"]
        U1[Daftar Akun Pengguna]
        U2[Badge Role: Admin / User]
        U3[Counter Jumlah Buku Aktif yang Sedang Dipinjam]
    end
```

#### Aturan Khusus Operasional Admin:
1. **Integritas Penghapusan Buku**: Admin **tidak dapat menghapus buku** yang masih tercatat memiliki peminjaman aktif (`status = 'dipinjam'`). Admin wajib menunggu buku dikembalikan terlebih dahulu agar riwayat data peminjaman tidak rusak (*orphan foreign key*).
2. **Kontrol Stok**: Admin dapat menyesuaikan stok buku secara manual saat menambah atau mengedit buku (stok minimal 0).
3. **Fleksibilitas Pengembalian**: Jika peminjam mengembalikan buku secara fisik ke perpustakaan, petugas Admin dapat memproses pengembalian buku tersebut melalui menu `/admin/peminjaman`.

---

## 4. Keamanan & Proteksi Data (Row Level Security)

Keamanan aplikasi tidak hanya bertumpu pada antarmuka (frontend), melainkan ditegakkan langsung di level database PostgreSQL melalui **Row Level Security (RLS)**:

```mermaid
flowchart LR
    Client[Client / Browser] -->|Supabase Publishable Key| RLS{PostgreSQL RLS Policies}
    
    subgraph Policies ["Kebijakan Keamanan Tabel"]
        direction TB
        P1["books: SELECT publik & user, INSERT/UPDATE/DELETE hanya Admin"]
        P2["profiles: SELECT milik sendiri atau jika Admin"]
        P3["loans: SELECT milik sendiri atau jika Admin"]
        P4["loans INSERT/UPDATE: Diblokir dari Client langsung, WAJIB via RPC"]
    end

    RLS --> Policies
```

1. **Tabel `books`**:
   - `SELECT`: Diizinkan untuk semua pihak (publik dan authenticated) agar katalog dapat dilihat.
   - `INSERT / UPDATE / DELETE`: Hanya diizinkan jika `public.is_admin() = true`.
2. **Tabel `profiles`**:
   - Hanya pengguna pemilik profil (`id = auth.uid()`) atau Admin yang dapat membaca data profil.
3. **Tabel `loans`**:
   - Pengguna biasa hanya dapat membaca riwayat miliknya sendiri (`user_id = auth.uid()`).
   - Admin dapat membaca seluruh baris peminjaman.
   - Manipulasi langsung (`INSERT` / `UPDATE` manual dari frontend) dilarang. Semua perubahan data mutlak melalui fungsi RPC `borrow_book` dan `return_book`.

---

## 5. Ringkasan Siklus Status Data

```mermaid
stateDiagram-v2
    [*] --> Tersedia: Buku Didaftarkan (Stok > 0)
    Tersedia --> Dipinjam: User Meminjam (RPC borrow_book)
    Dipinjam --> Terlambat: Tanggal Sekarang > Jatuh Tempo (Dihitung Dinamis)
    Dipinjam --> Dikembalikan: User / Admin Mengembalikan (RPC return_book)
    Terlambat --> Dikembalikan: Dikembalikan Meskipun Lewat Tempo
    Dikembalikan --> Tersedia: Stok Buku Bertambah 1
    Tersedia --> Habis: Stok Mencapai 0
    Habis --> Tersedia: Ada yang Mengembalikan / Admin Tambah Stok
```

Dokumentasi ini mencakup seluruh spesifikasi dan implementasi aplikasi Perpus sesuai dengan kriteria yang ditentukan.
