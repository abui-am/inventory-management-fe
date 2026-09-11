import Tippy from '@tippyjs/react';

import { SALES_DEBIT_ACCOUNT } from '@/constants/options';
import { cn } from '@/lib/cn';

/** Tanpa awalan "Rp" — kartunya sudah menyatakan ini nominal rupiah. */
const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

type JournalRow = { type: 'D' | 'K'; account: string; amount: number };

/**
 * Menyusun jurnal yang BENAR-BENAR akan ditulis backend untuk satu transaksi salesAmount.
 *
 * Diturunkan dari TransactionRepository::setCustomerPayments, bukan dikarang:
 * satu baris debit per pembayaran (Kas/Bank/Piutang/Giro), kredit Penjualan sebesar
 * total dikurangi ongkos kirim, dan credit Pendapatan Lain-Lain sebesar ongkos kirim
 * bila ada.
 *
 * Penjualan TIDAK menulis baris HPP ke ledger — jadi kalau daftar ini terasa pendek,
 * memang begitu adanya di backend, bukan ada yang terlewat di sini.
 */
export function buildJournal(
  payments: { method: string; amount: number }[],
  total: number,
  shippingCost: number
): JournalRow[] {
  const rows: JournalRow[] = payments
    .filter(({ amount }) => amount > 0)
    .map(({ method, amount }) => ({
      type: 'D' as const,
      account: SALES_DEBIT_ACCOUNT[method] ?? method,
      amount,
    }));

  const salesAmount = total - shippingCost;
  if (salesAmount !== 0) rows.push({ type: 'K', account: 'Penjualan', amount: salesAmount });
  if (shippingCost > 0) rows.push({ type: 'K', account: 'Pendapatan Lain-Lain', amount: shippingCost });

  return rows;
}

/**
 * D dan K sendirian tidak menjelaskan apa pun bagi yang bukan orang akuntansi, dan
 * kolomnya terlalu sempit untuk kata penuh — jadi keterangannya lewat tooltip.
 */
function TypeBadge({ type }: { type: 'D' | 'K' }): JSX.Element {
  return (
    <Tippy content={type === 'D' ? 'Debit' : 'Kredit'} placement="top" delay={[350, 0]} offset={[0, 6]}>
      <span
        className={cn(
          'flex size-4 shrink-0 cursor-help items-center justify-center rounded-sm font-mono text-[9px] font-bold',
          type === 'D' ? 'bg-destructive-subtle text-destructive' : 'bg-success-subtle text-success'
        )}
      >
        {type}
      </span>
    </Tippy>
  );
}

/**
 * Jurnal untuk salesAmount ditulis SEKETIKA saat transaksi disimpan (dispatchSync),
 * bukan menunggu status naik seperti pembelian. Jadi kartu ini menggambarkan apa yang
 * terjadi tepat pada saat tombol simpan ditekan — bukan rencana yang masih bisa batal.
 */
export function JournalPreviewCard({
  payments,
  total,
  shippingCost,
}: {
  payments: { method: string; amount: number }[];
  total: number;
  shippingCost: number;
}): JSX.Element {
  const rows = buildJournal(payments, total, shippingCost);
  const debit = rows.filter((b) => b.type === 'D').reduce((t, b) => t + b.amount, 0);
  const credit = rows.filter((b) => b.type === 'K').reduce((t, b) => t + b.amount, 0);
  const balanced = debit === credit;

  return (
    <div className="flex flex-col gap-2.5 rounded-card border border-border bg-surface px-3.75 py-3.25 shadow-sm">
      <span className="text-base font-semibold">Preview jurnal</span>
      <span className="text-sm leading-[17px] text-foreground-muted">Ditulis setelah transaksi disimpan.</span>

      {rows.length === 0 && (
        <span className="-mt-1.5 text-sm leading-[17px] text-foreground-subtle">
          Tambahkan barang dan pembayarannya dulu.
        </span>
      )}

      <div className="flex flex-col">
        {rows.map((b) => (
          <div key={`${b.type}-${b.account}`} className="flex items-center gap-2 border-b border-border-subtle py-1.25">
            <TypeBadge type={b.type} />
            <span className="flex-1 text-sm">{b.account}</span>
            <span className="font-mono text-sm font-semibold tabular-nums">{formatNumber(b.amount)}</span>
          </div>
        ))}
      </div>

      <div className={cn('flex items-baseline justify-between text-sm', rows.length === 0 && 'hidden')}>
        <span className="text-foreground-muted">Balance</span>
        <span className={cn('font-mono font-semibold tabular-nums', balanced ? 'text-success' : 'text-destructive')}>
          {formatNumber(debit)} {balanced ? '=' : '≠'} {formatNumber(credit)}
        </span>
      </div>
    </div>
  );
}

export default JournalPreviewCard;
