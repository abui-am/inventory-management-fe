import React from 'react';

import Skeleton from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';

/**
 * Satu baris daftar, dalam bentuk kartu — dipakai semua halaman daftar di layar sempit.
 *
 * Kolom tabel tidak dihilangkan, hanya berpindah tempat, dan tempatnya ditentukan PERAN
 * kolomnya, bukan urutannya di tabel:
 *
 *   utama       kiri atas, tebal        nama, kode transaksi
 *   pendamping  di bawah utama, redup   nomor HP, supplier, metode bayar
 *   nilai       kanan atas, mono besar  piutang, jumlah
 *   status      kanan, di bawah nilai   lencana status
 *   meta        kiri kaki kartu         waktu, tanggal
 *   aksi        kanan kaki kartu        tombol yang MENGUBAH sesuatu
 *
 * Seluruh kartu adalah sasaran sentuh untuk membuka rincian; ikon 26px terlalu kecil
 * untuk jempol, jadi ikon "lihat" tidak pernah ada di sini.
 */
export function RecordCard({
  avatar,
  utama,
  pendamping,
  nilai,
  nilaiLabel,
  nilaiTone = 'default',
  status,
  meta,
  aksi,
  onOpen,
  redup,
  ariaLabel,
}: {
  avatar?: React.ReactNode;
  utama: React.ReactNode;
  /** Satu atau dua baris keterangan. Yang kosong dibuang, bukan dirender jadi baris hampa. */
  pendamping?: React.ReactNode[];
  nilai: string;
  nilaiLabel?: string;
  nilaiTone?: 'default' | 'warning' | 'muted';
  status?: React.ReactNode;
  meta?: React.ReactNode;
  aksi?: React.ReactNode;
  onOpen: () => void;
  /** Baris yang dibatalkan — diredupkan, bukan disembunyikan. */
  redup?: boolean;
  ariaLabel: string;
}): JSX.Element {
  const baris = (pendamping ?? []).filter(Boolean);

  return (
    // `div` dengan role=button, bukan <button>: di dalamnya ada tombol aksi, dan tombol
    // di dalam tombol bukan HTML yang sah.
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        onOpen();
      }}
      className={cn(
        'flex cursor-pointer flex-col gap-1.75 rounded-card border border-border bg-surface px-3 py-2.5 shadow-sm',
        'transition-colors duration-fast hover:bg-surface-raised active:bg-surface-raised',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        redup && 'opacity-55'
      )}
    >
      <div className="flex items-start gap-2.25">
        {avatar}

        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{utama}</div>
          {baris.map((isi, i) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              className={cn('truncate text-xs', i === 0 ? 'text-foreground-muted' : 'text-foreground-subtle')}
            >
              {isi}
            </div>
          ))}
        </div>

        <div className="shrink-0 text-right">
          {nilaiLabel && <div className="text-2xs text-foreground-subtle">{nilaiLabel}</div>}
          <div
            className={cn(
              'font-mono text-base font-bold tabular-nums',
              nilaiTone === 'warning' && 'text-warning',
              nilaiTone === 'muted' && 'text-foreground-subtle'
            )}
          >
            {nilai}
          </div>
          {status && <div className="mt-0.75 flex justify-end">{status}</div>}
        </div>
      </div>

      {(meta || aksi) && (
        <div className="flex min-h-[26px] items-center justify-between border-t border-border-subtle pt-1.5">
          <span className="font-mono text-xs text-foreground-subtle">{meta}</span>
          <span
            className="flex items-center gap-1"
            // Kartunya membuka rincian; tombol di dalamnya tidak boleh ikut memicunya.
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            {aksi}
          </span>
        </div>
      )}
    </div>
  );
}

/** Pembungkus daftar kartu: menangani state memuat dan state kosong dalam bentuk kartu juga. */
export function RecordCardList({
  loading,
  count,
  empty,
  isEmpty,
  children,
}: {
  loading: boolean;
  /** Berapa kartu kerangka saat memuat — diambil dari jumlah baris per halaman. */
  count: number;
  empty: { judul: string; pesan: string };
  isEmpty: boolean;
  children: React.ReactNode;
}): JSX.Element {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: Math.min(count, 6) }, (_, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={i} className="rounded-card border border-border bg-surface px-3 py-2.5 shadow-sm">
            <div className="flex items-start gap-2.25">
              <div className="flex-1">
                <Skeleton className="h-3.5 w-2/5" />
                <Skeleton className="mt-1.5 h-3 w-3/5" />
              </div>
              <Skeleton className="h-3.5 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="rounded-card border border-border bg-surface px-3 py-10 text-center shadow-sm">
        <p className="text-base font-medium">{empty.judul}</p>
        <p className="mt-1 text-sm text-foreground-muted">{empty.pesan}</p>
      </div>
    );
  }

  return <div className="flex flex-col gap-2">{children}</div>;
}

export default RecordCard;
