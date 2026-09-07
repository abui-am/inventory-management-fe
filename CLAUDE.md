# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`inventory-management-fe` — a Next.js **Pages Router** frontend for an Indonesian inventory/accounting ERP (transactions, stock-in, ledgers, debts, prives, salary, expenses, capital-change and income reports). UI copy and toasts are in Indonesian; `dayjs` is locale-set to `id`.

Stack: **Next.js 12, React 17, TypeScript 5, @tanstack/react-query v4, Tailwind CSS 2, Formik + Yup 1, axios 1**.

> Next.js 12 and React 17 are intentionally kept: `@tanstack/react-query` v5 and ESLint 9 both drop support for React 17 / the airbnb+next-12 lint toolchain, so v4 and ESLint 8 are the correct ceilings until a React 18/Next 15 migration is done.

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

### Auth (cookie-based, gated in `_app.tsx`)
Auth state lives in three cookies: `INVT-TOKEN`, `INVT-USERID`, `INVT-USERNAME`, set on login in `hooks/mutation/useAuth.ts`. The route guard is `MyApp.getInitialProps` in `src/pages/_app.tsx`: it redirects to `/login` when cookies are missing (except whitelisted pages `/login`, `/forget-password`, `/_error`), and away from `/login` when already authenticated. `useFetchMyself()` (`POST /auth/self`) logs out on a 401.

### Data fetching (@tanstack/react-query v4)
- **Query hooks** in `src/hooks/query/useFetch*.ts`, **mutation hooks** in `src/hooks/mutation/useMutate*.ts` — one file per domain.
- All query keys are centralized in `src/hooks/keys.ts`; use these constants, don't inline string keys.
- **Query keys must be arrays** (v4 rule): `useMyQuery([keys.x, ...], fn)` and `invalidateQueries([keys.x])`. Never pass a bare string key.
- `useMyQuery` (`hooks/query/useMyQuery.ts`) is a thin typed wrapper over `useQuery` — use it for reads.
- Convention: mutations show a `react-hot-toast` `toast.success(message)` / `toast.error(...)` in `onSuccess`/`onError` and call `queryClient.invalidateQueries([keys.x])`.
- v4 still supports the positional `useQuery(key, fn, options)` overload and `onSuccess`/`onError`/`cacheTime` on queries — these are used throughout and were kept as-is (they are removed in v5, which would require the React 18 migration).
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

### Other conventions
- **Path alias**: `@/*` → `src/*` (tsconfig + eslint resolver).
- **Tables**: both `@tanstack/react-table` v8 and legacy `react-table` v7 are present; table-building hooks live in `src/hooks/table/`, reusable table components in `src/components/table/`.
- **Forms**: Formik + Yup; forms in `src/components/form/`, validators in `src/utils/validation/`.
- **Imports**: `simple-import-sort` is an ESLint error — keep imports sorted.
- **MirageJS**: `src/utils/server.ts` has mock servers (`makeServerEmployee`, `makeServerAuth`) but they are not auto-wired into the app.
- Deployment is Vercel; `vercel.sh` conditionally allows builds based on `BRANCH_TO_BUILD`.

## Required env vars
`NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_SUPERADMIN_URL`, `NEXT_PUBLIC_ADMIN_URL`, `NEXT_PUBLIC_WAREHOUSE_URL`, `NEXT_PUBLIC_GENERAL_URL`.
