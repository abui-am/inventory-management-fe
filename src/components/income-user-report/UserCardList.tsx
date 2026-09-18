import React from 'react';

import { BarisOrang, formatBertanda, nadaSaldo } from '@/components/income-user-report/rows';
import { RecordCardList } from '@/components/ui/record-card';
import { cn } from '@/lib/cn';

function Baris({ label, nilai, tone }: { label: string; nilai: number; tone?: 'saldo' }): JSX.Element {
  const nada = tone === 'saldo' ? nadaSaldo(nilai) : '';
  return (
    <div className="flex items-baseline justify-between gap-2.25 py-0.5">
      <span className="text-sm text-foreground-muted">{label}</span>
      <span className={cn('font-mono text-base font-semibold tabular-nums', nada)}>
        {nilai === 0 ? '—' : formatBertanda(nilai)}
      </span>
    </div>
  );
}

/** Daftar per orang di layar sempit — tabel lima kolom tidak muat di 360px. */
export function UserCardList({
  baris,
  loading,
  empty,
}: {
  baris: BarisOrang[];
  loading: boolean;
  empty: { judul: string; pesan: string };
}): JSX.Element {
  return (
    <RecordCardList loading={loading} count={3} empty={empty} isEmpty={baris.length === 0}>
      {baris.map((o) => (
        <div
          key={o.nama}
          className="flex flex-col gap-1 rounded-card border border-border bg-surface px-3 py-2.5 shadow-sm"
        >
          <div className="mb-0.5 flex items-center gap-2">
            <span
              aria-hidden
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-xs font-bold text-accent"
            >
              {(o.nama.trim()[0] ?? '?').toUpperCase()}
            </span>
            <span className="truncate text-base font-semibold">{o.nama}</span>
          </div>

          <Baris label="Penjualan" nilai={o.jual} />
          <Baris label="Pembelian" nilai={o.beli} />
          <Baris label="Beban" nilai={o.beban} />

          <div className="mt-1 flex items-baseline justify-between gap-2.25 border-t border-border pt-1.5">
            <span className="text-base font-bold">Saldo</span>
            <span className={cn('font-mono text-base font-bold tabular-nums', nadaSaldo(o.saldo))}>
              {formatBertanda(o.saldo)}
            </span>
          </div>

          {/* Yang dicocokkan dengan laci adalah angka ini, bukan Saldo. */}
          <span className="text-xs text-foreground-subtle">
            Kas yang dipegang <span className="font-mono">{formatBertanda(o.kas)}</span>
          </span>
        </div>
      ))}
    </RecordCardList>
  );
}

export default UserCardList;
