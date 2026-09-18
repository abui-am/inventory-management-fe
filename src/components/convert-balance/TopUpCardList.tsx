import dayjs from 'dayjs';
import { ChevronRight } from 'lucide-react';
import React from 'react';

import { SumberDana } from '@/components/expense/ExpenseCardList';
import { RecordCardList } from '@/components/ui/record-card';
import { LedgerTopUpsData } from '@/typings/ledger-top-up';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/** Daftar konversi di layar sempit. */
export function TopUpCardList({
  rows,
  loading,
  perPage,
  empty,
}: {
  rows?: LedgerTopUpsData[];
  loading: boolean;
  perPage: number;
  empty: { judul: string; pesan: string };
}): JSX.Element {
  return (
    <RecordCardList loading={loading} count={perPage} empty={empty} isEmpty={rows?.length === 0}>
      {rows?.map((row) => (
        <div
          key={row.id}
          className="flex flex-col gap-2 rounded-card border border-border bg-surface px-3 py-2.5 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2.25">
            {/* Arahnya dibaca sebagai satu kalimat: dari mana, ke mana. */}
            <span className="flex min-w-0 items-center gap-1.5 text-base font-semibold">
              <SumberDana metode={row.payment_method} />
              <ChevronRight size={13} strokeWidth={2} className="shrink-0 text-foreground-subtle" aria-hidden />
              <span className="truncate">{row.ledger_account?.name}</span>
            </span>
            <span className="shrink-0 font-mono text-base font-bold tabular-nums">{formatNumber(+row.amount)}</span>
          </div>

          <div className="flex items-center justify-between gap-2.25 border-t border-border-subtle pt-1.5">
            <span className="font-mono text-xs text-foreground-subtle">
              {dayjs(row.created_at).format('DD MMM YYYY HH.mm')}
            </span>
            {row.payment_method === 'personal_money' && (
              <span className="text-xs text-info">dicatat sebagai setoran modal</span>
            )}
          </div>
        </div>
      ))}
    </RecordCardList>
  );
}

export default TopUpCardList;
