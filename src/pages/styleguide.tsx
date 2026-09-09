import Tippy from '@tippyjs/react';
import { BarList } from '@tremor/react';
import { AlertTriangle, ArrowDownToLine, Check, ChevronDown, Eye, Plus, Search, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { ReactNode, useState } from 'react';
import toast from 'react-hot-toast';

import { DatePickerComponent, ThemedSelect } from '@/components/Form';
import Modal, { ModalActionWrapper } from '@/components/Modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import CommandPalette from '@/components/ui/command-palette';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ProgressBar from '@/components/ui/progress-bar';
import Skeleton from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import ThemeToggle from '@/components/ui/theme-toggle';
import { cn } from '@/lib/cn';

// AreaChart memakai recharts, yang mengukur DOM untuk menempatkan sumbu — jadi di server
// ia merender tanpa label sumbu, di klien dengan label. Selisih itulah yang membuat React 18
// membuang seluruh pohon SSR halaman ini (error #425/#418/#423). ssr:false menghentikannya.
// pages/index.tsx sudah melakukan hal yang sama untuk chart-nya.
const AreaChart = dynamic(() => import('@tremor/react').then((m) => m.AreaChart), {
  ssr: false,
  loading: () => <div className="h-56" />,
});

/* ── kerangka halaman ─────────────────────────────────────────────────────── */

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section id={id} className="flex flex-col gap-4 scroll-mt-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {note && <p className="max-w-[76ch] text-sm text-foreground-muted">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-lg border border-border bg-surface p-4', className)}>{children}</div>;
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="text-xs font-bold uppercase tracking-[0.09em] text-foreground-subtle">{children}</span>;
}

/* ── warna ────────────────────────────────────────────────────────────────── */

const SURFACES = [
  ['background', 'bg-background', 'Ground halaman'],
  ['surface', 'bg-surface', 'Kartu, panel, baris tabel'],
  ['surface-raised', 'bg-surface-raised', 'Hover, header tabel, isian lembut'],
  ['surface-sunken', 'bg-surface-sunken', 'Cekungan — kode, area input'],
] as const;

const LINES = [
  ['border', 'bg-border', 'Garis default'],
  ['border-subtle', 'bg-border-subtle', 'Pemisah baris'],
  ['border-strong', 'bg-border-strong', 'Tepi kontrol'],
] as const;

const TEXTS = [
  ['foreground', 'text-foreground', 'Teks utama'],
  ['foreground-muted', 'text-foreground-muted', 'Label, keterangan'],
  ['foreground-subtle', 'text-foreground-subtle', 'Placeholder, meta'],
] as const;

/* Kelas ditulis utuh, bukan dirakit lewat template literal: Tailwind memindai teks
   sumber, jadi `bg-${key}` tidak pernah ikut ter-generate. */
const SEMANTIC = [
  ['accent', 'bg-accent', 'bg-accent-subtle', 'Satu-satunya warna aksi: tombol utama, tautan, fokus, state aktif'],
  ['success', 'bg-success', 'bg-success-subtle', 'Kredit, lunas, stok aman'],
  ['warning', 'bg-warning', 'bg-warning-subtle', 'Menunggu, jatuh tempo dekat'],
  ['destructive', 'bg-destructive', 'bg-destructive-subtle', 'Debit, hapus, gagal'],
  ['info', 'bg-info', 'bg-info-subtle', 'Ditinjau, seri data kedua pada grafik'],
] as const;

function ColorSection() {
  return (
    <Section
      id="warna"
      title="Warna"
      note="Semua warna adalah CSS variable. Komponen tidak boleh memakai hex maupun palet bawaan Tailwind. Satu warna aksi saja; sisanya netral, dan hijau/merah dikunci untuk makna akuntansi supaya tidak pernah ambigu."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Panel className="flex flex-col gap-3">
          <Eyebrow>Permukaan</Eyebrow>
          <div className="flex flex-col gap-2">
            {SURFACES.map(([name, bg, role]) => (
              <div key={name} className="flex items-center gap-3">
                <div className={cn('h-8 w-14 shrink-0 rounded-md border border-border', bg)} />
                <div className="flex min-w-0 flex-col">
                  <code className="font-mono text-sm">--{name}</code>
                  <span className="text-xs text-foreground-subtle">{role}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="flex flex-col gap-3">
          <Eyebrow>Garis &amp; teks</Eyebrow>
          <div className="flex flex-col gap-2">
            {LINES.map(([name, bg, role]) => (
              <div key={name} className="flex items-center gap-3">
                <div className={cn('h-8 w-14 shrink-0 rounded-md', bg)} />
                <div className="flex min-w-0 flex-col">
                  <code className="font-mono text-sm">--{name}</code>
                  <span className="text-xs text-foreground-subtle">{role}</span>
                </div>
              </div>
            ))}
            <div className="my-1 h-px bg-border" />
            {TEXTS.map(([name, text, role]) => (
              <div key={name} className="flex items-center gap-3">
                <span className={cn('w-14 shrink-0 text-center text-base font-semibold', text)}>Rp</span>
                <div className="flex min-w-0 flex-col">
                  <code className="font-mono text-sm">--{name}</code>
                  <span className="text-xs text-foreground-subtle">{role}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="flex flex-col gap-3">
        <Eyebrow>Semantik — warna dipakai untuk arti, bukan hiasan</Eyebrow>
        <div className="flex flex-col gap-2">
          {SEMANTIC.map(([name, solid, subtle, role]) => (
            <div key={name} className="flex items-center gap-3">
              <div className={cn('h-8 w-14 shrink-0 rounded-md', solid)} />
              <div className={cn('h-8 w-14 shrink-0 rounded-md border border-border', subtle)} />
              <div className="flex min-w-0 flex-col">
                <code className="font-mono text-sm">
                  --{name} <span className="text-foreground-subtle">/ --{name}-subtle</span>
                </code>
                <span className="text-xs text-foreground-subtle">{role}</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </Section>
  );
}

/* ── tipografi, spasi, radius, bayangan, gerak ────────────────────────────── */

const TYPE = [
  ['xl', 'text-xl', '22 / 28 · 600', 'Rp 12.480.000'],
  ['lg', 'text-lg', '16 / 22 · 600', 'Daftar Transaksi'],
  ['base', 'text-base', '13 / 20 · 400', 'Beras Premium 5 kg — CV Sumber Pangan'],
  ['sm', 'text-sm', '12 / 18 · 400', 'Jatuh tempo 9 Oktober 2026'],
  ['xs', 'text-xs', '11 / 16 · 600', 'METODE PEMBAYARAN'],
] as const;

const SPACING = [
  ['1', 'h-1 w-1'],
  ['2', 'h-2 w-2'],
  ['3', 'h-3 w-3'],
  ['4', 'h-4 w-4'],
  ['5', 'h-5 w-5'],
  ['6', 'h-6 w-6'],
  ['8', 'h-8 w-8'],
  ['10', 'h-10 w-10'],
  ['12', 'h-12 w-12'],
] as const;
const RADII = [
  ['sm', 'rounded-sm', 'Pill, badge'],
  ['md', 'rounded-md', 'Kontrol, tombol ikon'],
  ['lg', 'rounded-lg', 'Kartu, panel, input'],
  ['xl', 'rounded-xl', 'Dialog, sheet'],
] as const;

function ScaleSection() {
  return (
    <>
      <Section
        id="tipografi"
        title="Tipografi"
        note="Lima ukuran, tidak lebih. Base 13px, bukan 16px — aplikasi ini padat dan dipakai sepanjang hari. Semua angka uang memakai JetBrains Mono tabular sehingga kolom rupiah rata secara vertikal."
      >
        <Panel className="flex flex-col divide-y divide-border-subtle">
          {TYPE.map(([name, cls, spec, sample]) => (
            <div key={name} className="flex items-baseline gap-4 py-2.5 first:pt-0 last:pb-0">
              <code className="w-12 shrink-0 font-mono text-xs text-foreground-subtle">{name}</code>
              <code className="w-24 shrink-0 font-mono text-xs text-foreground-subtle">{spec}</code>
              <span
                className={cn(
                  cls,
                  name === 'xl' || name === 'lg' ? 'font-semibold tracking-tight' : '',
                  name === 'xs' ? 'font-bold uppercase tracking-[0.09em] text-foreground-subtle' : '',
                  name === 'xl' ? 'font-mono tabular' : ''
                )}
              >
                {sample}
              </span>
            </div>
          ))}
        </Panel>
      </Section>

      <Section
        id="spasi"
        title="Spasi, radius, bayangan, gerak"
        note="Skala spasi kelipatan 4. Bayangan hanya dua — kedalaman datang dari garis 1px, bukan dari blur, supaya tetap ringan meski padat."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Panel className="flex flex-col gap-3">
            <Eyebrow>Spasi</Eyebrow>
            <div className="flex items-end gap-2">
              {SPACING.map(([label, box]) => (
                <div key={label} className="flex flex-col items-center gap-1.5">
                  <div className={cn('bg-accent', box)} />
                  <code className="font-mono text-xs text-foreground-subtle">{label}</code>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="flex flex-col gap-3">
            <Eyebrow>Radius</Eyebrow>
            <div className="flex gap-2">
              {RADII.map(([name, cls, role]) => (
                <div key={name} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className={cn('h-12 w-full border border-border-strong', cls)} />
                  <code className="font-mono text-xs text-foreground-subtle">{name}</code>
                  <span className="text-center text-xs text-foreground-subtle">{role}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="flex flex-col gap-3">
            <Eyebrow>Bayangan</Eyebrow>
            <div className="flex gap-3 rounded-md bg-surface-sunken p-3">
              <div className="flex flex-1 flex-col items-center gap-1.5">
                <div className="h-12 w-full rounded-lg bg-surface shadow-sm" />
                <code className="font-mono text-xs text-foreground-subtle">sm — kartu</code>
              </div>
              <div className="flex flex-1 flex-col items-center gap-1.5">
                <div className="h-12 w-full rounded-lg bg-surface shadow-md" />
                <code className="font-mono text-xs text-foreground-subtle">md — overlay</code>
              </div>
            </div>
          </Panel>

          <Panel className="flex flex-col gap-3">
            <Eyebrow>Durasi transisi</Eyebrow>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <code className="font-mono text-xs">duration-fast</code>
                <span className="text-foreground-muted">120ms — hover, fokus</span>
              </div>
              <div className="flex items-center justify-between">
                <code className="font-mono text-xs">duration</code>
                <span className="text-foreground-muted">160ms — bawaan</span>
              </div>
              <div className="flex items-center justify-between">
                <code className="font-mono text-xs">duration-slow</code>
                <span className="text-foreground-muted">200ms — overlay masuk/keluar</span>
              </div>
              <p className="pt-1 text-xs text-foreground-subtle">
                Tidak ada yang lebih lambat dari 200ms. Animasi yang membuat menunggu bukan animasi.
              </p>
            </div>
          </Panel>
        </div>
      </Section>
    </>
  );
}

/* ── ikon ─────────────────────────────────────────────────────────────────── */

const ICON_SAMPLES = [
  [Search, 'Search', 'cari'],
  [Plus, 'Plus', 'tambah'],
  [Eye, 'Eye', 'lihat detail'],
  [ArrowDownToLine, 'ArrowDownToLine', 'unduh'],
  [Trash2, 'Trash2', 'hapus'],
  [Check, 'Check', 'diterima'],
  [AlertTriangle, 'AlertTriangle', 'perlu perhatian'],
  [ChevronDown, 'ChevronDown', 'buka pilihan'],
] as const;

function IconSection() {
  return (
    <Section
      id="ikon"
      title="Ikon"
      note="lucide-react, stroke 1.75, warna selalu mengikuti token teks di sekitarnya — tidak pernah diwarnai sendiri. Ikon dipakai kalau membantu pengenalan; ikon yang cuma bikin rame menambah noise dan memperlambat pemindaian. Aturan praktisnya: kalau labelnya sudah jelas dan ikonnya tidak menambah kecepatan mengenali, buang ikonnya."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Panel className="flex flex-col gap-3">
          <Eyebrow>Ukuran</Eyebrow>
          <div className="flex items-end gap-6">
            {[
              [14, 'dalam baris tabel padat'],
              [16, 'bawaan — tombol, menu, inline'],
              [20, 'judul bagian, empty state'],
            ].map(([size, role]) => (
              <div key={size as number} className="flex flex-col items-center gap-1.5">
                <Search size={size as number} strokeWidth={1.75} aria-hidden />
                <code className="font-mono text-xs text-foreground-subtle">{size}px</code>
                <span className="max-w-[9rem] text-center text-xs text-foreground-subtle">{role}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="flex flex-col gap-3">
          <Eyebrow>Sebagian yang dipakai</Eyebrow>
          <div className="grid grid-cols-4 gap-3">
            {ICON_SAMPLES.map(([Icon, name, role]) => {
              const I = Icon as typeof Search;
              return (
                <div key={name as string} className="flex flex-col items-center gap-1 text-center">
                  <I size={16} strokeWidth={1.75} className="text-foreground-muted" aria-hidden />
                  <code className="font-mono text-xs text-foreground-subtle">{role as string}</code>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </Section>
  );
}

/* ── Tremor & command palette ─────────────────────────────────────────────── */

const ARUS = [
  { hari: 'Sen', Masuk: 1840000, Keluar: 1120000 },
  { hari: 'Sel', Masuk: 2260000, Keluar: 1480000 },
  { hari: 'Rab', Masuk: 1970000, Keluar: 1310000 },
  { hari: 'Kam', Masuk: 3140000, Keluar: 1720000 },
  { hari: 'Jum', Masuk: 2680000, Keluar: 1590000 },
  { hari: 'Sab', Masuk: 4120000, Keluar: 1860000 },
  { hari: 'Min', Masuk: 2410000, Keluar: 1440000 },
];

const rupiah = (n: number) => `Rp ${Intl.NumberFormat('id-ID').format(n)}`;
// Sumbu Y hanya muat label pendek; rupiah penuh membuatnya berdesakan dan terpotong.
function rupiahSingkat(n: number): string {
  if (n === 0) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} jt`;
  return `${n / 1000} rb`;
}

function TremorSection() {
  return (
    <Section
      id="tremor"
      title="Tremor & command palette"
      note="Keduanya mensyaratkan React 18, jadi baru bisa dipakai setelah upgrade. Chart memakai palet Tremor yang dipetakan ke warna token, bukan warna bawaannya. Command palette dibuka dengan Cmd/Ctrl+K dan sumbernya MENU_LIST yang sama dengan sidebar."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-semibold">Arus kas pekan ini</span>
            <span className="font-mono text-sm tabular text-foreground-muted">Rp 18.420.000</span>
          </div>
          <AreaChart
            data={ARUS}
            index="hari"
            categories={['Masuk', 'Keluar']}
            colors={['indigo', 'cyan']}
            valueFormatter={rupiahSingkat}
            showAnimation={false}
            className="h-56"
          />
        </Panel>

        <Panel className="flex flex-col gap-3">
          <span className="text-lg font-semibold">Barang terlaris</span>
          <BarList
            data={[
              { name: 'Beras Premium 5 kg', value: 3600000 },
              { name: 'Minyak Goreng 2 L', value: 1350000 },
              { name: 'Telur Ayam 1 kg', value: 1312000 },
              { name: 'Gula Pasir 1 kg', value: 870000 },
            ]}
            valueFormatter={rupiah}
            color="indigo"
            showAnimation={false}
          />
        </Panel>
      </div>
    </Section>
  );
}

/* ── tombol ───────────────────────────────────────────────────────────────── */

const BUTTON_VARIANTS = [
  ['default', 'Aksi utama halaman. Satu saja per layar.'],
  ['secondary', 'Aksi pendamping yang masih sering dipakai.'],
  ['outline', 'Netral: batal, tutup, kembali.'],
  ['ghost', 'Aksi di dalam baris tabel atau toolbar padat.'],
  ['destructive', 'Menghapus data. Selalu lewat konfirmasi.'],
  ['destructive-outline', 'Merusak tapi bukan aksi utama di layar itu.'],
] as const;

function ButtonSection() {
  return (
    <Section
      id="tombol"
      title="Tombol"
      note="Satu primitive di components/ui/button. Tinggi 32/36/40px — lebih pendek dari tombol lama (36/44px) mengikuti arah compact. Komponen Button lama sekarang cuma adapter ke sini, jadi halaman yang belum dipindahkan ikut berubah tanpa diubah."
    >
      <Panel className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Eyebrow>Varian</Eyebrow>
          {BUTTON_VARIANTS.map(([variant, kapan]) => (
            <div
              key={variant}
              className="flex flex-wrap items-center gap-3 border-b border-border-subtle pb-3 last:border-0 last:pb-0"
            >
              <div className="flex w-56 shrink-0 items-center gap-2">
                <Button variant={variant}>
                  <Plus aria-hidden /> Simpan
                </Button>
              </div>
              <code className="w-40 shrink-0 font-mono text-sm text-foreground-subtle">{variant}</code>
              <p className="text-sm text-foreground-muted">{kapan}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Eyebrow>Ukuran</Eyebrow>
          <div className="flex flex-wrap items-end gap-2">
            <Button size="sm">sm — 32px</Button>
            <Button size="default">default — 36px</Button>
            <Button size="lg">lg — 40px</Button>
            <Button size="icon" aria-label="Cari">
              <Search aria-hidden />
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label="Hapus">
              <Trash2 aria-hidden />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Eyebrow>State</Eyebrow>
          <div className="flex flex-wrap items-center gap-2">
            <Button>Normal</Button>
            <Button disabled>Disabled</Button>
            <Button loading>Menyimpan…</Button>
            <Button variant="outline" loading>
              Memuat…
            </Button>
          </div>
          <p className="text-sm text-foreground-muted">
            <code className="font-mono">loading</code> memasang spinner, mematikan tombol, dan menyetel{' '}
            <code className="font-mono">aria-busy</code> — jadi aksi tidak bisa terkirim dua kali dan screen reader tahu
            prosesnya masih jalan.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Eyebrow>Lebar penuh</Eyebrow>
          <div className="max-w-sm">
            <Button fullWidth>
              <Check aria-hidden /> Selesaikan transaksi
            </Button>
          </div>
        </div>
      </Panel>
    </Section>
  );
}

/* ── kontrol form ─────────────────────────────────────────────────────────── */

function Field({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-1', className)}>{children}</div>;
}

function FormSection() {
  return (
    <Section
      id="form"
      title="Kontrol form"
      note="Tinggi 36px, sejajar dengan Button default (sebelumnya 44px). Status error tidak punya prop sendiri — ia dibaca dari aria-invalid, jadi tampilan dan penanda untuk screen reader tidak bisa saling menyimpang."
    >
      <Panel className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Field>
            <Label htmlFor="sg-nama" required>
              Nama pembeli
            </Label>
            <Input id="sg-nama" defaultValue="Warung Bu Melati" />
          </Field>
          <Field>
            <Label htmlFor="sg-cari">Dengan ikon</Label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-foreground-subtle">
                <Search size={16} aria-hidden />
              </div>
              <Input id="sg-cari" className="pl-8" placeholder="Cari transaksi" />
            </div>
          </Field>
          <Field>
            <Label htmlFor="sg-mati">Nonaktif</Label>
            <Input id="sg-mati" disabled defaultValue="Tidak bisa diubah" />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field>
            <Label htmlFor="sg-diskon" className="text-destructive">
              Diskon
            </Label>
            <Input id="sg-diskon" defaultValue="0" aria-invalid aria-describedby="sg-diskon-err" />
            <span id="sg-diskon-err" role="alert" className="text-sm text-destructive">
              Harus lebih dari Rp 0
            </span>
          </Field>
          <Field className="md:col-span-2">
            <Label htmlFor="sg-catatan">Catatan</Label>
            <Textarea id="sg-catatan" placeholder="Opsional" />
          </Field>
        </div>

        <div className="flex flex-col gap-2">
          <Eyebrow>Checkbox</Eyebrow>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox id="sg-cb1" defaultChecked />
              <label htmlFor="sg-cb1" className="cursor-pointer select-none text-base">
                Bayar seluruhnya
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="sg-cb2" />
              <label htmlFor="sg-cb2" className="cursor-pointer select-none text-base">
                Belum dicentang
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="sg-cb3" disabled defaultChecked />
              <label htmlFor="sg-cb3" className="select-none text-base text-foreground-subtle">
                Terkunci
              </label>
            </div>
          </div>
          <p className="text-sm text-foreground-muted">
            Tetap <code className="font-mono">&lt;input type=&quot;checkbox&quot;&gt;</code> asli — fokus, keyboard, dan
            pengiriman form ikut gratis; hanya tampilannya yang diganti.
          </p>
        </div>
      </Panel>
    </Section>
  );
}

/* ── select & tanggal ─────────────────────────────────────────────────────── */

const CONTOH_OPSI = [
  { value: 'kas', label: 'Kas' },
  { value: 'bank', label: 'Bank' },
  { value: 'utang', label: 'Utang' },
  { value: 'giro', label: 'Giro' },
];

function SelectSection() {
  const [metode, setMetode] = useState<(typeof CONTOH_OPSI)[number] | null>(CONTOH_OPSI[0]);
  const [tanggal, setTanggal] = useState<Date | null>(new Date(2026, 8, 9));

  return (
    <Section
      id="select"
      title="Select & tanggal"
      note="react-select memasang gayanya sebagai style inline lewat emotion, jadi kelas Tailwind tidak berlaku di dalamnya. Yang dipakai justru CSS variable-nya langsung — hsl(var(--surface)) — sehingga ikut berganti tema tanpa kode tema apa pun di komponen. Kalender react-datepicker dipetakan lewat override di globals.css."
    >
      <Panel className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Field>
            <Label htmlFor="sg-metode">Metode pembayaran</Label>
            <ThemedSelect
              inputId="sg-metode"
              options={CONTOH_OPSI}
              value={metode}
              onChange={(v) => setMetode(v as (typeof CONTOH_OPSI)[number])}
            />
          </Field>
          <Field>
            <Label htmlFor="sg-metode-contained">Varian contained</Label>
            <ThemedSelect
              inputId="sg-metode-contained"
              variant="contained"
              options={CONTOH_OPSI}
              placeholder="Pilih…"
            />
          </Field>
          <Field>
            <Label>Tanggal penjualan</Label>
            <DatePickerComponent selected={tanggal} onChange={(d: Date) => setTanggal(d)} />
          </Field>
        </div>
        <p className="text-sm text-foreground-muted">
          Buka salah satu select untuk melihat menu, state hover, dan state terpilih. Option terpilih tetap berwarna
          accent walau sedang di-hover — kalau tidak, satu-satunya penanda pilihan hilang persis saat kursor ada di
          atasnya.
        </p>
      </Panel>
    </Section>
  );
}

/* ── feedback ─────────────────────────────────────────────────────────────── */

const STATUS = [
  ['warning', 'Menunggu'],
  ['info', 'Ditinjau'],
  ['success', 'Diterima'],
  ['destructive', 'Ditolak'],
  ['neutral', 'Arsip'],
  ['accent', 'Baru'],
] as const;

function FeedbackSection() {
  const [memuat, setMemuat] = useState(false);

  return (
    <Section
      id="feedback"
      title="Feedback"
      note="Empat cara memberi tahu keadaan: badge untuk status yang menetap, skeleton saat data belum datang, progress bar saat pindah halaman, toast untuk hasil sebuah aksi."
    >
      <Panel className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Eyebrow>Badge</Eyebrow>
          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS.map(([variant, label]) => (
              <Badge key={variant} variant={variant}>
                {label}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-foreground-muted">
            Selalu latar <code className="font-mono">*-subtle</code> dengan teks warna penuh, bukan sebaliknya — satu
            baris tabel penuh badge tidak boleh berubah jadi papan warna.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Eyebrow>Skeleton</Eyebrow>
          <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          <p className="text-sm text-foreground-muted">
            Bentuknya mengikuti konten yang akan mengisi, supaya tata letak tidak melompat saat data tiba.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Eyebrow>Progress bar pindah halaman</Eyebrow>
          <ProgressBar active={memuat} />
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setMemuat((v) => !v)}>
              {memuat ? 'Hentikan' : 'Jalankan'}
            </Button>
            <span className="text-sm text-foreground-muted">
              Garis akan muncul di tepi paling atas jendela. Merayap ke 90% lalu menunggu — Next tidak melaporkan
              progres sebenarnya, jadi menampilkan angka pasti akan berbohong.
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Eyebrow>Toast</Eyebrow>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => toast.success('Transaksi tersimpan')}>
              Sukses
            </Button>
            <Button size="sm" variant="secondary" onClick={() => toast.error('Stok tidak mencukupi')}>
              Gagal
            </Button>
            <Button size="sm" variant="secondary" onClick={() => toast('Draf disimpan otomatis')}>
              Netral
            </Button>
          </div>
        </div>
      </Panel>
    </Section>
  );
}

/* ── overlay ──────────────────────────────────────────────────────────────── */

function OverlaySection() {
  const [buka, setBuka] = useState(false);

  return (
    <Section
      id="overlay"
      title="Overlay"
      note="Dialog dan tooltip. Scrim di belakang dialog punya tokennya sendiri karena hitam 40% yang dipakai sebelumnya nyaris tak terlihat di atas ground gelap — batas dialognya ikut hilang."
    >
      <Panel className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setBuka(true)}>
          Buka dialog
        </Button>
        <Tippy content="Muncul setelah jeda singkat, hilang saat kursor pergi">
          <span className="inline-flex">
            <Button variant="ghost" size="sm">
              Arahkan kursor ke sini
            </Button>
          </span>
        </Tippy>
        <span className="text-sm text-foreground-muted">
          Dialog ditutup dengan Esc, klik di luar, atau tombol Batal — ketiganya sudah bawaan react-modal.
        </span>

        <Modal isOpen={buka} onRequestClose={() => setBuka(false)}>
          <h2 className="text-lg font-semibold">Batalkan transaksi?</h2>
          <p className="mt-1 text-base text-foreground-muted">
            Stok yang sudah dikurangi akan dikembalikan. Tindakan ini tidak bisa dibatalkan.
          </p>
          <ModalActionWrapper>
            <Button variant="outline" size="sm" className="mr-2" onClick={() => setBuka(false)}>
              Batal
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setBuka(false)}>
              Ya, batalkan
            </Button>
          </ModalActionWrapper>
        </Modal>
      </Panel>
    </Section>
  );
}

/* ── pratinjau arah ───────────────────────────────────────────────────────── */

function PreviewSection() {
  return (
    <Section
      id="pratinjau"
      title="Pratinjau arah"
      note="Bukan komponen final — ini cuma memperlihatkan rasa token saat dipakai, supaya arahnya bisa dinilai tanpa membayangkan. Komponen shadcn/ui yang sebenarnya, lengkap dengan semua state, dibangun di Fase 3."
    >
      <Panel className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <Button>
            <Plus aria-hidden /> Transaksi baru
          </Button>
          <Button variant="outline">Batalkan</Button>
          <Button variant="destructive-outline">
            <Trash2 aria-hidden /> Hapus
          </Button>
          <Button loading>Menyimpan…</Button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Field>
            <Label htmlFor="sg-amount">Jumlah bayar</Label>
            <Input id="sg-amount" defaultValue="1.500.000" className="font-mono tabular" />
          </Field>
          <Field>
            <Label htmlFor="sg-bad" className="text-destructive">
              Diskon
            </Label>
            <Input
              id="sg-bad"
              defaultValue="0"
              aria-invalid
              aria-describedby="sg-bad-err"
              className="font-mono tabular"
            />
            <span id="sg-bad-err" role="alert" className="text-sm text-destructive">
              Harus lebih dari Rp 0
            </span>
          </Field>
          <Field>
            <span className="text-sm font-medium text-foreground-muted">Status</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="warning">Menunggu</Badge>
              <Badge variant="info">Ditinjau</Badge>
              <Badge variant="success">Diterima</Badge>
              <Badge variant="destructive">Ditolak</Badge>
            </div>
          </Field>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-raised">
                {['Kode', 'Customer', 'Debit', 'Kredit', 'Status'].map((h, i) => (
                  <th
                    key={h}
                    className={cn(
                      'border-b border-border px-3 py-2 text-xs font-bold uppercase tracking-[0.07em] text-foreground-subtle',
                      i > 1 ? 'text-right' : 'text-left'
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['TRX-0038', 'Warung Bu Melati', '', '486.000', 'Diterima', 'bg-success-subtle text-success'],
                ['BM-0902', 'CV Sumber Pangan', '2.175.000', '', 'Ditinjau', 'bg-info-subtle text-info'],
              ].map(([code, name, debit, credit, status, tone]) => (
                <tr key={code} className="border-b border-border-subtle last:border-0">
                  <td className="px-3 py-2 font-mono text-base tabular font-medium">{code}</td>
                  <td className="px-3 py-2 text-base">{name}</td>
                  <td
                    className={cn(
                      'px-3 py-2 text-right font-mono text-base tabular',
                      debit ? 'text-destructive' : 'text-foreground-subtle'
                    )}
                  >
                    {debit || '—'}
                  </td>
                  <td
                    className={cn(
                      'px-3 py-2 text-right font-mono text-base tabular',
                      credit ? 'text-success' : 'text-foreground-subtle'
                    )}
                  >
                    {credit || '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className={cn('rounded-sm px-2 py-0.5 text-sm font-semibold', tone)}>{status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-foreground-muted">
          Coba tekan{' '}
          <kbd className="rounded-sm border border-border-strong bg-surface-raised px-1.5 py-0.5 font-mono text-xs">
            Tab
          </kbd>{' '}
          untuk melihat ring fokus — satu gaya, sama di kedua tema.
        </p>
      </Panel>
    </Section>
  );
}

/* ── halaman ──────────────────────────────────────────────────────────────── */

const NAV = [
  ['warna', 'Warna'],
  ['tipografi', 'Tipografi'],
  ['spasi', 'Spasi & gerak'],
  ['ikon', 'Ikon'],
  ['tombol', 'Tombol'],
  ['form', 'Form'],
  ['select', 'Select & tanggal'],
  ['feedback', 'Feedback'],
  ['overlay', 'Overlay'],
  ['tremor', 'Tremor & ⌘K'],
  ['pratinjau', 'Pratinjau arah'],
] as const;

function StyleguidePage(): JSX.Element {
  return (
    <>
      <Head>
        <title>Styleguide — Putra Pribumi</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
          <div className="mx-auto flex max-w-[72rem] items-center justify-between gap-4 px-6 py-3">
            <div className="flex items-baseline gap-3">
              <span className="text-lg font-semibold tracking-tight">Styleguide</span>
              <span className="text-sm text-foreground-subtle">Fase 2 — fondasi</span>
            </div>
            <nav className="hidden items-center gap-4 lg:flex">
              {NAV.map(([id, label]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="text-sm text-foreground-muted transition duration-fast hover:text-foreground"
                >
                  {label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <CommandPalette />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="mx-auto flex max-w-[72rem] flex-col gap-10 px-6 py-8">
          <p className="max-w-[76ch] text-base text-foreground-muted">
            Semua warna di halaman ini berasal dari CSS variable, dan pergantian tema hanya menukar nilai variabel itu —
            tidak ada satu pun kelas <code className="font-mono text-sm">dark:</code> di komponen. Ganti tema lewat
            tombol di kanan atas; pilihan tersimpan, dan bawaannya mengikuti setelan sistem.
          </p>
          <ColorSection />
          <ScaleSection />
          <IconSection />
          <ButtonSection />
          <FormSection />
          <SelectSection />
          <FeedbackSection />
          <OverlaySection />
          <TremorSection />
          <PreviewSection />
        </main>
      </div>
    </>
  );
}

// Halaman ini seluruhnya memakai token, jadi aman mengikuti tema pengguna.
StyleguidePage.themeable = true;

export default StyleguidePage;
