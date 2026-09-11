# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`inventory-management-fe` — a Next.js **Pages Router** frontend for an Indonesian inventory/accounting ERP (transactions, stock-in, ledgers, debts, prives, salary, expenses, capital-change and income reports). UI copy and toasts are in Indonesian; `dayjs` is locale-set to `id`.

Stack: **Next.js 12, React 18, TypeScript 5, @tanstack/react-query v4, Tailwind CSS 3.4, Formik + Yup 1, axios 1**.

> React was upgraded 17 → 18.3.1 (react-select came along, 4 → 5) so Tremor and cmdk could be used. Next.js 12 stays: `@tanstack/react-query` v5 and ESLint 9 drop the airbnb+next-12 lint toolchain, so v4 and ESLint 8 remain the ceilings until a Next 15 migration.
>
> React 18 discards the whole SSR tree on a hydration mismatch instead of patching it, so anything time- or client-dependent must not render during SSR — see `src/hooks/useMounted.ts`.
>
> **Never call `Intl.NumberFormat`/`DateTimeFormat` without pinning every option that has a locale-data default.** Node and Chrome ship different CLDR versions, so the defaults disagree: unpinned, IDR renders `Rp 0,00` on the server and `Rp 0` in the browser. That one difference was enough to throw away the SSR output of every page showing currency. `formatToIDR` pins its fraction digits — don't remove them.
>
> Anything that measures the DOM (recharts/Tremor charts) must be loaded with `next/dynamic` + `ssr: false`; see `pages/index.tsx` and `pages/styleguide.tsx`.

## Commands

```bash
npm run dev          # dev server on http://localhost:3000
npm run build        # next build
npm run start        # next start (after build)
npm run lint         # eslint src --ext .ts,.tsx
npm run lint:fix     # eslint --fix
npm run type:check   # tsc --noEmit
npm run format       # prettier --write src
```

**Package manager is npm** (`package-lock.json`). Do not add `yarn.lock` back. `postinstall` runs `npx typesync` to keep `@types/*` in sync — this rewrites `package.json` on install, so expect small `@types/*` diffs.

There is **no test setup** (no Jest config, no test files) despite ESLint's `jest` env — do not assume tests exist.

**No pre-commit enforcement**: `husky` and `lint-staged` are in `devDependencies` but are **not configured** — there is no `.husky/` directory, no `lint-staged` config, and no `core.hookspath`. Nothing runs lint/format on commit, so run the checks manually before committing. Prettier config (`.prettierrc.js`): `printWidth: 120`, `singleQuote: true`, `trailingComma: 'es5'`.

**Pre-existing type errors**: `tsc --noEmit` reports a handful of pre-existing errors (react-select `Option` value typing in customer/supplier pages, a couple of `??`/generic issues) unrelated to the current code — the build ignores them. When touching those files, don't be surprised; fix only what you own.

## Critical build caveat

`next.config.js` sets `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true`. **`next build` will NOT fail on type or lint errors** — always run `tsc --noEmit` and `eslint` manually to catch them.

## Architecture

### Multi-backend, role-aware API layer (`src/utils/api.ts`)
This is the most non-obvious part. There are **five separate axios instances**, each pointing at a different backend base URL via env var, selected by the user's role:

- `apiInstance()` → `NEXT_PUBLIC_BASE_URL` (token passed as `?key=` query param)
- `apiInstanceAdmin()` → `NEXT_PUBLIC_SUPERADMIN_URL`
- `apiInstanceBasicAdmin()` → `NEXT_PUBLIC_ADMIN_URL`
- `apiInstanceWarehouseAdmin()` → `NEXT_PUBLIC_WAREHOUSE_URL`
- `apiInstanceGeneral()` → `NEXT_PUBLIC_GENERAL_URL`
- `apiInstanceWithoutBaseUrl()` → no base URL (used with a `forceUrl` from the backend)

`getApiBasedOnRoles(roles, hierarchy)` walks a role hierarchy (e.g. `['superadmin', 'admin']`) and returns the instance for the highest-priority role the user holds. Fetch hooks typically read the current user's roles from `useFetchMyself()` and pass them in. All instances except `apiInstance()` send `Authorization: Bearer <INVT-TOKEN cookie>`.

### Auth (cookie-based, gated in `middleware.ts`)
Auth state lives in three cookies: `INVT-TOKEN`, `INVT-USERID`, `INVT-USERNAME`, set on login in `hooks/mutation/useAuth.ts`. The route guard is **`src/middleware.ts`**, not `_app`: it redirects to `/login` when the token cookie is missing (public paths: `/login`, `/forget-password`, `/_error`, `/styleguide`) and away from `/login` when already authenticated. It used to be `MyApp.getInitialProps`, which opted every page out of static optimization — don't move it back. `useFetchMyself()` (`POST /auth/self`) logs out on a 401.

### Data fetching (@tanstack/react-query v4)
- **Query hooks** in `src/hooks/query/useFetch*.ts`, **mutation hooks** in `src/hooks/mutation/useMutate*.ts` — one file per domain.
- All query keys are centralized in `src/hooks/keys.ts`; use these constants, don't inline string keys.
- **Query keys must be arrays** (v4 rule): `useMyQuery([keys.x, ...], fn)` and `invalidateQueries([keys.x])`. Never pass a bare string key.
- `useMyQuery` (`hooks/query/useMyQuery.ts`) is a thin typed wrapper over `useQuery` — use it for reads.
- Convention: mutations show a `react-hot-toast` `toast.success(message)` / `toast.error(...)` in `onSuccess`/`onError` and call `queryClient.invalidateQueries([keys.x])`.
- v4 still supports the positional `useQuery(key, fn, options)` overload and `onSuccess`/`onError`/`cacheTime` on queries — these are used throughout and were kept as-is (all removed in v5).
- **`enabled: false` does not mean "idle"**: such a query stays in status `'loading'` forever because it never gets data, so `isLoading` is permanently `true`. For a query you only ever trigger via `refetch()`, gate the UI on **`isFetching`**. Three buttons were silently disabled forever because of this.
- The `QueryClient` (5-min stale/cache time, `refetchOnWindowFocus: false`) is created in `_app.tsx`.

### Backend response envelope
Every response follows `typings/request.ts`:
```ts
BackendRes<T>      = { status_code: number; message: string; data: T }
BackendResError<T> = { status_code: number; message: string; errors: T }
```
Domain types live in `src/typings/<domain>.ts` (one file per domain).

### Permissions (`src/context/permission-context.tsx`)
`usePermission()` returns `{ permission: PermissionList[]; roles }`. `PermissionList` is a fixed string union (`'control:transaction'`, `'view:audit'`, …). Permissions are **derived from roles** in `getPermission()` via a hard-coded `switch` on role name (`superadmin` gets everything; `admin` a subset; default a small set) — there is no server-driven permission list. Gate UI/menu items on these strings.

### Layout & navigation
`_app.tsx` wraps pages in `PermissionProvider` → `AppProvider` → `Layout`. `layouts/Layout.tsx` handles the route-change loader and page title, delegating chrome to `DashboardLayout.tsx`. The sidebar/menu is driven by `src/constants/menu.tsx` (`MENU_LIST`), matched against the pathname's first segment.

### Design system (Fase 2–3)

- **All colour comes from `src/styles/tokens.css`** — HSL triplets on `:root` and `.dark`,
  mapped to Tailwind names in `tailwind.config.js`. Use `bg-surface`, `text-foreground-muted`,
  `border-border-strong`; never `bg-blue-600` or `text-gray-500` in new code.
- **There are no `dark:` classes anywhere, by design.** Theme switching only swaps variable
  values. Adding a `dark:` class breaks that contract.
- Everything in `tailwind.config.js` lives under **`theme.extend`**. Writing at `theme` level
  deletes Tailwind's default scales, which the not-yet-migrated pages still rely on
  (`text-2xl`, `h-11`, and the legacy `blueGray` palette).
- New primitives go in `src/components/ui/` and use `cn()` from `src/lib/cn.ts`. The old
  components in `src/components/` are thin adapters over them so call sites need not change;
  see `FASE-3-KOMPONEN.md`.
- Pages opt into theming with `Page.themeable = true`. Everything else is forced to light in
  `_app.tsx`, because unmigrated pages use literal colours that don't follow the theme.
- `/styleguide` is the live reference. `npm run check:contrast` verifies token pairs against
  WCAG AA in both themes.

### Wording UI — aturan tetap, jangan ditawar ulang

Ditetapkan oleh maintainer. Berlaku untuk semua teks yang dilihat pengguna: label,
tombol, placeholder, `aria-label`, judul seksi, empty state, pesan error, toast.

**1. Istilah yang sudah lazim berbahasa Inggris TETAP Inggris.** Jangan diterjemahkan.

> Print, Download, Upload, Export, Import, Filter, Reset, Preview, Copy, Search,
> Pagination, Previous, Next, Invoice, Customer, Supplier, Status, Total, Subtotal,
> Balance, Light, Dark, System.

Jangan menambah keterangan format yang sudah jelas dari konteksnya: tombolnya cukup
`Print`, bukan `Print struk`.

**2. Kosakata buku besar tetap Indonesia; hanya kata pembanding yang Inggris.**
Batasnya: kalau kata itu MUNCUL DI BUKU BESAR — sebagai nama akun maupun sebagai
nama kolomnya — ia milik klien dan tetap Indonesia. Yang Inggris hanya kata yang
dipakai untuk MENILAI angkanya, bukan untuk mencatatnya.

> Inggris: Balance, Total, Subtotal
> Indonesia: Debit, Kredit, Kas, Bank, Utang, Piutang, Giro, Persediaan, Penjualan,
> Beban, Jurnal Umum, Buku Besar, Prive, Barang Masuk, Harga Jual, Perubahan Modal

"Kredit" pernah diubah jadi "Credit" lalu dikembalikan oleh maintainer. Debit dan
Kredit adalah judul kolom di buku besar klien, sederajat dengan nama akunnya —
sedangkan Balance adalah keterangan bahwa debit dan kredit sudah sama besar.

**3. Kata kerja Indonesia sehari-hari tetap Indonesia.** cari, lihat, tutup, simpan,
batal, tambah, ubah, hapus.

**4. LABEL dan TITLE memakai Kapital di awal saja — bukan HURUF BESAR SEMUA.**
`Total`, `Ongkos kirim`, `Nomor faktur`, `Waktu`, `Kode`. Tanpa pengecualian: berlaku
untuk judul kartu, judul seksi, label field, DAN header kolom tabel. `text-transform:
uppercase` tidak dipakai untuk teks antarmuka.

**5. Komentar kode tetap bahasa Indonesia.** Itu untuk yang merawat, bukan antarmuka.

**6. Penghitung SELALU seragam, di mana pun.** Jumlah baris tabel, jumlah item satu
seksi, jumlah transaksi per tab — semuanya memakai `<Counter>` dari
`components/ui/counter`, bukan kelas yang disalin. Bentuknya: angka telanjang, tanpa
kata satuan (`3`, bukan `3 baris`), tanpa pemisah titik tengah (`Barang 3`, bukan
`Barang · 3`), tanpa lencana berlatar. Kalau muncul penghitung baru di halaman baru,
pakai komponen itu — jangan bikin gaya sendiri.

**7. SATU tinggi kontrol per halaman: 32px.** Semua input, select, datepicker, dan
tombol di halaman yang sudah dipindahkan memakai tinggi yang sama — `Input size="sm"`,
`Button size="sm"`, dan `gayaKontrol` dari `utils/style` untuk react-select. Jangan
mengetik `h-7`, `h-[26px]`, atau `minHeight: 24` sendiri: kalau butuh tinggi lain,
ubah `TINGGI_KONTROL`, jangan menambah tinggi keenam. Satu halaman pernah memakai lima
tinggi sekaligus dan tidak ada satu garis pun yang sejajar.

Ikutannya:
- **Placeholder** ikut aturan wording dan ukurannya dinyatakan tegas (13px), bukan
  diwariskan. `Select...` bawaan react-select selalu diganti — mis. `Pilih customer`.
- **Fokus hanya SATU penanda.** react-select memasang ring-nya sendiri di control, jadi
  input di dalamnya dikecualikan dari `:focus-visible` global; tanpa itu ada dua
  lingkaran menempel yang terbaca sebagai garis dobel tebal.
- **Menu dropdown beranimasi** buka DAN tutup, lewat `useMenuAnimasi` + `buatMenu` di
  `components/Form`. Ringan saja — hanya opacity dan transform, di bawah 120ms.

**8. Empty state harus sesuai konteks.** Bedakan "data memang belum ada" dari "filter
tidak menemukan apa-apa". Jangan menyuruh mengubah filter kepada orang yang tidak
sedang memakai filter.

### Other conventions
- **Path alias**: `@/*` → `src/*` (tsconfig + eslint resolver).
- **Tables**: both `@tanstack/react-table` v8 and legacy `react-table` v7 are present; table-building hooks live in `src/hooks/table/`, reusable table components in `src/components/table/`.
- **Forms**: Formik + Yup; forms in `src/components/form/`, validators in `src/utils/validation/`.
- **Imports**: `simple-import-sort` is an ESLint error — keep imports sorted.
- **MirageJS**: `src/utils/server.ts` has mock servers (`makeServerEmployee`, `makeServerAuth`) but they are not auto-wired into the app.
- Deployment is Vercel; `vercel.sh` conditionally allows builds based on `BRANCH_TO_BUILD`.

## Required env vars
`NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_SUPERADMIN_URL`, `NEXT_PUBLIC_ADMIN_URL`, `NEXT_PUBLIC_WAREHOUSE_URL`, `NEXT_PUBLIC_GENERAL_URL`.
