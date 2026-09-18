import dayjs from 'dayjs';
import { Banknote, Landmark, Wallet, Zap } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { RecordCardList } from '@/components/ui/record-card';
import { Expense } from '@/typings/expense';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/**
 * Beban yang lahir dari dokumen lain, bukan dari tombol "Catat beban".
 *
 * Nama-nama ini konstanta di `Expense::$names` dan dibuat oleh alur lain:
 * `CreatePayrollExpenseJob` (gaji), `ItemAuditController` (penyusutan persediaan), dan
 * pencatatan ongkir transaksi. Ditandai supaya tidak dikira salah catat manual.
 */
const OTOMATIS = ['Beban Gaji', 'Beban Penyusutan Persediaan', 'Beban Ongkir'];

export const bebanOtomatis = (row: Expense): boolean => OTOMATIS.includes(`${row.name ?? ''}`.trim());

export const SUMBER_DANA: Record<string, { label: string; Icon: typeof Banknote }> = {
  cash: { label: 'Kas', Icon: Banknote },
  bank: { label: 'Bank', Icon: Landmark },
  current_account: { label: 'Giro', Icon: Landmark },
  personal_money: { label: 'Uang Pribadi', Icon: Wallet },
};

/** Sumber dana sebagai ikon + nama, bukan teks telanjang. */
export function SumberDana({ metode }: { metode?: string | null }): JSX.Element {
  const sumber = SUMBER_DANA[`${metode ?? ''}`];
  if (!sumber) return <span className="text-foreground-subtle">—</span>;

  const { label, Icon } = sumber;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-foreground-muted">
      <Icon size={13} strokeWidth={1.8} aria-hidden />
      {label}
    </span>
  );
}

/** Lencana untuk beban yang dibuat alur lain. */
export function TandaOtomatis(): JSX.Element {
  return (
    <Badge variant="neutral">
      <Zap size={10} strokeWidth={2} aria-hidden />
      otomatis
    </Badge>
  );
}

/** Daftar beban di layar sempit. */
export function ExpenseCardList({
  rows,
  loading,
  perPage,
  empty,
}: {
  rows?: Expense[];
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
          <div className="flex items-start justify-between gap-2.25">
            <div className="min-w-0">
              <div className="truncate text-base font-semibold">{row.name}</div>
              <div className="truncate text-xs text-foreground-subtle">{row.description || '—'}</div>
            </div>
            <span className="shrink-0 font-mono text-base font-bold tabular-nums">{formatNumber(+row.amount)}</span>
          </div>

          <div className="flex items-center justify-between gap-2.25 border-t border-border-subtle pt-1.5">
            <span className="font-mono text-xs text-foreground-subtle">
              {dayjs(row.date).format('DD MMM YYYY HH.mm')}
            </span>
            <span className="flex items-center gap-1.75">
              {bebanOtomatis(row) && <TandaOtomatis />}
              <SumberDana metode={row.payment_method} />
            </span>
          </div>
        </div>
      ))}
    </RecordCardList>
  );
}

export default ExpenseCardList;
