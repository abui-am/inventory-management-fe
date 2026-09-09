# Fase 3 — Komponen shadcn/ui

Satu batch = satu jenis komponen. Tiap batch tampil dulu di `/styleguide`, baru
dipakai halaman. Urutan: **Tombol → kontrol form → feedback → overlay → data display**.

Aturan yang dipakai di semua batch:

- Primitive baru hidup di `src/components/ui/`, memakai token (`bg-accent`,
  `text-foreground`), **tanpa satu pun kelas `dark:`**.
- Komponen lama di `src/components/` tidak dihapus; ia jadi **adapter tipis** ke
  primitive baru supaya call site tidak perlu ikut berubah di batch yang sama.
  Call site dipindahkan ke `@/components/ui/*` saat halamannya digarap di Fase 4.

---

## Batch 1 — Tombol

### Berkas

| Berkas | Status |
|---|---|
| `src/components/ui/button.tsx` | baru — primitive |
| `src/components/Button.tsx` | jadi adapter; `RoundedButton` ikut dipetakan |
| `src/pages/styleguide.tsx` | section `#tombol` + pratinjau memakai komponen asli |

### Sebelum → sesudah

| | Sebelum | Sesudah |
|---|---|---|
| Warna | literal Tailwind (`bg-blue-600`, `bg-red-500`, `bg-blueGray-200`) | token (`bg-accent`, `bg-destructive`, `bg-surface-raised`) |
| Mode gelap | tidak ikut | ikut, tanpa kelas `dark:` |
| Varian | 5 (`primary` `secondary` `gray` `outlined` `danger`) | 6 (`default` `secondary` `outline` `ghost` `destructive` `destructive-outline`) |
| Ukuran | 2 — 36px / 44px | 5 — `sm` 32, `default` 36, `lg` 40, `icon` 36², `icon-sm` 32² |
| Ikon | `position:absolute` + `pl-10` di sisi tombol | `inline-flex` + `gap-1.5`, ukuran ikon diatur varian |
| `loading` | **prop mati** — dideklarasikan, tidak pernah dirender | spinner + `disabled` + `aria-busy` |
| Fokus keyboard | outline bawaan browser | `ring-2 ring-ring` dengan offset ke `background` |
| `type` | `"button"` hardcoded | default `"button"`, bisa ditimpa jadi `"submit"` |

Pemetaan varian lama → baru: `primary→default`, `secondary→ghost`, `gray→secondary`,
`outlined→outline`, `danger→destructive`. 25 pemanggil tidak diubah.

Tinggi tombol turun dari 36/44px ke 32/36/40px mengikuti arah *compact* — Linear
memakai 32px. Ini perubahan visual yang disengaja, bukan regresi.

### Bug yang ketahuan karena `loading` jadi hidup

`loading` selama ini prop mati, jadi tidak ada yang sadar nilainya salah.

**Tombol unduh faktur disabled permanen — tidak pernah bisa diklik.**

```tsx
const { refetch, isLoading } = useFetchInvoice(id, { enabled: false });
<Button disabled={isLoading} loading={isLoading} …>
```

Di react-query v4 query dengan `enabled: false` berstatus `'loading'` selamanya
karena belum pernah punya data — `isLoading` tidak pernah `false`. Tombolnya cuma
tampak agak pucat (`disabled:bg-blue-400`), jadi lolos. Begitu spinner dirender,
langsung kelihatan.

Perbaikan: pakai `isFetching` (semantik yang benar untuk refetch manual) dan buang
`disabled` yang jadi mubazir. Tiga tempat, akar yang sama:

- `src/pages/transaction/index.tsx:248`
- `src/components/table/TableComponent.tsx:322`
- `src/pages/transaction/add.tsx:493`

### Verifikasi

- `npx tsc --noEmit` bersih; `npx eslint` nol error pada berkas yang disentuh
  (sisa 1 warning `no-explicit-any` yang sudah ada sebelumnya).
- `next build` sukses; `/styleguide` dan `/transaction` dicek di terang dan gelap.
- Tombol aksi di `/transaction` sekarang aktif — sebelumnya pucat dan mati.
- Lebar 390px: section tombol tidak overflow, tidak ada tombol keluar viewport.

---

## Batch 2 — Kontrol form

### Berkas

| Berkas | Status |
|---|---|
| `src/components/ui/input.tsx` | baru — primitive, ekspor `inputClass` untuk dipakai ulang |
| `src/components/ui/textarea.tsx` | baru — memakai `inputClass` |
| `src/components/ui/checkbox.tsx` | baru |
| `src/components/ui/label.tsx` | baru |
| `src/components/TextField.tsx` | semuanya jadi adapter |
| `src/components/Label.tsx` | adapter |
| `tailwind.config.js` | tambah varian `aria-invalid` |
| `src/pages/styleguide.tsx` | section `#form` |

Call site yang ikut berubah tanpa diedit: `TextField` 43×, `WithLabelAndError` 42×,
`TextArea` 4×, `PhoneNumberTextField` 3×.

### Sebelum → sesudah

| | Sebelum | Sesudah |
|---|---|---|
| Warna | `border-gray-300`, `focus:ring-blue-600`, `text-red-500`, `bg-blueGray-100` | token |
| Mode gelap | tidak ikut | ikut |
| Tinggi | 44px | 36px, sejajar Button `default` |
| State error | prop `hasError` menyetel kelas ring sendiri | dibaca dari `aria-invalid` |
| Fokus | `ring-2 ring-blue-600 ring-inset` | `border-accent` + `ring-2 ring-ring/25` |
| Disabled | tidak ada gaya | latar `surface-raised`, teks `foreground-subtle`, kursor |
| Textarea | `resize-none` | `resize-y` |

### Bug yang ditemukan

**1. `Checkbox` punya dua sumber kebenaran.** Ia menyimpan `checked` di state internal
lewat `onClick`, padahal pemanggil juga mengirim `checked`:

```tsx
const [checked, setChecked] = useState(false);
<input onClick={() => setChecked(v => !v)} … {...props} />
```

State internal itu cuma dipakai untuk menyalakan `appearance-none`. Dua masalah:
`{...props}` disebar **setelah** `onClick`, jadi `onClick` dari pemanggil membuang
toggle internal; dan kalau nilainya diubah dari luar (reset form, `setFieldValue`),
state internal tidak ikut, jadi kotaknya bisa menampilkan kebalikan dari nilai
sebenarnya. Terjadi di `PaymentMethod.tsx` yang mengirim `checked={values.payFull}`.
Primitive baru tidak punya state sama sekali.

**2. Tiga label checkbox tidak terhubung ke input-nya.** `<label className="text-base ml-1">Seluruhnya</label>`
tanpa `htmlFor` — mengklik teksnya tidak mencentang apa pun, target sentuh cuma 16px.
Teks dipindah jadi children `Checkbox` di `PaymentMethod.tsx`, `PaySalary.tsx`, `PayDebt.tsx`.

**3. `aria-invalid:` bukan varian bawaan Tailwind.** Varian `aria-*` bawaan hanya
`busy checked disabled expanded hidden pressed readonly required selected` — tidak ada
`invalid`. Kelas `aria-invalid:border-destructive` diam-diam tidak pernah jadi CSS: tidak
ada error, border error cuma tidak pernah muncul. Ketahuan waktu memeriksa
`getComputedStyle` di browser, bukan dari screenshot. Diperbaiki dengan `theme.extend.aria`
di `tailwind.config.js`.

**4. Checkbox disabled+checked tidak kelihatan centangnya.** `disabled:bg-surface-raised`
menimpa `checked:bg-accent`, jadi tanda centang putih berdiri di atas latar terang.
Diganti `disabled:opacity-50` supaya isian accent tetap dan kontras centang terjaga.

### Verifikasi

- `tsc --noEmit` bersih; `eslint` nol error pada berkas yang disentuh.
- `next build` sukses; CSS `aria-invalid\:border-destructive[aria-invalid=true]` terbukti
  ada di bundle.
- `/styleguide#form` dicek terang dan gelap; `border-color` state error dan `opacity`
  checkbox disabled dibaca lewat `getComputedStyle`, bukan dinilai dari screenshot —
  screenshot pertama sempat menampilkan build lama karena cache browser.
- `/supplier/add` dicek: tinggi field seragam, prefix `+62` sejajar, focus ring tampil.

---

## Ketidakcocokan hidrasi (isu "a") — selesai

Ditemukan saat memverifikasi batch 2, bukan dicari. Dua penyebab, keduanya berdiri
sendiri; empat perbaikan sebelumnya (devtools ikut SSR, tanggal beku, id `react-collapsed`,
Menu dinamis) memang perlu tapi tidak menyentuh keduanya.

Dugaan lama saya — "sisa error ada di halaman ber-`DashboardLayout`" — **salah**.
`/styleguide` tidak memakai layout itu dan tetap error, dan itulah yang membuka jalan.

### Penyebab 1 — `Intl.NumberFormat` tanpa opsi desimal yang dikunci

`formatToIDR` memanggil `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })`
tanpa menentukan jumlah desimal, jadi nilainya diambil dari data CLDR runtime:

| | `formatToIDR(0)` | `formatToIDR(17422500)` |
|---|---|---|
| Node 20 — ICU 77, CLDR 47 | `Rp 0,00` | `Rp 17.422.500,00` |
| Chrome 152 | `Rp 0` | `Rp 17.422.500` |

Setiap halaman yang menampilkan rupiah merender teks berbeda di server dan klien.
React 18 membalas ketidakcocokan teks dengan **membuang seluruh pohon SSR** lalu
me-render ulang dari nol — halaman tetap tampil, jadi tak seorang pun sadar, tapi hasil
server terbuang dan halaman lebih lambat jadi interaktif. 29 berkas memakai fungsi ini.

Perbaikan: kunci `minimumFractionDigits: 0` dan `maximumFractionDigits: 0` di
`src/utils/format.ts`. Nol desimal memang yang benar untuk rupiah dan sudah dipakai di
seluruh UI — `Rp 0,00` dari server justru yang menyimpang.

### Penyebab 2 — chart Tremor ikut SSR di `/styleguide`

`AreaChart` memakai recharts, yang mengukur DOM untuk menempatkan sumbu: di server ia
merender tanpa label sumbu, di klien dengan label. Selisih 14 node teks. `pages/index.tsx`
sudah memuat chart-nya lewat `next/dynamic` + `ssr: false`; `/styleguide` — buatan saya
sendiri di Fase 2 — mengimpornya statis. Diperbaiki dengan cara yang sama.

### Cara menemukannya

Diff teks antara HTML yang dirender server dan DOM klien, dijalankan di dalam halaman:
ambil `fetch()` HTML mentahnya, urai dengan `DOMParser`, jalankan `TreeWalker` di kedua
pohon, bandingkan indeks per indeks. Divergensi pertama langsung menunjuk node-nya.
Stack trace React yang diminifikasi tidak menunjuk apa-apa, dan `next dev` tidak
mereproduksinya sama sekali karena dev merender per permintaan, bukan menyajikan HTML
yang dibekukan saat build.

### Verifikasi

Konsol bersih (nol #418/#423/#425) di `/`, `/styleguide`, `/transaction`, `/ledger`,
`/debt`, `/monthly-salary` — masing-masing dimuat ulang dengan probe `console.log`
untuk membuktikan buffer konsolnya memang hidup saat dibaca.

---

## Batch 3 — Select & tanggal

`react-select` dan `react-datepicker` memasang gayanya sebagai style inline (emotion) atau
lewat stylesheet vendor sendiri, jadi kelas Tailwind tidak berlaku di dalamnya. Yang dipakai
justru **CSS variable-nya langsung** — `hsl(var(--surface))` — sehingga keduanya ikut berganti
tema tanpa satu baris kode tema pun di komponen.

| Berkas | Status |
|---|---|
| `src/utils/style.ts` | ditulis ulang: control, menu, option, multiValue, indikator, pesan kosong |
| `src/styles/datepicker.css` | baru — pemetaan warna kalender ke token |
| `src/pages/_app.tsx` | impor CSS itu **setelah** CSS vendor |
| `src/components/Form.tsx` | input tanggal memakai `inputClass`; locale `id` |

### Bug yang ditemukan

**1. Override CSS kalah urutan.** Override kalender awalnya saya taruh di `globals.css`, yang
diimpor **sebelum** `react-datepicker/dist/react-datepicker.css` di `_app.tsx`. Spesifisitasnya
sama, jadi stylesheet vendor yang menang: kalender tetap putih di mode gelap dan tanggal
terpilih tetap biru bawaan `#216ba5`. Dipindahkan ke berkasnya sendiri yang diimpor sesudahnya.

**2. Kalender berbahasa Inggris.** `dayjs.locale('id')` di `_app` tidak menyentuh
react-datepicker — ia memakai date-fns. Kalender menampilkan `Su Mo Tu` dan pekan dimulai
Minggu, di antarmuka yang seluruhnya berbahasa Indonesia. Diperbaiki dengan `registerLocale`.
`date-fns` sudah terpasang sebagai dependensi react-datepicker, tapi kita mengimpornya
langsung — jadi ia dideklarasikan eksplisit di `package.json` (ESLint `import/no-extraneous-dependencies`
benar soal ini: bergantung pada dependensi transitif akan patah kalau react-datepicker menggantinya).

**3. Option terpilih hilang penandanya saat di-hover.** Urutan pemeriksaan `isSelected`
sebelum `isFocused` sengaja: kalau dibalik, satu-satunya penanda pilihan lenyap persis saat
kursor ada di atasnya.

---

## Batch 4 — Feedback

| Berkas | Status |
|---|---|
| `src/components/ui/progress-bar.tsx` | baru |
| `src/components/ui/skeleton.tsx` | baru — memakai keyframe `shimmer` yang sejak Fase 2 belum pernah dipakai |
| `src/components/ui/badge.tsx` | baru |
| `src/layouts/Layout.tsx` | loader rute diganti |
| `src/pages/_app.tsx` | toast memakai token |

**Loader rute lama menutupi seluruh layar dengan bidang putih** dan spinner 80px pada setiap
perpindahan halaman (`.backdrop { background-color: white }`). Konteks yang sedang dibaca
hilang, perpindahan terasa seperti muat ulang penuh, dan di mode gelap bidang putihnya
menyilaukan. Diganti garis 2px di tepi atas: konten tetap terlihat. Ini item **A4** yang dulu
ditahan menunggu persetujuan karena mengubah tampilan.

Progress bar merayap ke 90% lalu menunggu — Next tidak melaporkan progres sebenarnya, jadi
menampilkan angka pasti sama saja berbohong.

Badge selalu memakai latar `*-subtle` dengan teks warna penuh, bukan sebaliknya: satu baris
tabel penuh badge tidak boleh berubah jadi papan warna.

`react-loader-spinner` kini tidak dipakai satu berkas pun — belum dihapus dari `package.json`
karena itu perubahan dependensi, bukan komponen.

---

## Batch 5 — Overlay

| Berkas | Status |
|---|---|
| `src/components/Modal.tsx` | token; `overflow-y-scroll` → `-auto` |
| `src/styles/tokens.css` | token `--scrim` baru |
| `src/styles/globals.css` | scrim + blur, dan `.tippy-box` ke token |

Dua temuan kecil: dialog memakai `overflow-y-scroll`, jadi **setiap** dialog menampilkan
batang gulir walau isinya dua baris; dan scrim `rgba(0,0,0,0.4)` nyaris tak terlihat di atas
ground gelap sehingga batas dialog ikut hilang — karena itu `--scrim` punya nilai berbeda per
tema, bukan satu nilai hitam.

---

## Batch 6 — Data display

| Berkas | Status |
|---|---|
| `src/components/Table.tsx` | header, garis, striping, kerapatan |
| `src/components/Container.tsx` | `Paper` dan `CardDashboard` |

| | Sebelum | Sesudah |
|---|---|---|
| Garis header | `border-blue-600` | `border-border` |
| Sel header | `py-6 px-4` teks biasa | `px-3 py-2`, uppercase 11px, `foreground-subtle` |
| Sel isi | `py-3 px-4` | `px-3 py-2` |
| Striping | `bg-blueGray-100` | `bg-surface-raised` |
| Kartu mobile | `border-gray-300`, `my-6` | `border-border` + `bg-surface`, `my-3` |
| Paper | `bg-white` tanpa garis, `p-6` | `bg-surface` + garis, `p-4` |
| Jarak bawah judul kartu | `mb-10` (40px) | `mb-4` (16px) |

Padding vertikal header 24px membuat satu baris judul setinggi tiga baris data.

---

## Perbaikan susulan — label chart tetap gelap di mode gelap

Terlihat saat dipakai, bukan dari pemeriksaan saya: label sumbu dan garis grid chart tetap
gelap di mode gelap sehingga hampir tak terbaca.

Tremor tidak merangkai gayanya dari token kita — ia memakai **skala warnanya sendiri**:
`fill-tremor-content`, `stroke-tremor-border`, `text-tremor-label`, berpasangan dengan
`dark:fill-dark-tremor-content` dan seterusnya. Skala `tremor` / `dark-tremor` itu tidak
pernah ada di `tailwind.config.js`, jadi kelas-kelas tersebut **tidak menghasilkan satu baris
CSS pun** — tidak ada error, warnanya cuma jatuh ke bawaan browser dan tetap gelap.

Menambahkan `content: ['./node_modules/@tremor/**']` di Fase 2 hanya membuat kelasnya
terpindai; ia tidak membuat nama warnanya ada.

Perbaikan: petakan `tremor` dan `dark-tremor` ke token yang sama. Token kita sudah bertukar
nilai lewat `.dark`, jadi tidak peduli varian mana yang menang — keduanya selalu menghasilkan
warna yang benar untuk tema yang aktif. Skala `fontSize`, `borderRadius`, dan `boxShadow`
milik Tremor ikut dipetakan supaya chart tidak memakai ukuran huruf dan radius sendiri.

Verifikasi: `.fill-tremor-content{fill:hsl(var(--foreground-muted)/1)}` ada di bundle, dan
`getComputedStyle` pada label sumbu memberi `rgb(164,164,178)` di gelap dan `rgb(99,99,116)`
di terang — dua-duanya `--foreground-muted`.

---

## Status Fase 3

Enam batch selesai. Semua primitive ada di `src/components/ui/`, semua komponen lama jadi
adapter, dan tidak ada satu pun kelas `dark:` di seluruh basis kode.

Belum dikerjakan, dan memang bagian dari **Fase 4**: memindahkan halaman satu per satu dari
warna literal Tailwind ke token, lalu membuka `themeable` per halaman. Sampai itu selesai,
`_app.tsx` masih memaksa tema terang di semua halaman kecuali `/styleguide`.
