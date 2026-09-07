# Inventory Management FE

Frontend web dashboard for an inventory & accounting ERP (POS-style retail/warehouse operations). Built with **Next.js (Pages Router)** and TypeScript. The UI is in **Bahasa Indonesia**.

It is the web client for a multi-service backend: authentication, transactions, stock, employees/payroll, and the general-ledger accounting modules are each served by separate APIs (see [Environment variables](#environment-variables)).

---

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 12 (Pages Router), React 17 |
| Language | TypeScript 5 |
| Data fetching | @tanstack/react-query v4 (over axios 1) |
| Forms & validation | Formik + Yup 1 |
| Styling | Tailwind CSS 2 |
| Tables | @tanstack/react-table v8 (+ legacy react-table v7) |
| Charts | Recharts |
| Notifications | react-hot-toast |
| Dates | Day.js (locale `id`) |
| Lint / format | ESLint 8 (Airbnb) + Prettier |

> **Version ceilings are intentional.** React 17 / Next 12 are kept for now because `@tanstack/react-query` v5 and ESLint 9 drop support for them. Moving to React 18 / Next 15 is a separate, larger migration.

## Features / modules

Navigation is defined in `src/constants/menu.tsx` and gated per role (see [Permissions](#permissions--roles)).

| Module (UI label) | Route | Purpose |
|---|---|---|
| Beranda | `/` | Dashboard home |
| Karyawan | `/employee` | Employee management |
| Transaksi | `/transaction` | Sales transactions (POS) |
| Barang Masuk | `/stock-in` | Stock-in / goods receipt |
| Konfirmasi Barang Masuk | `/stock-in-confirmation` | Warehouse confirmation of stock-in |
| Penyesuaian Harga Jual | `/sell-price-adjustment` | Sell-price adjustments |
| Barang | `/items` | Item / product catalog |
| Supplier | `/supplier` | Suppliers |
| Customer | `/customer` | Customers |
| Audit Barang | `/inventory/audit` | Inventory audit / stock opname |
| Laporan Audit | `/audit/report` | Audit report |
| Gaji Karyawan | `/monthly-salary` | Monthly payroll |
| Gaji dibayar di Muka | `/pre-paid-salary` | Advance-paid salary |
| Prive | `/prive` | Owner withdrawals (prive) |
| Utang | `/debt` | Payables |
| Utang Giro | `/debt-giro` | Giro/cheque payables |
| Piutang | `/account-receivable` | Receivables |
| Jurnal Umum | `/general-ledger` | General journal |
| Buku Besar | `/ledger` | Ledger accounts |
| Konversi Saldo | `/convert-balance` | Balance conversion |
| Beban | `/expense` | Expenses |
| Laporan Pendapatan | `/income-report` | Income report |
| Laporan Pendapatan Per Kasir | `/income-user-report` | Income report per cashier |
| Laporan Perubahan Modal | `/laporan-perubahan-modal` | Capital-change report |

---

## Getting started

### Prerequisites

- **Node.js 18+** and **npm** (this project standardizes on npm — do not use yarn/pnpm)
- Access to the backend service URLs (below)

### Install

```bash
npm install
```

> `postinstall` runs `npx typesync`, which may add/adjust `@types/*` entries in `package.json`.

### Configure environment

Create a `.env.local` in the project root:

```bash
# Core / auth API (token is sent as the ?key= query param)
NEXT_PUBLIC_BASE_URL=https://api.example.com

# Role-scoped service URLs (token sent as Authorization: Bearer <INVT-TOKEN>)
NEXT_PUBLIC_SUPERADMIN_URL=https://superadmin.example.com
NEXT_PUBLIC_ADMIN_URL=https://admin.example.com
NEXT_PUBLIC_WAREHOUSE_URL=https://warehouse.example.com
NEXT_PUBLIC_GENERAL_URL=https://general.example.com
```

All are `NEXT_PUBLIC_*` (exposed to the browser). See [Environment variables](#environment-variables) for what each one serves.

### Run

```bash
npm run dev      # http://localhost:3000
```

---

## Available scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the dev server (http://localhost:3000) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint over `src` |
| `npm run lint:fix` | ESLint with autofix |
| `npm run type:check` | `tsc --noEmit` type check |
| `npm run format` | Prettier write over `src` |

> ⚠️ **`next build` does not fail on type or lint errors** — `next.config.js` sets `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` to `true`. Run `type:check` and `lint` explicitly in CI / before merging. There are a few known pre-existing type-check errors (react-select `Option` typing) that the build ignores.

There are currently **no automated tests** in this repository.

---

## Environment variables

The app talks to **five** backends through separate axios instances (`src/utils/api.ts`), chosen by the signed-in user's role:

| Variable | Used by | Auth style |
|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | `apiInstance()` — auth/login and default calls | token as `?key=` query param |
| `NEXT_PUBLIC_SUPERADMIN_URL` | `apiInstanceAdmin()` — superadmin operations | `Authorization: Bearer` |
| `NEXT_PUBLIC_ADMIN_URL` | `apiInstanceBasicAdmin()` — admin operations | `Authorization: Bearer` |
| `NEXT_PUBLIC_WAREHOUSE_URL` | `apiInstanceWarehouseAdmin()` — warehouse-admin operations | `Authorization: Bearer` |
| `NEXT_PUBLIC_GENERAL_URL` | `apiInstanceGeneral()` — shared endpoints (e.g. `/auth/self`) | `Authorization: Bearer` |

`getApiBasedOnRoles(roles, hierarchy)` picks the instance for the highest-priority role a user holds (e.g. `['superadmin', 'admin']`).

---

## Architecture overview

> A deeper, engineer-focused breakdown lives in [`CLAUDE.md`](./CLAUDE.md).

### Authentication

- Login (`POST /auth/login`) stores three cookies: **`INVT-TOKEN`**, **`INVT-USERID`**, **`INVT-USERNAME`** (`hooks/mutation/useAuth.ts`).
- The route guard is in `MyApp.getInitialProps` (`src/pages/_app.tsx`): unauthenticated users are redirected to `/login` (except whitelisted pages), and authenticated users are bounced away from `/login`.
- `useFetchMyself()` (`POST /auth/self`) loads the current user and **logs out on a 401**.

### Data fetching

- One hook file per domain: reads in `src/hooks/query/useFetch*.ts`, writes in `src/hooks/mutation/useMutate*.ts`.
- Query keys are centralized in `src/hooks/keys.ts` — **always arrays**, e.g. `invalidateQueries([keys.items])`.
- `useMyQuery` (`src/hooks/query/useMyQuery.ts`) is the typed `useQuery` wrapper used for reads.
- Mutations conventionally toast `message` on success/error and invalidate the affected query keys.
- All API responses follow one envelope (`src/typings/request.ts`):
  ```ts
  BackendRes<T>      = { status_code: number; message: string; data: T }
  BackendResError<T> = { status_code: number; message: string; errors: T }
  ```

### Permissions & roles

`usePermission()` (`src/context/permission-context.tsx`) derives a permission list from the user's roles via a hard-coded mapping (`superadmin` → all; `admin` → subset; others → minimal). Menu items and pages are gated on these `PermissionList` strings — there is no server-driven permission list.

### Project structure

```
src/
├── pages/          # Next.js routes (one folder per module)
├── components/     # UI: form/, table/, menu/, transaction/
├── layouts/        # Layout.tsx + DashboardLayout.tsx (chrome, route loader)
├── hooks/
│   ├── query/      # useFetch* (react-query reads)
│   ├── mutation/   # useMutate* (react-query writes)
│   ├── table/      # react-table column/config hooks
│   └── keys.ts     # centralized query keys
├── context/        # app / home / permission React contexts
├── typings/        # per-domain TypeScript types + request.ts envelope
├── utils/          # api.ts (axios instances), cookies, formatting, validation/
├── constants/      # menu.tsx (nav), options.tsx
└── styles/
```

Path alias: **`@/*` → `src/*`**.

---

## Deployment

Deployed on **Vercel**. `vercel.sh` gates builds to a specific branch via the `BRANCH_TO_BUILD` env var (compared against `VERCEL_GIT_COMMIT_REF`). Ensure all `NEXT_PUBLIC_*` variables are set in the Vercel project settings.

---

## Conventions

- **Package manager:** npm only (`package-lock.json`). Do not commit a `yarn.lock`.
- **Commits:** `<type>(<scope>): <subject>` (e.g. `feat`, `fix`, `chore`, `refactor`).
- **Imports** are sorted (`simple-import-sort` — enforced as an ESLint error).
- **Prettier:** `printWidth: 120`, single quotes, `trailingComma: es5`.
- Prefer optional chaining (`?.`) and nullish coalescing (`??`).
