-- ========================================================
-- SISTEM PERPUSTAKAAN (SUPABASE SQL SETUP)
-- ========================================================

-- 1. TABEL KATEGORI BUKU
create table if not exists public.categories (
  id bigint generated always as identity primary key,
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- 2. TABEL PROFILES (PENGGUNA & ADMIN)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'user' check (role in ('admin', 'user'))
);

-- 3. TABEL BUKU
create table if not exists public.books (
  id bigint generated always as identity primary key,
  title text not null,
  author text not null,
  category text not null,
  stock int not null default 1 check (stock >= 0),
  cover text
);

-- 4. TABEL PEMINJAMAN (LOANS)
create table if not exists public.loans (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id bigint not null references public.books(id),
  status text not null default 'dipinjam' check (status in ('dipinjam', 'dikembalikan')),
  created_at timestamptz not null default now(),
  due_date timestamptz not null,
  returned_at timestamptz
);

-- 5. FUNCTION & TRIGGER BUAT PROFIL OTOMATIS SAAT REGISTER
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'user'
  )
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. HELPER CEK ADMIN
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- 7. ROW LEVEL SECURITY (RLS)
alter table public.categories enable row level security;
alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.loans enable row level security;

-- Policies for categories
drop policy if exists "categories: semua user login boleh baca" on public.categories;
create policy "categories: semua user login boleh baca" on public.categories
  for select to authenticated using (true);

drop policy if exists "categories: admin insert" on public.categories;
create policy "categories: admin insert" on public.categories
  for insert to authenticated with check (public.is_admin());

drop policy if exists "categories: admin update" on public.categories;
create policy "categories: admin update" on public.categories
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "categories: admin delete" on public.categories;
create policy "categories: admin delete" on public.categories
  for delete to authenticated using (public.is_admin());

-- Policies for profiles
drop policy if exists "profiles: baca sendiri atau admin" on public.profiles;
create policy "profiles: baca sendiri atau admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

-- Policies for books
drop policy if exists "books: semua user login boleh baca" on public.books;
create policy "books: semua user login boleh baca" on public.books
  for select to authenticated using (true);

drop policy if exists "books: admin insert" on public.books;
create policy "books: admin insert" on public.books
  for insert to authenticated with check (public.is_admin());

drop policy if exists "books: admin update" on public.books;
create policy "books: admin update" on public.books
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "books: admin delete" on public.books;
create policy "books: admin delete" on public.books
  for delete to authenticated using (public.is_admin());

-- Policies for loans
drop policy if exists "loans: baca milik sendiri atau admin" on public.loans;
create policy "loans: baca milik sendiri atau admin" on public.loans
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- 8. RPC: PINJAM BUKU
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

-- 9. RPC: KEMBALIKAN BUKU
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

-- 10. MIGRASI DATA KATEGORI AWAL DARI BUKU
insert into public.categories (name, description)
select distinct category, 'Kategori ' || category
from public.books
where category is not null and trim(category) <> ''
on conflict (name) do nothing;
