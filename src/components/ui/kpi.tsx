import React from 'react';

import Skeleton from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

const NADA = {
  default: '',
  warning: 'text-warning',
  destructive: 'text-destructive',
  success: 'text-success',
} as const;

export type NadaKpi = keyof typeof NADA;

/**
 * Satu angka ringkasan di kepala halaman.
 *
 * Kerangkanya setinggi angkanya supaya kartunya tidak melompat saat data datang.
 * Warna ditentukan pemanggil — "3 stok habis" merah, tapi "0 stok habis" tidak, dan
 * aturan itu beda di tiap halaman.
 */
export function Kpi({
  label,
  nilai,
  ket,
  tone = 'default',
  ketTone = 'default',
  children,
}: {
  label: string;
  nilai?: number | string;
  ket?: React.ReactNode;
  tone?: NadaKpi;
  ketTone?: NadaKpi;
  children?: React.ReactNode;
}): JSX.Element {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-card border border-border bg-surface px-3.5 py-2.75 shadow-sm">
      <span className="text-xs text-foreground-subtle">{label}</span>
      {nilai === undefined ? (
        <Skeleton className="my-1 h-5 w-32" />
      ) : (
        <span className={cn('font-mono text-xl font-bold tabular-nums tracking-[-0.02em]', NADA[tone])}>
          {typeof nilai === 'number' ? formatNumber(nilai) : nilai}
        </span>
      )}
      <span className={cn('text-xs text-foreground-subtle', NADA[ketTone])}>{ket}</span>
      {children}
    </div>
  );
}

export default Kpi;
