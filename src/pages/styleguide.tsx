import { AlertTriangle, ArrowDownToLine, Check, ChevronDown, Eye, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import Head from 'next/head';
import { ReactNode } from 'react';

import ThemeToggle from '@/components/ui/theme-toggle';
import { cn } from '@/lib/cn';

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
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 text-base font-semibold text-accent-foreground transition duration-fast hover:bg-accent-hover"
          >
            <Plus size={16} strokeWidth={2} aria-hidden /> Transaksi baru
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center rounded-md border border-border-strong bg-surface px-3 text-base font-semibold transition duration-fast hover:bg-surface-raised"
          >
            Batalkan
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-destructive bg-surface px-3 text-base font-semibold text-destructive transition duration-fast hover:bg-destructive-subtle"
          >
            <Trash2 size={16} strokeWidth={1.75} aria-hidden /> Hapus
          </button>
          <button
            type="button"
            disabled
            className="inline-flex h-8 cursor-not-allowed items-center gap-1.5 rounded-md bg-accent px-3 text-base font-semibold text-accent-foreground opacity-45"
          >
            <Loader2 size={16} strokeWidth={2} className="animate-spin" aria-hidden /> Menyimpan…
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sg-amount" className="text-sm font-medium text-foreground-muted">
              Jumlah bayar
            </label>
            <input
              id="sg-amount"
              defaultValue="1.500.000"
              className="h-8 rounded-lg border border-border-strong bg-surface px-2.5 font-mono text-base tabular text-foreground"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sg-bad" className="text-sm font-medium text-destructive">
              Diskon
            </label>
            <input
              id="sg-bad"
              defaultValue="0"
              aria-invalid
              aria-describedby="sg-bad-err"
              className="h-8 rounded-lg border border-destructive bg-surface px-2.5 font-mono text-base tabular text-foreground ring-2 ring-destructive/25"
            />
            <span id="sg-bad-err" role="alert" className="text-xs text-destructive">
              Harus lebih dari Rp 0
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground-muted">Status</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-sm bg-warning-subtle px-2 py-0.5 text-sm font-semibold text-warning">
                Menunggu
              </span>
              <span className="rounded-sm bg-info-subtle px-2 py-0.5 text-sm font-semibold text-info">Ditinjau</span>
              <span className="rounded-sm bg-success-subtle px-2 py-0.5 text-sm font-semibold text-success">
                Diterima
              </span>
              <span className="rounded-sm bg-destructive-subtle px-2 py-0.5 text-sm font-semibold text-destructive">
                Ditolak
              </span>
            </div>
          </div>
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
            <ThemeToggle />
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
          <PreviewSection />
        </main>
      </div>
    </>
  );
}

// Halaman ini seluruhnya memakai token, jadi aman mengikuti tema pengguna.
StyleguidePage.themeable = true;

export default StyleguidePage;
