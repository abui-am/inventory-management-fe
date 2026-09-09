# Audit Frontend — Fase 1

Read-only. Tidak ada kode yang diubah.

## Konteks (diisi dari repo, bukan dari template)

| | |
|---|---|
| **Stack** | Next.js **12 Pages Router**, React **17**, TypeScript 5, Tailwind **2** (JIT), `@tanstack/react-query` v4, Formik + Yup 1, axios 1 |
| **Rendering** | **100% SSR.** Semua 40 route `λ (Server)` di output build — tidak ada satu pun halaman statis. Penyebabnya di §A1 |
| **Ukuran** | 40 route, 37 komponen, 52 hook, ±17.500 baris `src/` |
| **Constraint** | tampilan tidak boleh berubah · backend fixed · **tidak ada test sama sekali** · React 17/Next 12 dikunci (react-query v5 & ESLint 9 drop React 17) |

**Catatan penting soal template:** kamu memakai template App Router (Server Components, `"use client"`).
Repo ini **Pages Router** — tidak ada Server Component, tidak ada `"use client"`, jadi seluruh sub-poin
"batas server/client component" tidak berlaku dan tidak saya karang-karang. Yang setara di sini adalah
batas **SSR (`getInitialProps`) vs client** — dibahas di §A1.

Bagian "Yang paling mengganggu" tidak kamu isi, jadi ranking di bawah murni pakai **dampak ÷ risiko**
yang saya ukur sendiri. Kalau ada keluhan spesifik dari user/PM, sebutkan — urutannya bisa berubah.

---

## 1. Peta

### Route
```
_app.tsx  ──> getInitialProps: satu-satunya route guard (baca cookie, redirect)
              QueryClientProvider ─> Hydrate ─> PermissionProvider ─> AppProvider ─> Layout ─> <Component/>

login/ · forget-password · login/recover     → tanpa chrome (di-exclude di Layout)
/                                             → dashboard, 5 query + recharts
{customer,supplier,employee,items,expense,prive,debt,debt-giro,account-receivable,
 transaction,stock-in,monthly-salary,pre-paid-salary,ledger,general-ledger,
 laporan-perubahan-modal,audit,inventory}     → 18 halaman list, semuanya pola identik
{transaction,stock-in}/add                    → 2 form besar (580 & 572 baris) — jalur uang
income-user-report                            → 1 tabel 755 baris
```

### Di mana data di-fetch
Seluruhnya di **client**, lewat react-query. Tidak ada satu pun `getServerSideProps`/`getStaticProps`.
`_app.getInitialProps` mengembalikan `dehydrate(queryClient)` dari QueryClient **kosong** — `<Hydrate>`
praktis no-op (sudah ada komentarnya di `_app.tsx:87`).

Pola tiap hook query (`src/hooks/query/useFetch*.ts`, 20 file):
```
useFetchX() → useFetchMyself()  → POST /general/auth/self   (ambil roles)
            → getApiBasedOnRoles(roles, hierarki) → pilih 1 dari 5 axios instance
            → useMyQuery([keys.x, params, roles], fn)
```

### Di mana state hidup
| State | Lokasi | Isi |
|---|---|---|
| Server cache | `QueryClient` di `_app.tsx:34` | staleTime & cacheTime 5 menit, `refetchOnWindowFocus: false` |
| Permission | `context/permission-context.tsx` | `{ permission: PermissionList[], roles }` — diturunkan dari roles lewat `switch` hardcoded |
| UI global | `context/app-context.tsx` | `{ hideLabel }` (sidebar collapse) |
| Filter dashboard | `context/home-context.tsx` | `{ startDate, endDate }` |
| Filter list | **useState lokal di tiap halaman** | `search`, `sortBy`, `sortType`, `pageSize`, `paginationUrl`, `fromDate`, `toDate` |
| Form | Formik lokal | — |

Tidak ada Redux/Zustand. Tidak ada prop drilling dalam (>2 level) — sudah benar, jangan tambah state manager.

---

## 2. Temuan

Legenda: **[YAKIN]** = terbukti dari kode/build/ukuran. **[UKUR DULU]** = hipotesis, butuh Profiler/Lighthouse.

---

### a. RENDERING & DATA FETCHING

#### A1. Setiap halaman kehilangan static optimization gara-gara `_app.getInitialProps` — **[YAKIN]**
`src/pages/_app.tsx:64`

Mendefinisikan `getInitialProps` di `_app` mematikan Automatic Static Optimization untuk **seluruh**
aplikasi. Bukti dari output build: 40 dari 40 route bertanda `λ (Server)`, nol `○ (Static)`.

- **Dampak user:** setiap navigasi memicu render di server (TTFB per halaman), padahal isi halaman
  tidak butuh server sama sekali — datanya toh di-fetch di client setelah hydrate. Halaman seperti
  `/login` yang isinya 3 input pun di-SSR tiap request.
- **Dampak dev:** tidak bisa dipasang di CDN/static hosting; biaya server per pageview.
- Guard auth-nya sendiri juga tipis: cuma cek **keberadaan** cookie, tidak memvalidasi token.
- **Effort M · Risiko M** — memindahkan guard ke middleware (Next 12 punya `middleware.ts`) mengubah
  perilaku redirect; harus diuji untuk semua kombinasi cookie.

#### A2. Setiap halaman list menembakkan 1 request sia-sia yang pasti 404 — **[YAKIN, sudah saya buktikan ke BE lokal]**
`src/hooks/query/useFetchDebt.ts:23-29` dan **13 hook lain**

```ts
const roles = dataSelf?.data.user.roles.map(...) ?? [];   // render pertama: []
const fetcher = useMyQuery([keys.debts, data, roles], async () => {
  ... getApiBasedOnRoles(roles, ['superadmin']).post('/debts', data)   // tanpa enabled guard
});
```
Pada render pertama `roles` masih `[]`. `getApiBasedOnRoles([], …)` (`utils/api.ts:22`) jatuh ke
`apiInstance()` — base URL publik, **tanpa header Authorization**. Query langsung jalan. Setelah
`/auth/self` selesai, `roles` berubah → query key berubah → request kedua ke URL yang benar.

Diverifikasi ke backend lokal yang sedang jalan:
```
POST /api/v1/debts             → HTTP 404      (request ke-1, terbuang)
POST /api/v1/superadmin/debts  → HTTP 200      (request ke-2, yang benar)
```

- **Dampak user:** setiap halaman list = 2× request + 1 error 404 di Network tab; datanya baru muncul
  setelah gelombang kedua. Waterfall-nya: `/auth/self` → (404 sia-sia) → request asli.
- **Dampak dev:** log error backend penuh 404 palsu; menyulitkan monitoring yang asli.
- **Inkonsistensi:** hanya **2 dari 16** hook yang punya `enabled: (roles?.length ?? 0) > 0`
  (`useFetchSale.ts`, `useFetchStockIn.ts`). 14 sisanya tidak.
- **Effort S · Risiko S** — tambah `enabled` guard yang sudah terbukti polanya di 2 hook lain.
  Ini kandidat batch pertama terbaik: dampak besar, perubahan mekanis, mudah direview.

#### A3. Waterfall `/auth/self` di depan semua data — **[YAKIN]**
`src/hooks/query/*` (20 file)

Tidak ada request data yang bisa mulai sebelum `/auth/self` balik, karena role menentukan **base URL**-nya.
Ini waterfall struktural, bukan kelalaian. Yang bisa diperbaiki: `useFetchMyself` sekarang punya
`staleTime: Infinity` (bagus), tapi karena tidak ada prefetch SSR, gelombang pertama tetap serial.

- **Dampak user:** LCP halaman list = TTFB + hydrate + RTT(`/auth/self`) + RTT(data). Di 4G, dua RTT beruntun.
- **Perbaikan mungkin:** prefetch `/auth/self` di `_app.getInitialProps` (titik pasangnya sudah ada dan
  sudah dikomentari di `_app.tsx:87`) — meniadakan satu RTT untuk semua halaman.
- **Effort M · Risiko M** — token ada di cookie, jadi bisa dipanggil dari server. Perlu hati-hati soal
  kebocoran data antar-user di cache (harus QueryClient baru per request — sudah begitu di kode sekarang).

#### A4. Loading state menyembunyikan seluruh halaman → layout shift penuh tiap navigasi — **[YAKIN]**
`src/layouts/Layout.tsx:65-76`

```tsx
<div style={{ display: !loading ? 'inherit' : 'none', ... }}>
  <DashboardLayout>{children}</DashboardLayout>
</div>
```
Saat `routeChangeStart`, **seluruh** DashboardLayout (termasuk sidebar dan header yang tidak berubah)
di-`display:none`, diganti spinner full-screen.

- **Dampak user:** setiap klik menu = layar berkedip putih + sidebar hilang-muncul. Ini CLS besar dan
  terasa lambat meskipun datanya cepat.
- **Effort M · Risiko S** untuk versi minimal (biarkan chrome, ganti spinner jadi progress bar tipis di
  atas konten). **Tapi ini mengubah tampilan** — bentrok dengan aturan pixel-per-pixel, jadi butuh
  persetujuanmu eksplisit.

#### A5. Caching: `staleTime` 5 menit dipasang global, tanpa pembedaan — **[UKUR DULU]**
`src/pages/_app.tsx:37-39`

`staleTime: 5 menit` untuk **semua** query, termasuk daftar transaksi dan buku besar. Setelah user
membuat transaksi baru lalu kembali ke daftar, datanya bisa basi sampai 5 menit — kecuali ada
`invalidateQueries` yang tepat. Mutation hook memang memanggil `invalidateQueries`, jadi kemungkinan
besar aman, tapi **belum saya telusuri satu per satu untuk 20 domain**.

- **Perlu diukur:** jalankan alur "buat transaksi → kembali ke daftar" untuk tiap domain, lihat apakah
  baris baru langsung muncul. `refetchOnWindowFocus: false` memperbesar risiko basi ini.
- **Effort S (audit) · Risiko S**

---

### b. RE-RENDER & RESPONSIVENESS

#### B1. `useWindowSize` memicu re-render seluruh halaman tiap piksel resize — **[YAKIN kodenya, UKUR DULU dampaknya]**
`src/hooks/useWindowSize.ts:7-14`, dipakai di **7 halaman/komponen**

```ts
window.addEventListener('resize', () => setSize(window.innerWidth));   // tanpa throttle
```
Setiap event resize → `setState` → halaman pemakainya render ulang. Di `pages/debt/index.tsx` satu
render ulang berarti membangun ulang seluruh array `data` beserta JSX tiap selnya (lihat B2).

- **Dampak user:** hanya terasa saat resize window (desktop) atau rotate (mobile). Bukan jalur panas
  sehari-hari — makanya saya taruh di bawah A2, bukan di atas.
- **Yang sebenarnya dibutuhkan:** cuma boolean breakpoint (`isLg`, `isMd`), bukan angka piksel. Ganti
  ke media-query listener = state hanya berubah saat melewati breakpoint, bukan tiap piksel.
- **Effort S · Risiko S**
- **[UKUR DULU]** berapa ms per render ulang halaman list — perlu Profiler recording saat drag-resize.

#### B2. `data` list dibangun ulang tiap render, `columns` sudah di-memo — **[YAKIN kodenya, UKUR DULU dampaknya]**
`src/pages/debt/index.tsx:64-98` (pola sama di ~18 halaman list)

`columns` dibungkus `React.useMemo`, tapi `data` — yang isinya `.map()` menghasilkan **JSX di beberapa
kolom per baris** (`detail`, `status`, `action` dengan komponen `<PayDebt>`) — dibangun ulang setiap render,
termasuk setiap ketikan di kotak pencarian.

- **Skalanya kecil:** `PER_PAGE_OPTIONS` maksimum **20** baris (`constants/options.tsx:256`). 20 baris ×
  ~10 node = ~200 elemen per keystroke. Itu **tidak** akan terasa di desktop.
- **Jadi:** ini rapi-rapi, bukan perbaikan performa. Saya **tidak** merekomendasikan menaburkan `useMemo`
  di sini — belum ada bukti mahalnya. Kalau nanti Profiler menunjukkan render >16 ms, baru pasang.
- **Effort S · Risiko S · prioritas rendah**

#### B3. Search tanpa debounce di 4 halaman list — **[YAKIN]**
`customer:18,25` · `transaction/index:28,41` · `supplier:19,26` · `employee:17,23`

> **Dikoreksi saat eksekusi Fase 2.** Angka awal saya 8 halaman — itu salah. `prive`,
> `pre-paid-salary`, `debt-giro`, dan `general-ledger` memakai prop `search` pada `<Table>`
> hanya sebagai slot toolbar (judul + date range picker), tanpa input teks sama sekali.
> Yang benar-benar punya text search tanpa debounce ada **4**.

```tsx
const [searchQuery, setSearchQuery] = useState('');
const { data } = useFetchCustomers({ search: searchQuery, ... });   // langsung jadi query key
```
Satu ketikan = satu request HTTP. Mengetik "beras" = 5 request; 4 di antaranya langsung basi.

- **Yang sudah benar:** `debt/index.tsx:32` dan `account-receivable/index.tsx:26` sudah memakai
  `useDebounceValue(search, 500)` dari `utils/debounce.ts:14`. Hook-nya sudah ada dan benar —
  tinggal dipakai di 8 halaman sisanya. **Tidak perlu dependency baru.**
- **Dampak user:** input terasa tersendat di koneksi lambat, hasil bisa berkedip mundur (respon lama
  datang belakangan — lihat D3).
- **Dampak backend:** ~5× beban query pencarian.
- **Effort S · Risiko S** — batch mekanis, mudah direview.

#### B4. Context sudah ramping — **tidak perlu disentuh**
`context/{app,home,permission}-context.tsx`

Ketiganya sudah `useMemo` di value-nya, isinya kecil (`hideLabel`, dua tanggal, array permission).
Tidak ada yang perlu dipecah. Ini sudah beres.

#### B5. Virtualisasi list — **tidak diperlukan**
Batas per halaman maksimum 20 baris (`constants/options.tsx:256-260`), paginasi server-side.
Menambahkan react-window di sini murni menambah dependency tanpa masalah nyata. **Jangan.**

---

### c. BUNDLE & ASET

Baseline dari `npm run build` (produksi, hari ini):

| | |
|---|---|
| First Load JS shared by all | **216 kB** |
| `/` (dashboard) | **417 kB** |
| Halaman CRUD tipikal | 314–349 kB |
| `/login` (3 input saja) | **314 kB** |

#### C1. Barrel `components/Form.tsx` menyeret react-select + react-datepicker ke hampir semua halaman — **[YAKIN]**
`src/components/Form.tsx:14-18`

Satu file mengekspor 17 komponen dan meng-import di top level:
`react-datepicker`, `react-number-format`, `react-select`, `react-select/async`, `react-select/async-creatable`.

Chunk `7487-*.js` = **303 kB mentah** berisi react-select + react-datepicker + popper.

Contoh paling jelas: `pages/login/index.tsx` hanya memakai `{ Checkbox, TextField, WithLabelAndError }`
— tiga input HTML biasa — tapi tetap memuat tiga entry point react-select dan react-datepicker.
`/login` = 314 kB First Load.

- **Dampak user:** LCP mobile buruk di halaman ringan; `/login` adalah halaman pertama yang dilihat
  semua orang setiap pagi.
- **Perbaikan:** pecah `Form.tsx` jadi modul per komponen (`Form/TextField.tsx`, `Form/Select.tsx`, …)
  dan pertahankan `Form.tsx` sebagai re-export untuk kompatibilitas. Tidak menambah dependency.
- **Effort M · Risiko S** — murni perpindahan file + update import; tampilan tidak tersentuh.

#### C2. recharts 390 kB dimuat sinkron di dashboard — **[YAKIN]**
`src/pages/index.tsx:7`

Chunk `3698-*.js` = **390 kB mentah** (recharts + lodash + d3). Dashboard `/` = 417 kB First Load,
**103 kB lebih berat** dari halaman lain.

- **Perbaikan:** `next/dynamic` dengan `ssr: false` untuk komponen chart-nya. Pola ini **sudah dipakai**
  di repo (`layouts/DashboardLayout.tsx:18` me-lazy-load Menu), jadi tidak ada konsep baru.
- **Dampak user:** dashboard adalah halaman pertama setelah login — LCP-nya paling penting.
- **Effort S · Risiko S** — chart ada di bawah fold, placeholder tinggi tetap sama supaya tidak CLS.

#### C3. Dua library tabel terpasang bersamaan — **[YAKIN]**
`react-table` v7 (`components/Table.tsx`) **dan** `@tanstack/react-table` v8 (`components/table/TableIncomeUserReport.tsx`).
Satu file pakai v8, semua sisanya pakai v7.

- **Dampak dev:** dua API tabel yang harus dikuasai; dua paket di bundle.
- **Effort L · Risiko M** — migrasi Table.tsx v7→v8 menyentuh semua tabel. **Bukan prioritas sekarang**;
  catat sebagai utang. Jangan dikerjakan sebelum ada visual regression test.

#### C4. `miragejs` ada di `dependencies` produksi, kodenya dead — **[YAKIN]**
`package.json` · `src/utils/server.ts`

`miragejs` (mock server, ±200 kB) ada di `dependencies`, bukan `devDependencies`. Satu-satunya pemakainya
`src/utils/server.ts` **tidak di-import dari mana pun**, jadi tree-shaking membuangnya dari bundle —
tapi tetap terpasang di `node_modules` produksi dan memperlambat `npm ci`.

- **Effort S · Risiko S** — pindahkan ke devDependencies, atau hapus file + paketnya.

#### C5. Dua Google Font render-blocking, satu di antaranya tidak dipakai — **[YAKIN]**
`src/pages/_document.tsx:10-14` · `tailwind.config.js:12-14`

```html
<link href=".../css2?family=Noto+Sans:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet" />
<link href=".../css2?family=Inter&display=optional" rel="stylesheet" />
```
- **Noto Sans dimuat 8 weight + 8 italic.** Kode hanya memakai `font-bold` dan normal.
- **Inter dimuat tapi tidak pernah dipakai** — `tailwind.config.js` hanya mendefinisikan
  `fontFamily.sans: ['Noto sans']`, dan tidak ada `font-[Inter]` di mana pun. Satu request stylesheet
  render-blocking yang murni terbuang.
- **`fontFamily.sans: ['Noto sans']` tidak punya fallback stack sama sekali.** Sebelum webfont selesai,
  browser jatuh ke default UA (serif di sebagian besar browser). Dengan `display=swap`, hasilnya
  **FOUT serif → sans** di seluruh aplikasi: bukan cuma warna berubah, tapi metrik huruf berubah → CLS.
- **Perbaikan:** buang link Inter; batasi weight Noto Sans ke yang dipakai; tambahkan fallback
  `['Noto Sans', 'system-ui', 'sans-serif']`.
- **Effort S · Risiko S untuk Inter + fallback.** Mengurangi weight **berpotensi mengubah tampilan**
  kalau ada weight yang ternyata dipakai — perlu dicek dulu.

#### C6. Gambar tanpa optimasi, `next/image` nol — **[YAKIN]**
`components/List.tsx:15` · `components/Image.tsx:8` · `layouts/DashboardLayout.tsx:103` · `pages/employee/[id].tsx:85`

Empat `<img>` mentah, tidak ada `next/image`, tidak ada `width`/`height` → tidak ada reservasi ruang → CLS.
`public/images/employee.png` 52 kB PNG tanpa WebP/AVIF.

Bonus: **`public/logo.svg` berukuran 691 kB** (SVG sebesar itu hampir pasti raster ter-embed) dan
**tidak direferensikan dari kode mana pun** — yang dipakai `logo.png` (1 kB).

- **Effort S · Risiko S** untuk `width`/`height` + hapus logo.svg. `next/image` **mengubah markup**
  (wrapper span) → berpotensi geser layout, perlu pengecekan visual.

#### C7. `react-bootstrap-icons` — **kemungkinan sudah aman, [UKUR DULU]**
31 file meng-import named (`import { Search } from 'react-bootstrap-icons'`). Paketnya ESM dengan
modul per ikon, jadi webpack **seharusnya** tree-shake. Tidak ada bukti sebaliknya di ukuran chunk.
Tidak perlu diapa-apakan sampai ada bukti.

---

### d. CORRECTNESS

#### D1. `ResponsiveTable`: `useEffect` sinkronisasi state yang bikin setiap tabel di-remount — **[YAKIN]**
`src/components/Table.tsx:43-52`

```tsx
const [isMd, setIsMd] = useState(false);
const query = useMediaQuery({ query: '(min-width: 768px)' });
useEffect(() => { setIsMd(query); }, [query]);

if (!isMd) return <TableSmall {...props} />;
return <Table {...props} />;
```
Ini "sync prop ke state" — pola `useEffect` yang tidak perlu. Akibatnya di desktop:
render 1 = `TableSmall` (layout mobile), lalu effect jalan, render 2 = `Table` (layout desktop).
Karena komponennya beda tipe, React **melepas dan memasang ulang** seluruh subtree tabel.

- **Dampak user:** kedipan layout mobile→desktop di setiap tabel saat load; state internal tabel
  (sort, global filter) di-reset di render kedua.
- **Nuansanya penting:** pola ini kemungkinan dipasang untuk menghindari hydration mismatch, karena
  `useMediaQuery` mengembalikan `false` di server. Jadi **bukan sekadar dihapus** — perlu diganti pola
  yang tetap SSR-safe (mis. render kedua varian dan sembunyikan lewat CSS breakpoint, atau tandai
  komponen sebagai client-only lewat `next/dynamic({ ssr: false })`).
- **Effort M · Risiko M** — menyentuh semua tabel. **Butuh screenshot before/after.**

> **Dikoreksi saat eksekusi Fase 2 — temuan ini dicabut.** Setelah A1 dikerjakan, 38 dari 39
> route dirender sebagai HTML statis, jadi pola dua fase ini justru **benar**: menghitung
> media query saat render pertama akan berbeda dari HTML yang sudah ter-generate dan memicu
> hydration mismatch. Render ganda di sini harganya wajar, bukan kelalaian. Tidak diubah.

#### D2. `useEffect` tanpa dependency array di Layout — **[YAKIN, dampak kecil]**
`src/layouts/Layout.tsx:27-36`

Effect yang mendaftarkan listener `routeChangeStart/Complete/Error` tidak punya dependency array →
unsubscribe + resubscribe di **setiap** render. Fungsional benar (cleanup menutup handler yang sama),
tapi kerja sia-sia dan mudah salah kalau nanti handler-nya dipindah.

- **Effort S · Risiko S**

#### D3. Race condition di pencarian tanpa debounce — **[YAKIN secara teori, UKUR DULU frekuensinya]**
Halaman-halaman di B3

react-query memang membatalkan hasil query lama saat query key berubah, jadi **sebagian besar** race
tertangani. Yang tidak tertangani: jika request "bera" balik **setelah** "beras" (out-of-order di
jaringan lambat), react-query v4 tetap menampilkan hasil query key yang aktif — jadi ini relatif aman.
**Turunkan prioritasnya**; debounce (B3) sudah menyelesaikan akar masalahnya (jumlah request).

#### D4. Tidak ada Error Boundary sama sekali — **[YAKIN]**
Tidak ada `componentDidCatch` / `getDerivedStateFromError` / `Sentry.ErrorBoundary` di seluruh `src/`.

`_error.tsx` hanya menangani error SSR/routing Next, **bukan** exception saat render di client.
Satu throw saat render (persis seperti bug `...undefined` di `TableIncomeUserReport` yang baru kita
perbaiki minggu ini) memblank seluruh aplikasi tanpa pesan, tanpa tombol reload.

- **Dampak user:** layar putih total. Kasir tidak bisa apa-apa selain refresh manual.
- **Perbaikan:** `@sentry/nextjs` **sudah terpasang** dan sudah punya `Sentry.ErrorBoundary` —
  tidak perlu dependency baru.
- **Effort S · Risiko S** — bungkus di `_app.tsx`, tambah fallback UI sederhana.
- **Ini rasio dampak/risiko terbaik kedua setelah A2.**

#### D5. Tombol submit POS tidak di-disable saat submit — **[YAKIN]**
`src/pages/transaction/add.tsx:408`

```tsx
<Button className="mt-4" fullWidth type="submit">Simpan Transaksi</Button>
```
`isSubmitting` **sudah tersedia** dari Formik di baris 80 dan sudah dipakai di 5 field lain di halaman
yang sama (269, 301, 326, 342, 365) — hanya tombol submit-nya yang terlewat.

- **Dampak user:** klik ganda = **dua transaksi**. Di backend ini berarti dua kali jurnal, dua kali
  stok, dua kali utang ke supplier — dan jurnal di sistem ini ditulis sekali lewat observer, tidak
  pernah dihitung ulang. Ini bukan kosmetik.
- **Yang sudah benar:** 17 dari 19 tombol submit lain **sudah** ada guard-nya. Ini benar-benar kelewat satu.
- Satu lagi tanpa guard: `stock-in/add.tsx:560` — tapi itu tombol modal lokal tanpa network, risikonya kecil.
- **Effort S · Risiko S**

#### D6. Dua modal tidak bisa ditutup dengan Escape — **[YAKIN]**
`src/pages/transaction/add.tsx:500` (`ModalSummary`) · `src/pages/employee/[id].tsx:65`

`<Modal isOpen={isOpen} ariaHideApp={false}>` — tanpa `onRequestClose`, react-modal mengabaikan Escape
dan klik overlay. Keduanya juga mematikan `ariaHideApp` sehingga konten latar tetap dibaca screen reader
(padahal `setAppElement` sudah dipasang di `_app.tsx:25`).

- **Effort S · Risiko S**

---

### e. STRUKTUR & TYPE

#### E1. 18 halaman list adalah salinan satu sama lain — **[YAKIN]**
`pages/{customer,supplier,employee,debt,debt-giro,account-receivable,prive,expense,items,transaction,…}/index.tsx`

Tiap file mengulang kerangka yang sama: 5–7 `useState` filter (`paginationUrl`, `sortBy`, `sortType`,
`pageSize`, `fromDate`, `toDate`, sebagian `search`), satu `useFetchX`, destrukturisasi paginator yang
sama persis, `.map()` pembentuk baris, `useMemo` kolom, lalu blok `<Pagination>` dengan 5 handler identik.

Contoh: `pages/debt/index.tsx` dan `pages/debt-giro/index.tsx` punya **set state yang sama** dan blok
paginasi yang sama. Isi kolom dan pemetaan barisnya memang berbeda (`diff` menunjukkan 187 baris beda
dari ~290) — jadi bukan salinan mentah; yang duplikat adalah **kerangkanya**, dan justru kerangka itulah
yang berulang di 18 tempat.

- **Dampak dev:** satu perbaikan paginasi = 18 file. Persis yang terjadi minggu lalu: filter label
  pager tersalin di 14 tempat, dan `TableCapitalChangeList` punya bug paginasi yang tidak ketahuan
  karena tidak ada satu tempat pun yang jadi sumber kebenaran.
- **Perbaikan:** ekstrak **satu** hook `useListPage({ fetcher, sortOptions })` yang mengembalikan
  `{ state, handlers, paginationProps }`. Bukan abstraksi spekulatif — ada 18 pemakai konkret hari ini.
- **Effort L · Risiko M** — **jangan dikerjakan sebelum ada visual regression**, karena menyentuh
  semua halaman list sekaligus.

#### E2. Dua form besar mencampur fetching + business logic + presentasi — **[YAKIN]**
`pages/transaction/add.tsx` (580 baris) · `pages/stock-in/add.tsx` (572 baris)

Satu file berisi: Formik + skema validasi + perhitungan kembalian/diskon/ongkir + mutation + 3 modal
+ tabel item + seluruh markup. `stock-in/add.tsx` juga mendefinisikan `ButtonWithModal` dan
`ModalEditItem` di dalam file yang sama.

- **Dampak dev:** ini jalur uang, dan justru bagian yang paling sulit dibaca dan paling tidak mungkin diuji.
- **Perbaikan bertahap:** keluarkan dulu perhitungan murni (`calculateChange` sudah keluar — teruskan
  polanya), lalu modal-modalnya. Jangan sekali jalan.
- **Effort L · Risiko M-H** — **risiko tertinggi di seluruh daftar ini.** Kerjakan paling akhir,
  setelah ada test untuk perhitungannya.

#### E3. 33 `any` tersisa, terkonsentrasi di batas API — **[YAKIN]**
`hooks/mutation/*` (`UseMutationResult<BackendRes<any>, …>`) dan prop `onSave?: (data: any) => void`.

Sudah turun dari 95 minggu lalu. Sisanya butuh bentuk respons backend yang belum terdokumentasi
(lihat `QUESTIONS.md`) — menebaknya lebih berbahaya daripada membiarkannya `any`.

- **Effort M · Risiko S** tapi **diblokir** oleh dokumentasi backend. Bukan pekerjaan frontend murni.

#### E4. `TableIncomeUserReport.tsx` — 755 baris, 4 section yang hampir identik — **[YAKIN]**
`src/components/table/TableIncomeUserReport.tsx`

`IncomeUserReportSection`, `StockInUserReportSection`, `ExpenseUserReportSection`, `TotalBalanceSection`
punya struktur `useMemo` kolom + `getData()` yang sama persis, beda field saja. Halaman ini juga yang
terberat: page chunk 16.3 kB.

- **Effort M · Risiko M**

#### E5. Nama yang menyesatkan — **[YAKIN, kecil]**
- `pages/debt/index.tsx:22` komponennya bernama **`PrivePage`** padahal ini halaman Utang (hasil copy-paste dari halaman Prive).
- `pages/inventory/audit.tsx` dan `pages/audit/report.tsx` dua-duanya mengekspor `AuditPage`.
- **Effort S · Risiko S**

---

### f. ACCESSIBILITY & UX DASAR

#### F1. 98 `<label>`, nol `htmlFor` — **[YAKIN]**
`components/Label.tsx:6` · `components/Form.tsx:542` (`WithLabelAndError`) · tersebar di semua form

```tsx
const Label = ({ required, children }) => (
  <div>
    <label className="mb-1 inline-block">{children}</label>
    {required && <label className="mb-1 text-red-600">*</label>}
  </div>
);
```
Tidak ada satu pun label yang terhubung ke input-nya. `WithLabelAndError` merender `<Label>` lalu
`children` sebagai saudara, tanpa `htmlFor`/`id`, dan pesan error-nya `<span>` biasa tanpa
`role="alert"` / `aria-describedby` / `aria-invalid`.

Bintang wajib (`*`) juga dirender sebagai **`<label>` kedua** — elemen yang salah untuk dekorasi.

- **Dampak user:** screen reader tidak menyebutkan nama field; klik pada teks label tidak memfokuskan
  input (target sentuh mobile jadi lebih kecil); pesan error tidak diumumkan sama sekali.
- **Kenapa lolos selama ini:** `.eslintrc.js` mematikan `jsx-a11y/label-has-associated-control` secara eksplisit.
- **Perbaikan:** `WithLabelAndError` sudah menerima prop `name` — cukup teruskan sebagai `htmlFor`/`id`.
  Ada satu titik pasang untuk sebagian besar form.
- **Effort M · Risiko S** — tidak mengubah satu piksel pun. **Ini kandidat batch bagus.**

#### F2. Paginasi memakai `<a href="#">` dan `aria-current` di semua tombol — **[YAKIN]**
`src/components/Pagination.tsx:43,52,188-190`

```tsx
<a href="#" aria-current="page" className={classes[variant]} onClick={...}>
```
Tiga masalah dalam satu elemen:
1. `<a href="#">` tanpa `preventDefault()` → tiap klik nomor halaman menambah `#` ke URL, menambah
   entry history (tombol Back jadi rusak), dan melompat ke atas halaman.
2. **`aria-current="page"` dipasang di SEMUA tombol**, bukan hanya yang aktif — screen reader
   mengumumkan setiap nomor sebagai halaman saat ini.
3. Ini tombol, bukan tautan → seharusnya `<button type="button">`.

- **Effort S · Risiko S** — `<a>` → `<button>` bisa menggeser style; class-nya sama, tapi butuh
  pengecekan visual satu screenshot.

#### F3. `<Button>` tanpa focus style — **[YAKIN, perlu verifikasi visual]**
`src/components/Button.tsx:60-68`

Tidak ada `focus:ring` / `focus-visible:` di class mana pun. Input **sudah punya**
(`Form.tsx:93 focus:ring-blue-600 focus:ring-inset focus:ring-2`) — jadi ini inkonsisten, bukan
keputusan desain. Tergantung browser, tombol mungkin masih dapat outline default UA.

- **Perlu dicek langsung di browser** sebelum diperbaiki (Tailwind preflight tidak menghapus outline,
  jadi mungkin masih ada).
- **Effort S · Risiko S**

---

## 3. Bug — dilaporkan terpisah, TIDAK saya perbaiki

Sesuai aturan 3.

| # | Lokasi | Bug | Dampak |
|---|---|---|---|
| BUG-1 | `pages/transaction/add.tsx:503` | Karakter `1` nyasar di JSX: `<label>Nama Customer</label>1<p>` | Angka **1** tercetak di modal ringkasan transaksi yang dilihat kasir tiap selesai transaksi. Kosmetik tapi terlihat |
| BUG-2 | `pages/transaction/add.tsx:408` | Tombol submit POS tanpa `disabled={isSubmitting}` (§D5) | Klik ganda = transaksi + jurnal + stok ganda |
| BUG-3 | 14 hook di `hooks/query/*` (§A2) | Request pertama pasti 404 | 404 palsu membanjiri log backend |
| BUG-4 | `tailwind.config.js:4-9` | `purge` tidak menyertakan `src/hooks/**` | 7 file hook berisi JSX ber-className. Saya cek ke CSS hasil build: **saat ini hanya `max-w-none`** (`hooks/table/useAuditInventory.tsx:129,131`) yang benar-benar hilang — sisanya kebetulan terpakai juga di `components`/`pages`. Jadi **satu style rusak sekarang**, dan jebakan laten untuk setiap class baru yang ditulis di `src/hooks` |
| BUG-5 | `public/logo.svg` | File 691 kB tidak direferensikan siapa pun | Berat repo; tidak ada dampak runtime |
| BUG-6 | `next.config.js:12` | Komentar bilang "masih 387 lint error" | Sudah 0 sejak minggu lalu; `ignoreDuringBuilds` bisa dimatikan sekarang |

---

## 4. Yang sudah baik — jangan disentuh

- **Layer API role-aware** (`utils/api.ts`) — 5 instance + `getApiBasedOnRoles` sudah rapi dan konsisten. Masalahnya cuma guard `enabled` yang hilang (A2), bukan desainnya.
- **Query key tersentral** di `hooks/keys.ts`, semuanya array (aturan v4). Konsisten di 20 domain.
- **`params` yang dibuat ulang tiap render sebagai query key BUKAN bug** — react-query men-serialize key secara deterministik, jadi objek baru dengan isi sama = hash sama = tidak ada refetch. Kelihatan seperti masalah, ternyata bukan.
- **Konteks sudah di-memo dan ramping** (B4).
- **Debounce util sudah ada dan benar** (`utils/debounce.ts:14`) — tinggal dipakai.
- **17 dari 19 tombol submit sudah punya proteksi double-submit** (D5).
- **Input sudah punya focus ring** (`Form.tsx:93`).
- **Paginasi server-side dengan maksimum 20 baris** → virtualisasi tidak relevan (B5).
- **`next/dynamic` sudah dipakai** di `DashboardLayout.tsx:18` — polanya sudah ada, tinggal diterapkan ke recharts.
- **Typecheck bersih (0 error), lint bersih (0 error)**, `ignoreBuildErrors` sudah dimatikan.

---

## 5. Ranking (dampak ÷ risiko)

| # | Temuan | Dampak | Effort | Risiko | Visual berubah? |
|---|---|---|---|---|---|
| 1 | **A2** — `enabled` guard, hilangkan 404 + request ganda | Tinggi | S | S | Tidak |
| 2 | **D4** — Error Boundary | Tinggi | S | S | Tidak |
| 3 | **D5 / BUG-2** — disable tombol submit POS | Tinggi | S | S | Tidak |
| 4 | **B3** — debounce search di 8 halaman | Sedang-Tinggi | S | S | Tidak |
| 5 | **C2** — lazy-load recharts | Sedang | S | S | Tidak (placeholder sama) |
| 6 | **F1** — `htmlFor` + aria pada label & error | Sedang | M | S | Tidak |
| 7 | **C5** — buang Inter, tambah font fallback | Sedang | S | S | Ya, tipis (FOUT hilang) |
| 8 | **C1** — pecah barrel `Form.tsx` | Sedang | M | S | Tidak |
| 9 | **F2** — Pagination `<a>` → `<button>`, `aria-current` | Sedang | S | S | Perlu cek |
| 10 | **D6** — `onRequestClose` di 2 modal | Rendah-Sedang | S | S | Tidak |
| 11 | **B1** — `useWindowSize` → media query | Rendah-Sedang | S | S | Tidak |
| 12 | **C4/C6/BUG-5** — miragejs ke devDeps, dimensi gambar, hapus logo.svg | Rendah | S | S | Tidak |
| 13 | **D1** — `ResponsiveTable` remount | Sedang | M | M | Perlu cek |
| 14 | **A1** — guard ke middleware, kembalikan static optimization | Tinggi | M | M | Tidak |
| 15 | **A4** — loading overlay full-screen | Sedang | M | S | **Ya** |
| 16 | **E1** — ekstrak `useListPage` | Tinggi (dev) | L | M | Tidak, tapi luas |
| 17 | **E4** — rapikan TableIncomeUserReport | Sedang (dev) | M | M | Perlu cek |
| 18 | **C3** — satukan react-table v7/v8 | Sedang (dev) | L | M | Perlu cek |
| 19 | **E2** — pecah 2 form besar | Tinggi (dev) | L | **M-H** | Perlu cek |

---

## 6. Urutan pengerjaan yang saya usulkan

Batch 1–5 tidak mengubah satu piksel pun dan bisa dikerjakan tanpa visual regression.
Batch 6 ke atas **butuh jaring pengaman lebih dulu**.

| Batch | Isi | Kenapa dikelompokkan begini |
|---|---|---|
| **1** | A2 — tambah `enabled` guard di 14 hook query | Satu jenis perubahan, satu baris per file, polanya sudah terbukti di 2 hook. Dampak terbesar per satuan risiko |
| **2** | D4 + D5 + D6 — error boundary, disable submit POS, `onRequestClose` | Semuanya "jaring pengaman correctness", kecil-kecil, tidak saling bergantung |
| **3** | B3 — debounce search di 8 halaman | Satu jenis perubahan, mekanis, hook-nya sudah ada |
| **4** | C2 + C4 + C6 + BUG-5 — lazy recharts, miragejs ke devDeps, dimensi gambar, hapus logo.svg | Semuanya bundle/aset, tidak menyentuh logika |
| **5** | F1 + F2 — label `htmlFor`, Pagination jadi `<button>` | Satu jenis: aksesibilitas form & navigasi |
| **6** | C1 — pecah barrel `Form.tsx` | Perpindahan file besar; butuh review terpisah |
| **7** | A1 — guard ke middleware | Menyentuh auth. Kerjakan sendirian, jangan dicampur |
| **8** | D1 + B1 — `ResponsiveTable` & `useWindowSize` | Dua-duanya soal breakpoint; butuh screenshot |
| **9** | E1 — `useListPage` | Butuh visual regression dulu |
| **10** | E2 + E4 + C3 | Utang jangka panjang. Butuh test dulu |

### Yang perlu disiapkan sebelum mulai

Sebagian sudah ada, sebagian belum:

| Persiapan | Status | Catatan |
|---|---|---|
| **Baseline bundle** | ✅ **Sudah** | Ada di §c. Simpan `npm run build` output hari ini sebagai pembanding |
| **Typecheck + lint bersih** | ✅ **Sudah** | 0 error keduanya. Sudah jadi gate yang bisa dipercaya |
| **Backend lokal jalan** | ✅ **Sudah** | Docker `inv-app` + `inv-db`, data contoh sudah ada. Ini yang bikin A2 bisa saya buktikan, bukan cuma saya duga |
| **Baseline Lighthouse / Web Vitals** | ❌ **Belum** | Butuh: `/login`, `/` (dashboard), `/transaction` (list terberat), `/transaction/add`. Mobile throttling. Tanpa ini, klaim C2/C5 tidak bisa dibuktikan |
| **Screenshot / visual regression** | ❌ **Belum** | **Wajib sebelum batch 6+.** Minimal screenshot manual per halaman di 2 breakpoint (mobile 375, desktop 1440). Idealnya Playwright + toMatchSnapshot |
| **React Profiler recording** | ❌ **Belum** | Diperlukan untuk memutuskan B1 dan B2. Rekam: (a) ketik di search halaman list, (b) drag-resize window. Tanpa ini saya **tidak akan** memasang `useMemo` di mana pun |
| **Error tracking aktif** | ⚠️ **Sebagian** | `@sentry/nextjs` terpasang, `reportError()` sudah dipakai di catch handler. Tapi **tanpa Error Boundary (D4)**, crash saat render tidak pernah sampai ke Sentry. Batch 2 sekaligus menutup lubang ini |
| **Test** | ❌ **Nol** | Tidak diminta sekarang, tapi batch 10 (form besar) tidak boleh dikerjakan tanpa test untuk perhitungan kembalian/diskon/ongkir |

---

## Berhenti di sini

Fase 1 selesai. Tidak ada kode yang saya ubah.

Yang saya butuhkan darimu untuk lanjut ke Fase 2:
1. **Batch mana yang dikerjakan duluan** — rekomendasi saya Batch 1.
2. **Konfirmasi A4** (loading overlay) — itu satu-satunya temuan yang perbaikannya pasti mengubah tampilan.
3. **Kalau ada keluhan konkret dari user/PM** yang belum saya tangkap, sebutkan — ranking bisa berubah.
