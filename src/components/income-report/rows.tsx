import { ChevronDown, ChevronRight, LucideIcon } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/cn';

export const formatNumber = (n: number): string =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/**
 * Satu baris laporan: keterangan di kiri, angka di kanan.
 *
 * Angkanya SELALU mono dan tabular — laporan dibaca dengan menyusuri kolom kanan dari
 * atas ke bawah, dan itu cuma bisa kalau digitnya selebar satu sama lain.
 */
export function Baris({
  label,
  nilai,
  tanda,
  anak,
  indent = 0,
  tone,
  buka,
  onToggle,
}: {
  label: string;
  nilai: number;
  /** Tanda kurang untuk baris yang mengurangi — "−4.180.000", bukan "4.180.000". */
  tanda?: string;
  /** Baris rincian di bawah induknya: lebih kecil dan lebih redup. */
  anak?: boolean;
  indent?: number;
  tone?: 'destructive' | 'success';
  /** `undefined` = tidak bisa dibuka. */
  buka?: boolean;
  onToggle?: () => void;
}): JSX.Element {
  const Panah = buka ? ChevronDown : ChevronRight;
  const isi = (
    <>
      <span
        className={cn('inline-flex items-center', anak ? 'text-sm text-foreground-subtle' : 'text-foreground-muted')}
      >
        {buka !== undefined && (
          <Panah size={12} strokeWidth={1.9} className="mr-1.5 shrink-0 text-foreground-subtle" aria-hidden />
        )}
        {label}
      </span>
      <span
        className={cn(
          'font-mono tabular-nums',
          anak ? 'text-sm font-medium' : 'font-semibold',
          tone === 'destructive' && 'text-destructive',
          tone === 'success' && 'text-success'
        )}
      >
        {tanda}
        {formatNumber(nilai)}
      </span>
    </>
  );

  if (onToggle) {
    return (
      <button
        type="button"
        onClick={onToggle}
        style={{ paddingLeft: indent }}
        aria-expanded={buka}
        className={cn(
          'flex w-full items-baseline justify-between gap-3 py-1.25 text-base',
          'transition-colors duration-fast hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25'
        )}
      >
        {isi}
      </button>
    );
  }

  return (
    <div style={{ paddingLeft: indent }} className="flex items-baseline justify-between gap-3 py-1.25 text-base">
      {isi}
    </div>
  );
}

/** Baris jumlah — bergaris di atasnya, bukan berlatar. */
export function BarisTotal({
  label,
  nilai,
  tone,
  besar,
}: {
  label: string;
  nilai: number;
  tone?: 'destructive' | 'success';
  besar?: boolean;
}): JSX.Element {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-border pb-0.5 pt-2">
      <span className={cn('font-bold', besar ? 'text-lg' : 'text-base')}>{label}</span>
      <span
        className={cn(
          'font-mono font-bold tabular-nums tracking-[-0.02em]',
          besar ? 'text-lg' : 'text-base',
          tone === 'destructive' && 'text-destructive',
          tone === 'success' && 'text-success'
        )}
      >
        {formatNumber(nilai)}
      </span>
    </div>
  );
}

/**
 * Baris dengan bar proporsi.
 *
 * Bar-nya bukan hiasan: ia menjawab "seberapa besar dibanding yang lain" tanpa pembacanya
 * perlu membagi angka di kepala. Persentasenya tetap ditulis karena bar sependek 2% tidak
 * bisa dibedakan dari 0.
 */
export function BarisBar({
  label,
  nilai,
  persen,
  tone = 'accent',
  Icon,
  buka,
  onToggle,
}: {
  label: string;
  nilai: number;
  persen: number;
  tone?: 'accent' | 'warning';
  Icon?: LucideIcon;
  buka?: boolean;
  onToggle?: () => void;
}): JSX.Element {
  const Panah = buka ? ChevronDown : ChevronRight;
  const isi = (
    <>
      <div className="flex items-baseline justify-between gap-3 text-base">
        <span className="inline-flex min-w-0 items-center text-foreground-muted">
          {buka !== undefined && (
            <Panah size={12} strokeWidth={1.9} className="mr-1.5 shrink-0 text-foreground-subtle" aria-hidden />
          )}
          {Icon && <Icon size={13} strokeWidth={1.8} className="mr-1.5 shrink-0" aria-hidden />}
          <span className="truncate">{label}</span>
        </span>
        <span className="inline-flex shrink-0 items-baseline gap-1.75">
          <span className="font-mono font-semibold tabular-nums">{formatNumber(nilai)}</span>
          <span className="w-9 text-right font-mono text-sm tabular-nums text-foreground-subtle">{persen}%</span>
        </span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-sunken">
        <div
          style={{ width: `${Math.max(persen, 1)}%` }}
          className={cn('h-full rounded-full', tone === 'warning' ? 'bg-warning' : 'bg-accent')}
        />
      </div>
    </>
  );

  if (onToggle) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={buka}
        className={cn(
          'block w-full py-1.25 text-left transition-colors duration-fast hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25'
        )}
      >
        {isi}
      </button>
    );
  }

  return <div className="py-1.25">{isi}</div>;
}

/** Judul seksi di dalam kartu laporan — Pendapatan, Beban. */
export function JudulSeksi({ children }: { children: React.ReactNode }): JSX.Element {
  return <div className="mb-0.5 text-xs font-bold text-foreground-subtle">{children}</div>;
}
