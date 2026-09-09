# Refactor Frontend — Ringkasan Perubahan

Cakupan: **hanya `inventory-management-fe`**. Backend tidak disentuh.
Baseline pembanding: commit `HEAD` di branch `dev-kholis`, diukur dengan toolchain yang sama.

## Ringkasan angka

| Ukuran | Sebelum | Sesudah |
|---|---|---|
| `npx eslint src` — error | **388** | **0** |
| `npx eslint src` — warning | 127 | **33** (semua `no-explicit-any`) |
| `npx tsc --noEmit` | 0 error | 0 error |
| `yarn build` | lolos | lolos |
| File tersentuh | — | 91 |

Rincian error yang hilang: `react/function-component-definition` 149, `prettier/prettier` 84,
`react/require-default-props` 54, `no-unsafe-optional-chaining` 23, `react/no-unstable-nested-components` 21,
`simple-import-sort/imports` 17, `react/jsx-no-useless-fragment` 11, `default-param-last` 9,
`no-unused-vars` 4, `react-hooks/exhaustive-deps` 3, `react/jsx-no-constructed-context-values` 3, sisanya kecil-kecil.

Catatan: `next.config.js` masih menyetel `typescript.ignoreBuildErrors` dan `eslint.ignoreDuringBuilds` ke `true`,
jadi `yarn build` **tidak** menjamin apa pun. Jalankan `yarn lint` dan `yarn type:check` secara eksplisit.

---

## 1. Bug fungsional yang diperbaiki

### 1.1 Tombol "Simpan Penyesuaian" di `/stock-in/add` tidak bekerja

`src/utils/validation/stock-in.ts`

```diff
-  isNew: object().nullable(),
+  isNew: bool().nullable(),
```

- **Sebelum:** `isNew` adalah boolean, tetapi divalidasi sebagai `object()`. Yup selalu menolaknya,
  jadi `handleSubmit` berhenti di tahap validasi. Karena `isNew` tidak punya field di form,
  tidak ada pesan error yang muncul di mana pun — tombolnya terlihat seperti mati total.
- **Sesudah:** validasi lolos, modal menyimpan baris penyesuaian, dan tabel di halaman induk terisi.
- Ini penyebab keluhan awal "tombol di line 557 tidak jalan".

### 1.2 Warning "state update on unmounted component" saat menyimpan penyesuaian

`src/pages/stock-in/add.tsx` — urutan di `onSubmit` dibalik menjadi `setIsOpen(false)` → `resetForm()` → `onSave(values)`.

- **Sebelum:** `onSave()` memanggil `setFieldValue` di parent, yang membangun ulang baris tabel dan
  melepas modal ini; `setIsOpen(false)` sesudahnya menyentuh komponen yang sudah unmount.
- **Sesudah:** modal ditutup lebih dulu, tidak ada update state ke komponen mati.

### 1.3 Paginasi "Laporan Perubahan Modal" mati total

`src/components/table/TableCapitalChangeList.tsx`

```diff
-  const { from, to, total, links, next_page_url, last_page_url, prev_page_url } = {} as any;
+  const { from, to, total, links, next_page_url, last_page_url, prev_page_url } = dataRes ?? {};
```

- **Sebelum:** seluruh nilai paginasi didestrukturisasi dari objek kosong. Footer selalu
  "Showing 0 to 0 of 0 results", tombol nomor halaman tidak pernah muncul, dan tombol Next/Previous
  menyetel URL kosong. Cast `as any` menyembunyikannya dari TypeScript.
- **Sesudah:** paginasi memakai paginator asli dari respons.

### 1.4 Modal di tabel Barang Masuk tertutup sendiri

`src/components/table/TableStockIn.tsx` — `const Action = (...)` yang dirender `<Action />`
diganti menjadi `function renderAction(...)` yang dipanggil `renderAction({...})`.

- **Sebelum:** `Action` didefinisikan di dalam `TableStockIn`, jadi identitasnya baru tiap render.
  React melepas dan memasang ulang seluruh subtree-nya — modal konfirmasi yang sedang terbuka
  di dalamnya ikut tertutup, dan state internalnya hilang.
- **Sesudah:** hasil JSX-nya jadi bagian dari pohon parent; tidak ada remount.

### 1.5 Input jam kehilangan fokus tiap ketikan

`src/components/Form.tsx` — `ExampleCustomTimeInput` dihoist keluar dari `DatePickerComponent`
dan dinamai `CustomTimeInput`.

- **Sebelum:** react-datepicker merendernya sebagai komponen. Karena didefinisikan di dalam render,
  tiap perubahan state membuat komponen baru → input di-remount → kursor dan fokus lepas saat mengetik jam.
  Bonus: masih memakai `style={{ border: 'solid 1px pink' }}`, salinan mentah dari contoh dokumentasi
  react-datepicker yang ikut terkirim ke produksi.
- **Sesudah:** identitas komponen stabil, styling mengikuti field lain.

### 1.6 Pencarian barang tidak benar-benar ter-debounce

`src/components/Form.tsx` — `debounce(...)` pada `SelectItems` dan `SelectItemsDetail` dibungkus `useMemo`.

- **Sebelum:** `debounce()` menyimpan timer di closure-nya. Dipanggil langsung di dalam render, tiap
  re-render menghasilkan closure baru dengan timer baru, sehingga `clearTimeout` tidak pernah
  membatalkan timer sebelumnya — tiap ketikan tetap memicu request ke `/items`.
- **Sesudah:** satu instance debounce per komponen, request benar-benar ditahan 300 ms.

### 1.7 `...undefined` melempar TypeError di Laporan Pendapatan per Kasir

`src/components/table/TableIncomeUserReport.tsx` (4 tempat)

```diff
-      ...(incomeUserReport ? incomeUserReport?.income_report?.map(...) : []),
+      ...(incomeUserReport?.income_report ?? []).map(...),
```

- **Sebelum:** ternary hanya mengecek objek induknya. Kalau `income_report` tidak ada, ekspresinya
  menjadi `...undefined` yang langsung melempar dan mematikan render halaman.
- **Sesudah:** fallback ke array kosong.

### 1.8 NaN muncul di UI dan terkirim ke backend

| Berkas | Sebelum | Sesudah |
|---|---|---|
| `components/form/PayDebt.tsx` | `unpaidAmount: +debt?.amount - +debt?.paid_amount` → `NaN` saat `debt` undefined, dan NaN itu ikut terkirim sebagai `paid_amount` ketika "bayar lunas" dicentang | dikoersi sekali di `debtAmount`/`paidAmount`, `unpaidAmount` dihitung dari keduanya |
| `components/form/PaySalary.tsx` | `salary: payroll.employee_salary` (bisa `null`/string dari API), lalu `salary - paidAmount` = `NaN` | `+(payroll.employee_salary ?? 0)` di batas API |
| `pages/ledger/[id].tsx` | `total.debit - total.credit` tanpa fallback → saldo periode tampil `NaN` | `+(… ?? 0)` untuk debit dan kredit |
| `pages/transaction/add.tsx` | key baris pembayaran `payAmount + paymentDue?.toString() + paymentMethod` menghasilkan `"NaN[object Object]"` dan bertabrakan antar baris | key stabil dari `paymentMethod.value` + index |

### 1.9 Error ditelan diam-diam

Enam tempat menangkap error lalu hanya `console.log`/`console.error` — user tidak dapat umpan balik apa pun
dan produksi tidak meninggalkan jejak, padahal Sentry sudah terpasang di repo (tapi hanya terpakai di `_error.tsx`).

Dibuat satu pintu: **`src/utils/reportError.ts`** — `Sentry.captureException` + `console.error` khusus non-produksi.

| Berkas | Sebelum | Sesudah |
|---|---|---|
| `pages/stock-in/add.tsx` | submit gagal → layar diam | `reportError` + toast "Gagal menyimpan barang masuk" |
| `pages/transaction/add.tsx` | submit gagal → layar diam | toast "Gagal menyimpan transaksi" |
| `pages/employee/[id].tsx` | simpan karyawan gagal → layar diam | toast "Gagal menyimpan data karyawan" |
| `pages/monthly-salary/preview/index.tsx` | bayar gaji gagal → layar diam | toast "Gagal membayar gaji" |
| `components/Button.tsx` | tolak transaksi gagal → layar diam | toast "Gagal menolak transaksi" |
| `hooks/mutation/useAuth.ts` | `console.error(e, 'ERROR')` | `reportError` |
| `components/table/TableComponent.tsx`, `TableCapitalChange.tsx` | toast tanpa laporan | toast + `reportError` |

### 1.10 Aksesibilitas modal

`src/pages/_app.tsx` — ditambahkan `ReactModal.setAppElement('#__next')`.

- **Sebelum:** tiap modal melempar peringatan a11y ke console, dan screen reader tetap membacakan
  konten di belakang modal.
- **Sesudah:** konten latar diberi `aria-hidden` saat modal terbuka.

### 1.11 Sidebar menyisakan slot kosong

`src/components/menu/Menu.tsx` — `return <div />` → `return null` untuk menu tanpa izin.

- **Sebelum:** menu yang tidak diizinkan meninggalkan node kosong, sidebar terlihat berlubang.
- **Sesudah:** tidak dirender sama sekali. Pemetaan index ke `MENU_LIST` sengaja tidak diubah,
  karena `activePage` memakai index dari list penuh.

---

## 2. Performa dan struktur

| Perubahan | Sebelum | Sesudah |
|---|---|---|
| `context/app-context.tsx`, `home-context.tsx`, `permission-context.tsx` — value dibungkus `useMemo` | objek `{ state, dispatch }` baru tiap render; `PermissionProvider` membungkus seluruh app dan menghitung ulang `getPermission()` + `Set` tiap render, memaksa semua consumer re-render | value hanya berubah saat state berubah |
| `components/form/CreateEmployeeForm.tsx` — `initialValues` dibungkus `useMemo` | objek baru tiap render membuat `useMemo` skema yup di bawahnya tidak pernah memo; skema dibangun ulang terus | skema dibangun ulang hanya saat sumbernya berubah |
| `components/table/TableIncomeUserReport.tsx` — `createColumnHelper` dihoist ke module scope, deps `useMemo` diperbaiki | helper baru tiap render + clone array `income_report` tiap render → kolom dibangun ulang terus | satu helper untuk seluruh berkas, kolom memo beneran |
| `components/Form.tsx` — `formatItemsToOption` dihoist | fungsi identik disalin di dalam `SelectItems` dan `SelectItemsDetail`, dibuat ulang tiap render | satu fungsi di module scope |
| `components/Pagination.tsx` — filter label `&laquo; Previous` / `Next &raquo;` dipindah ke dalam komponen | filter yang sama disalin di **14** call site | call site cukup `links={links ?? []}` |
| 21 blok `try { … } catch (e) { console.error(e); throw e; }` di `hooks/mutation/*` dan `hooks/query/*` dihapus | kode mati: error langsung dilempar ulang dan ditangani `onError` react-query, catch-nya tidak menambah apa pun | mutationFn/queryFn langsung, ~130 baris hilang |
| `pages/_app.tsx` — `getInitialProps` dirapikan | `try/catch` membungkus blok prefetch yang seluruhnya terkomentar; `dehydrate()` atas QueryClient kosong tidak mungkin melempar | try/catch dihapus, komentar menjelaskan bahwa `<Hydrate>` saat ini no-op |

---

## 3. Tipe

| Perubahan | Sebelum | Sesudah |
|---|---|---|
| Field paginator di 9 berkas `src/typings/*` (19 field) | `next_page_url?: any`, `prev_page_url?: any` | `string \| null` |
| `typings/audit.ts`, `debts.ts`, `expense.ts` | `item_name?: any`, `audit_date?: any`, `paid_date?: any`, `date?: any` | `string` / `string \| null` |
| `hooks/useOnClickOutside.ts` | `ref: MutableRefObject<null \| { contains: Function }>, handler: Function` + `eslint-disable ban-types` | `ref: RefObject<Node \| null>, handler: (e: MouseEvent \| TouchEvent) => void` |
| `components/Form.tsx` — `Checkbox` | `InputHTMLAttributes<unknown>`, jadi tiap call site menulis `onChange={(e: any) …}` untuk membaca `e.target.checked` | `InputHTMLAttributes<HTMLInputElement>`, `e` ter-infer di 3 call site |
| `components/transaction/PaymentMethod.tsx` | `values: any`, `errors/touched: Record<string, any>` | `PaymentMethodValues`, `FormikErrors`/`FormikTouched`. Ini **memunculkan** 3 type error yang selama ini tersembunyi (tanggal jatuh tempo `Date \| string` ke DatePicker, dan error formik per-baris yang bisa `string`), semuanya sudah ditangani |
| `getPopupContainer={(trigger: any) => …}` di 3 tempat | prop milik antd, bukan react-select — diabaikan diam-diam | dihapus |
| `.includes('superadmin' as any)` | cast tidak perlu, `Role.name` sudah `string` | cast dihapus |
| `pages/inventory/audit.tsx` | `setDate(value as any)` — react-datepicker mengirim `Date \| null` | `if (value) setDate(value)` |
| `pages/_app.tsx` | `require('dayjs/locale/id')` | `import 'dayjs/locale/id'` |

`no-explicit-any`: **95 → 33**.

---

## 4. Konfigurasi

`.eslintrc.js` — empat aturan airbnb dimatikan karena dirancang untuk React + `propTypes`, bukan TypeScript.
Di repo ini semuanya sudah dijamin TypeScript, jadi hanya menghasilkan ratusan error gaya tanpa menangkap bug:

| Aturan | Aksi | Alasan |
|---|---|---|
| `react/function-component-definition` (149) | `off` | arrow FC dan function declaration sama-sama dipakai dan sama benarnya |
| `react/require-default-props` (54) | `off` | prop opsional TS diberi default lewat destructuring |
| `react/no-unused-prop-types` (2) | `off` | tidak bisa melacak prop dari type alias generik seperti `TableProps<T>` |
| `default-param-last` (9) | `off`, diganti `@typescript-eslint/default-param-last` | versi dasar menandai `(a = {}, b?: T)` padahal parameter opsional TS sah di posisi akhir |
| `react/no-unstable-nested-components` (21) | `['error', { allowAsProps: true }]` | `search`/`filter` pada `<Table>` adalah render prop — dipanggil sebagai fungsi (`{search && search({…})}`), bukan dirender sebagai JSX, jadi tidak ada remount. Dua kasus yang benar-benar remount (§1.4, §1.5) tetap diperbaiki di kodenya, bukan dibungkam |

Lain-lain: `.prettierignore` diperluas (`node_modules`, `.next`, `out`, `build`, `coverage`, `public`, …),
script `format` mencakup `js/jsx/json`, ditambah `format:check`.

---

## 5. Perubahan perilaku yang perlu dikonfirmasi

**`SelectItems` tidak lagi memfilter `where_greater_equal: { quantity: 1 }`** (`src/components/Form.tsx`).

Select ini hanya dipakai di halaman **Barang Masuk**. Dengan filter lama, barang yang stoknya habis
tidak muncul di dropdown — padahal justru barang itulah yang paling perlu dipilih untuk direstock,
dan operator terpaksa membuat barang duplikat. `SelectItemsDetail` (dipakai untuk penjualan) **tetap** memfilter,
karena di sana barang kosong memang tidak boleh dijual.

Kalau ternyata perilaku lama disengaja, cukup kembalikan argumen `useFetchItems({ where_greater_equal: { quantity: 1 } })`.

---

## 6. Yang belum dikerjakan

- **33 warning `no-explicit-any` tersisa**, hampir semuanya `UseMutationResult<BackendRes<any>, …>` di
  `hooks/mutation/*` dan prop `onSave?: (data: any) => void` di komponen form. Mengetiknya butuh bentuk
  respons backend yang belum terdokumentasi (lihat `QUESTIONS.md`) — menebaknya justru berbahaya.
- **`src/utils/server.ts`** adalah mock miragejs yang **tidak diimpor dari mana pun**. Dibiarkan (hanya
  diberi `eslint-disable no-console`) karena penghapusan kode mati yang sudah ada sebelumnya di luar cakupan.
  Aman dihapus kalau memang tidak dipakai lagi.
- **Belum ada satu pun test** di repo ini. Semua perbaikan di atas diverifikasi lewat `tsc --noEmit`,
  `eslint`, dan `yarn build` — bukan lewat test. Perbaikan di §1.1–1.8 menyentuh alur transaksi dan
  akuntansi, jadi uji manual sebelum deploy.
- **Belum ada CI.** `yarn lint` dan `yarn type:check` masih harus dijalankan manual sebelum push.

## Cara verifikasi

```bash
cd inventory-management-fe
yarn lint          # 0 error, 33 warning
yarn type:check    # bersih
yarn build         # lolos
```
