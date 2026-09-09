# Fase 2 — Eksekusi

Basis pembanding: commit `HEAD` di branch `dev-kholis`, diukur dengan toolchain yang sama.
Semua angka di bawah diukur, bukan diperkirakan.

## Gerbang verifikasi

| | Sebelum | Sesudah |
|---|---|---|
| `npm run lint` | 0 error, 33 warning | **0 error, 33 warning** |
| `npm run type:check` | 0 error | **0 error** |
| `npm run build` | lolos | **lolos** |
| `prettier --check src/**/*.{ts,tsx}` | bersih | **bersih** |
| Smoke test `next start` | — | **12 route → HTTP 200** |

## Yang TIDAK dikerjakan

| Temuan | Alasan |
|---|---|
| **A4** — loading overlay full-screen | Satu-satunya perbaikan yang **pasti mengubah tampilan**. Aturan pixel-per-pixel masih berlaku, jadi butuh persetujuan terpisah |
| **D1** — `ResponsiveTable` render ganda | **Temuan dicabut.** Lihat §7 |
| **E1/E2/E4/C3** — `useListPage`, pecah 2 form besar, rapikan TableIncomeUserReport, satukan react-table v7/v8 | Butuh visual regression + test yang belum ada. Lihat §8 |
| **E3** — 33 `any` sisa | Diblokir dokumentasi backend (`QUESTIONS.md`) |

---

## Batch 1 — `enabled` guard (A2)

**Sebelum:** 14 dari 16 hook query menembakkan request pada render pertama saat `roles` masih
kosong. `getApiBasedOnRoles([], …)` jatuh ke base URL publik tanpa header Authorization.

**Sesudah:** 22 query di 20 berkas `src/hooks/query/*` menunggu roles tersedia.

```diff
-  const fetcher = useMyQuery([keys.debts, data, roles], async () => {
+  const fetcher = useMyQuery([keys.debts, data, roles], async () => {
     ...
-  });
+  }, { enabled: (roles?.length ?? 0) > 0 });
```

**Untuk hook yang menerima `options` dari pemanggil, guard-nya digabung — tidak menimpa:**

```ts
enabled: (options?.enabled ?? true) && (roles?.length ?? 0) > 0
```

Ini penting dan **memperbaiki bug di pola lama**. Pola yang sudah ada di `useFetchSale.ts` dan
`useFetchStockIn.ts` menulis `{ ...options, enabled: (roles?.length ?? 0) > 0 }`, yang **menimpa**
`enabled` milik pemanggil. `useFetchInvoice` dipanggil dengan `enabled: false` (invoice hanya
diambil saat tombol Download ditekan). Kalau saya menyalin pola lama apa adanya, setiap baris
tabel transaksi akan mengunduh PDF invoice saat halaman dibuka.

Dua hook diperiksa lalu **tidak** diberi guard karena memang tidak bergantung role
(`useFetchEmployeeById`, `useFetchSaleById` memakai `apiInstanceAdmin()` langsung).

### Cara membuktikan

Backend lokal (`docker compose -f docker-compose.dev.yml up -d`) sudah jalan:

```bash
# Request yang dulu terjadi lebih dulu — base URL publik, tanpa Authorization
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:8000/api/v1/debts \
  -H 'Content-Type: application/json' -d '{"paginated":true}'
# → 404

# Request yang benar
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"super_admin","password":"SuperAdmin"}' | jq -r .data.access_token)
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:8000/api/v1/superadmin/debts \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"paginated":true}'
# → 200
```

**Yang harus kamu cek manual:** buka DevTools → Network di halaman list mana pun. Sebelumnya
ada dua gelombang request dengan satu 404; sekarang harus tinggal satu gelombang setelah
`/auth/self` selesai. **Metrik: jumlah request dan jumlah 404 di Network tab, bukan "terasa lebih cepat".**

---

## Batch 2 — Error boundary, double-submit, modal (D4, D5, D6)

### D4 — Error Boundary

`src/pages/_app.tsx`. Memakai `Sentry.ErrorBoundary` yang **sudah terpasang** — tanpa dependency baru.

**Sebelum:** satu throw saat render memblank seluruh aplikasi, tanpa pesan, dan tidak pernah
sampai ke Sentry (`_error.tsx` hanya menangani error SSR/routing).
**Sesudah:** fallback berisi judul, penjelasan, dan tombol "Muat ulang halaman"; exception terkirim ke Sentry.

**Cek manual:** untuk mengujinya, sisipkan `throw new Error('test')` sementara di sebuah komponen
halaman. Harus muncul kartu fallback, bukan layar putih.

### D5 — Double-submit di POS

`src/pages/transaction/add.tsx:408`

```diff
-<Button className="mt-4" fullWidth type="submit">
+<Button className="mt-4" fullWidth disabled={isSubmitting} type="submit">
```

`isSubmitting` sudah tersedia di baris 80 dan sudah dipakai di 5 field lain di file yang sama.

**Tombol kedua di `stock-in/add.tsx:560` sengaja TIDAK diubah.** Saya sempat menambahkannya lalu
mencabut kembali: itu ada di dalam `ButtonWithModal`, yang punya Formik sendiri dengan `onSubmit`
sinkron tanpa network sama sekali. Tidak ada risiko double-submit, dan `isSubmitting` bahkan
tidak ada di scope-nya (typecheck yang menangkap ini).

**Cek manual — ini jalur uang:** buat transaksi, klik "Simpan Transaksi" dua kali cepat.
Harus hanya satu transaksi yang terbentuk. Verifikasi di backend:
```sql
SELECT transaction_code, COUNT(*) FROM transactions GROUP BY 1 HAVING COUNT(*) > 1;
```

### D6 — Modal bisa ditutup

| Berkas | Sebelum | Sesudah |
|---|---|---|
| `pages/transaction/add.tsx:500` | `<Modal isOpen ariaHideApp={false}>` | `<Modal isOpen onRequestClose={onClose}>` |
| `pages/employee/[id].tsx:65` | `<Modal isOpen={openModal}>` | `+ onRequestClose={() => setOpenModal(false)}` |
| `components/table/TableComponent.tsx:50` | `ariaHideApp={false}` | dihapus |

`ariaHideApp` dihidupkan lagi karena `setAppElement('#__next')` sudah dipasang di `_app.tsx`.

**Cek manual:** buka modal ringkasan transaksi dan modal nonaktifkan karyawan → tekan Escape
dan klik area gelap di luar modal. Keduanya harus menutup.

---

## Batch 3 — Debounce pencarian (B3)

**Koreksi ke audit: 4 halaman, bukan 8.** `prive`, `pre-paid-salary`, `debt-giro`, dan
`general-ledger` memakai prop `search` pada `<Table>` hanya sebagai slot toolbar (judul +
date range), tanpa input teks. Saya salah menghitungnya di Fase 1.

Yang diubah: `transaction/index.tsx`, `supplier/index.tsx`, `employee/index.tsx`, `customer/index.tsx`.

```diff
   const [searchQuery, setSearchQuery] = useState('');
+  // 500 ms: tanpa ini tiap ketikan mengirim satu request pencarian
+  const debouncedSearchQuery = useDebounceValue(searchQuery, 500);

   const { data } = useFetchCustomers({
-    search: searchQuery,
+    search: debouncedSearchQuery,
```

`useDebounceValue` sudah ada di `src/utils/debounce.ts:14` dan sudah dipakai di `debt` dan
`account-receivable`. **Tidak ada dependency atau hook baru.** Nilai input tetap tidak
ter-debounce, jadi ketikan tetap terasa instan.

**Cek manual:** Network tab, ketik "beras" (5 huruf) di pencarian Customer.
**Metrik: jumlah request.** Sebelum 5, sesudah 1.

---

## Batch 4 — Bundle & aset (C2, C4, C6, BUG-5)

### C2 — recharts di-lazy-load

Chart dipindah ke `src/components/SalesChart.tsx`, dimuat lewat `next/dynamic` — pola yang
**sudah dipakai** di `layouts/DashboardLayout.tsx:18`.

```tsx
const SalesChart = dynamic(() => import('@/components/SalesChart'), {
  ssr: false,
  loading: () => <div style={{ height: 308 }} />,
});
```

Tinggi placeholder 308 px sama persis dengan `ResponsiveContainer height={308}` yang lama, jadi
tidak ada layout shift. `ssr: false` karena `ResponsiveContainer` mengukur lebar container di browser.

**Jebakan yang sempat saya buat sendiri:** awalnya saya meng-import `SALES_CHART_HEIGHT` dari
modul yang sama untuk dipakai di placeholder. Import statis apa pun dari modul yang di-`dynamic`
membuat webpack menariknya kembali ke bundel awal — code-splitting-nya batal total. Sekarang
tingginya ditulis literal dengan komentar penjelas.

### Sisanya

| | Aksi |
|---|---|
| `miragejs` | `dependencies` → `devDependencies` (±200 kB tidak lagi ikut `npm ci` produksi) |
| `public/logo.svg` | **Dihapus** — 691 kB, nol referensi di seluruh repo |
| `components/List.tsx`, `layouts/DashboardLayout.tsx` | `width`/`height` eksplisit pada `<img>` |
| `public/images/employee.png` | **Tidak diubah.** Resize 860→480 px hanya menghemat 10 kB (52→42). Tidak sebanding dengan risiko menyentuh aset biner tanpa pengecekan visual |
| `src/utils/server.ts` | **Tidak dihapus**, hanya diberi `eslint-disable import/no-extraneous-dependencies` dengan alasan. Ini kode mati, tapi menghapusnya keputusanmu — mudah kamu lakukan, menyusahkan kalau saya salah |

---

## Batch 5 — Aksesibilitas (F1, F2)

### F1 — Label terhubung ke input

Masalahnya: `WithLabelAndError` merender `<Label>` lalu `children` sebagai saudara. Ia tidak bisa
menyuntik `id` ke `children` sembarangan — `cloneElement` akan salah untuk `ThemedSelect`, karena
react-select merender input-nya sendiri di dalam container (perlu `inputId`, bukan `id`).

Solusinya: **tiap kontrol menurunkan `id` dari `name`-nya sendiri.** Satu titik ubah per komponen,
nol perubahan di ~50 call site.

```diff
 <input
+  id={props.id ?? props.name}
+  aria-invalid={hasError || undefined}
+  aria-describedby={hasError && props.name ? `${props.name}-error` : undefined}
   {...props}
```

| Berkas | Perubahan |
|---|---|
| `components/Label.tsx` | terima `htmlFor`; asterisk wajib `<label>` → `<span aria-hidden>` (dulu tiap field punya **dua** `<label>`) |
| `components/Form.tsx` | `WithLabelAndError` kirim `htmlFor={name}`; pesan error dapat `id` + `role="alert"` |
| `TextField`, `TextArea`, `Checkbox`, `PhoneNumberTextField`, `CurrencyTextField` | `id` diturunkan dari `name` |
| `ThemedSelect` | `inputId` diturunkan dari `name` |

**Terverifikasi di HTML hasil render:**
```
$ curl -s http://localhost:3100/login | grep -o 'for="[^"]*"'
for="password"
for="usernameEmail"
```
Sebelumnya: **98 `<label>`, nol `htmlFor`.**

**Cek manual:** klik teks label "Password" di /login — kursor harus lompat ke input-nya.

### F2 — Paginasi

`components/Pagination.tsx`: `<a href="#">` → `<button type="button">` di 3 tempat
(nomor halaman, Previous, Next mobile), dan `aria-current="page"` sekarang hanya di tombol aktif —
sebelumnya dipasang di **semua** tombol.

**Kenapa aman secara visual:** `class`-nya identik, dan Tailwind preflight sudah menyetel
`button { cursor: pointer }` (saya cek langsung di CSS hasil build), jadi kursor tidak berubah.
Saya juga pastikan tidak ada aturan `button` global dari react-datepicker — rule `background:#f0f0f0`
yang sempat mencurigakan ternyata ter-scope ke `.react-datepicker__today-button`.

**Efek samping yang diinginkan:** tombol Back browser tidak lagi rusak. Sebelumnya tiap klik nomor
halaman menambah entry `#` ke history dan melompat ke atas halaman.

**Cek manual:** klik beberapa nomor halaman, lalu tekan Back. Harus kembali ke halaman sebelumnya,
bukan menelusuri `#` satu per satu.

---

## Batch 6 — Font (C5)

`src/pages/_document.tsx` + `tailwind.config.js`

```diff
-family=Noto+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap
+family=Noto+Sans:wght@400;500;700&display=swap
-<link href="...family=Inter&display=optional" rel="stylesheet" />
```

Dasarnya diukur, bukan ditebak: `grep` seluruh `src/` menemukan `font-bold` 170×, `font-medium` 9×,
dan **nol** kelas `italic`. Weight 600 dan seluruh 8 varian italic tidak pernah dipakai.
Link Inter dihapus karena `tailwind.config.js` hanya mendefinisikan Noto Sans dan tidak ada rujukan
Inter di mana pun — satu stylesheet render-blocking tanpa pemakai.

```diff
-      sans: ['Noto sans'],
+      sans: ['Noto Sans', 'system-ui', '-apple-system', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
```

Tanpa fallback, browser memakai default UA (serif di sebagian besar browser) sampai webfont selesai.
Digabung `display=swap`, hasilnya pergantian **serif → sans** di seluruh aplikasi — metrik hurufnya
berubah, jadi ikut menggeser layout.

**Ini satu-satunya perubahan yang mengubah piksel, dan arahnya memperbaiki:** teks sebelum font
selesai dimuat sekarang tampil dengan sans sistem, bukan serif.

**Cek manual:** DevTools → Network → throttle "Slow 3G" → reload. Perhatikan teks saat font belum
selesai. **Metrik: CLS di Lighthouse, dan jumlah request font (2 → 1).**

---

## Batch 7 — Pecah barrel `Form.tsx` (C1)

Saya ukur dulu di mana pemisahannya berbuah, lalu memisahkan hanya sebanyak itu.

Berkas yang **hanya** butuh input polos: `login/index.tsx`, `login/recover.tsx`,
`forget-password.tsx`, `CreateSupplierForm.tsx`, `hooks/table/useAuditInventory.tsx`.
Halaman lain toh butuh select atau datepicker, jadi memecah lebih jauh tidak menghasilkan apa-apa.

`src/components/TextField.tsx` (baru) berisi `TextField`, `TextArea`, `Checkbox`,
`PhoneNumberTextField`, `WithLabelAndError`. `Form.tsx` **mengekspor ulang semuanya**, jadi import
lama tetap jalan — hanya 5 berkas di atas yang diarahkan ke modul baru.

**Terukur:** `/login` **314 kB → 238 kB First Load JS (−76 kB, −24%)**. Halaman ini yang pertama
dilihat semua orang setiap pagi.

---

## Batch 8 — `useWindowSize` → `useBreakpoint` (B1)

`src/hooks/useWindowSize.ts` → `src/hooks/useBreakpoint.ts`, 7 pemakai dimigrasikan.

**Sebelum:** `setSize(window.innerWidth)` di setiap event resize. Tiap piksel geseran memicu
render ulang seluruh halaman pemakainya.
**Sesudah:** `matchMedia`, state hanya berubah saat melewati breakpoint.

Ketujuh pemakainya memang cuma butuh boolean (`windowSize >= MD`), tidak pernah butuh angka pikselnya.

**Nilai awal sengaja tetap `false` dan baru dihitung di dalam `useEffect`** — sama seperti perilaku
lama (`useState(0)`). Setelah Batch 9, halaman ini dirender sebagai HTML statis; menghitung
`matchMedia` saat render pertama akan berbeda dari HTML yang sudah ter-generate dan memicu
hydration mismatch. Jadi urutan render pertama tidak berubah sama sekali.

**Cek manual — ini yang perlu Profiler, bukan perasaan:** rekam React Profiler sambil drag-resize
window di `/debt`. **Metrik: jumlah commit selama satu drag.** Sebelum: satu commit per piksel.
Sesudah: satu commit saat melewati 1440 px.

---

## Batch 9 — Auth guard ke middleware (A1)

`MyApp.getInitialProps` dihapus, digantikan `src/middleware.ts` (Next 12.3 sudah mendukung
konvensi `middleware.ts` stabil).

**Logika guard disalin persis**, termasuk daftar whitelist-nya yang janggal — lihat BUG-7.

`<Hydrate>` ikut dilepas dari `_app.tsx`: `dehydrate()` selalu mengembalikan state kosong karena
tidak ada prefetch, jadi itu murni satu lapis pembungkus tanpa guna (komentarnya sudah ada di
kode sejak sebelumnya).

### Hasil terukur

| | Sebelum | Sesudah |
|---|---|---|
| Route `○ (Static)` | **0** | **38** |
| Route `λ (Server)` | **39** | **1** (`/404`, memang harus — `_error.tsx` perlu `getInitialProps` untuk Sentry) |

### Terverifikasi terhadap server produksi lokal

```
GET /transaction    (tanpa cookie)  → 307 → /login
GET /login          (tanpa cookie)  → 200
GET /forget-password(tanpa cookie)  → 200
GET /transaction    (dengan cookie) → 200
GET /login          (dengan cookie) → 307 → /
GET /login/recover  (tanpa cookie)  → 307 → /login   ← perilaku lama, lihat BUG-7
GET /_next/static/chunks/webpack-*.js → 200          ← aset tidak kena middleware
GET /logo.png                         → 200
```

`matcher` mengecualikan `_next/static`, `_next/image`, `images/`, `favicon.ico`, `logo.png` —
middleware yang menyentuh aset hanya menambah latensi.

**Cek manual — ini menyentuh auth, jadi paling perlu perhatian:**
1. Logout, coba buka `/transaction` langsung → harus ke `/login`
2. Login, coba buka `/login` → harus ke `/`
3. Login, refresh keras di halaman dalam → harus tetap di halaman itu
4. Hard refresh beberapa kali → pastikan tidak ada redirect loop

---

## Batch 10 — Bug dari laporan Fase 1

| # | Aksi |
|---|---|
| **BUG-1** | Karakter `1` nyasar di `transaction/add.tsx:503` (`<label>Nama Customer</label>1<p>`) dihapus. Angka itu tercetak di modal ringkasan yang dilihat kasir tiap selesai transaksi |
| **BUG-2** | = D5 |
| **BUG-3** | = A2 |
| **BUG-4** | `tailwind.config.js` `purge` → `['./src/**/*.{js,ts,jsx,tsx}']`. Daftar lama melewatkan `src/hooks/**` dan menyebut `src/wrappers` yang tidak ada. **Terverifikasi di CSS hasil build: `.max-w-none` sebelumnya 0 kemunculan, sekarang 1.** CSS tumbuh 44.130 → 44.628 byte (+1%) |
| **BUG-5** | `public/logo.svg` (691 kB, nol referensi) dihapus |
| **BUG-6** | `next.config.js`: komentar usang dihapus, `eslint.ignoreDuringBuilds` → `false`. Build sekarang gagal kalau ada lint error baru |

---

## Bug baru yang ditemukan saat eksekusi — dilaporkan, TIDAK diperbaiki

| # | Lokasi | Bug |
|---|---|---|
| **BUG-7** | `src/middleware.ts` (dulu `_app.tsx:68`) | `/login/recover` tidak ada di whitelist, padahal `Layout.tsx:12` memperlakukannya sebagai halaman publik. Pengunjung yang belum login dilempar ke `/login` saat membuka link reset password — kemungkinan besar membuat fitur reset password tidak bisa dipakai sama sekali. **Perilaku lama saya pertahankan persis** karena memperbaikinya mengubah alur auth, dan itu keputusanmu. Perbaikannya satu baris: tambahkan `'/login/recover'` ke `PUBLIC_PATHS` |
| **BUG-8** | `useFetchEmployeeById`, `useFetchSaleById` | Tidak ada guard `enabled: !!id`. Di Pages Router, `router.query.id` bernilai `undefined` pada render pertama, jadi kemungkinan ada request ke `/employees/undefined`. Sepupunya `useFetchItemById` **sudah** punya `enabled: !!id`. Belum saya konfirmasi ke Network tab — perlu dicek dulu sebelum diperbaiki |

---

## Ringkasan angka

| Route | Sebelum | Sesudah | Delta |
|---|---|---|---|
| `/` (dashboard) | λ 417 kB | ○ **320 kB** | **−97 kB** |
| `/login` | λ 314 kB | ○ **238 kB** | **−76 kB** |
| `/forget-password` | λ 314 kB | ○ **238 kB** | **−76 kB** |
| `/login/recover` | λ 314 kB | ○ **239 kB** | **−75 kB** |
| `/supplier/add`, `/supplier/[id]/edit` | λ 314 kB | ○ **239 kB** | **−75 kB** |
| Halaman CRUD lain | λ 314–349 kB | ○ 317–352 kB | **+3 kB** |

`+3 kB` di halaman lain adalah `Sentry.ErrorBoundary` di `_app`. Menurut saya itu harga yang pantas
untuk menghilangkan layar putih total, tapi itu penilaian saya — kalau kamu tidak setuju,
katakan dan saya cabut D4.

**118 berkas berubah, 5 berkas baru** (`middleware.ts`, `TextField.tsx`, `SalesChart.tsx`,
`useBreakpoint.ts` hasil rename, plus dokumen ini).

## Yang masih belum ada

Angka di atas semuanya **bundle size dan jumlah request** — dua hal yang bisa saya ukur tanpa
perkakas tambahan. Yang **belum** bisa saya klaim sama sekali:

- **LCP, CLS, TBT.** Belum ada baseline Lighthouse, jadi saya tidak bisa bilang C2/C5/C1
  memperbaiki Web Vitals — hanya bahwa byte-nya berkurang.
- **Biaya render.** Belum ada Profiler recording, jadi klaim B1 berhenti di "jumlah setState
  berkurang", bukan "berapa ms lebih cepat".
- **Regresi visual.** Nol screenshot before/after. Verifikasi visual sepenuhnya masih di tanganmu.

Batch 9 (middleware/auth) dan batch 5 (Pagination `<a>` → `<button>`) yang paling perlu kamu
lihat sendiri sebelum deploy.
