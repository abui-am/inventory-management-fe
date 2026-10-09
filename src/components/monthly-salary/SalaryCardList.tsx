import React from 'react';

import { BarisGaji, formatAngka } from '@/components/monthly-salary/rows';
import StatusGaji from '@/components/monthly-salary/StatusGaji';
import { Button } from '@/components/ui/button';
import Skeleton from '@/components/ui/skeleton';

/**
 * Daftar gaji di layar sempit.
 *
 * Tujuh kolom tidak muat di 360px, jadi tiga angkanya dilebur jadi satu batang kemajuan
 * plus satu baris "sekian dari sekian" — bentuk yang menjawab pertanyaan yang sama
 * (seberapa jauh orang ini sudah dibayar) tanpa menggeser apa pun ke samping.
 */
export function SalaryCardList({
  baris,
  loading,
  perPage,
  kosong,
  onBayar,
}: {
  baris: BarisGaji[];
  loading: boolean;
  perPage: number;
  kosong: React.ReactNode;
  onBayar: (baris: BarisGaji) => void;
}): JSX.Element {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: Math.min(perPage, 6) }, (_, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={i} className="rounded-card border border-border bg-surface px-3 py-2.5 shadow-sm">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="mt-2 h-1 w-full" />
            <Skeleton className="mt-2 h-3 w-3/5" />
          </div>
        ))}
      </div>
    );
  }

  if (baris.length === 0) {
    return (
      <div className="rounded-card border border-border bg-surface px-3 py-10 text-center shadow-sm">{kosong}</div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {baris.map((b) => {
        const persen = b.gaji > 0 ? Math.round((b.dibayar / b.gaji) * 100) : 0;

        return (
          <div
            key={b.id}
            className="flex flex-col gap-2 rounded-card border border-border bg-surface px-3 py-2.5 shadow-sm"
          >
            <div className="flex items-center gap-2.25">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-2xs font-bold text-accent">
                {(b.nama.trim()[0] ?? '?').toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold">{b.nama}</div>
                <div className="truncate text-xs text-foreground-muted">{b.jabatan || '—'}</div>
              </div>
              <StatusGaji baris={b} />
            </div>

            <div className="h-1 overflow-hidden rounded-pill bg-surface-sunken">
              <div className="h-full rounded-pill bg-success" style={{ width: `${persen}%` }} />
            </div>

            <div className="text-xs text-foreground-muted">
              <span
                className={
                  b.dibayar > 0
                    ? 'font-mono font-semibold tabular-nums text-success'
                    : 'font-mono tabular-nums text-foreground-subtle'
                }
              >
                {formatAngka(b.dibayar)}
              </span>{' '}
              dari <span className="font-mono tabular-nums">{formatAngka(b.gaji)}</span>
            </div>

            {b.sisa > 0 && (
              <Button size="sm" variant="outline" fullWidth onClick={() => onBayar(b)}>
                Bayar sisa {formatAngka(b.sisa)}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default SalaryCardList;
