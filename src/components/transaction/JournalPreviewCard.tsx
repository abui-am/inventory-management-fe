import Tippy from '@tippyjs/react';

import { PURCHASE_CREDIT_ACCOUNT, SALES_DEBIT_ACCOUNT } from '@/constants/options';
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
 * Jurnal yang akan ditulis backend untuk satu BARANG MASUK.
 *
 * Diturunkan dari TransactionObserver::updated cabang `on-review`, bukan dikarang:
 * debit Persediaan sebesar total dikurangi ongkos kirim, debit Beban sebesar ongkos
 * kirimnya, lalu satu baris kredit per pembayaran (Kas/Bank/Utang/Giro).
 *
 * Arahnya kebalikan penjualan: di sini pembayaran DIKREDIT, karena ia mengurangi kas
 * atau menambah utang, bukan menambah piutang.
 */
export function buildPurchaseJournal(
  payments: { method: string; amount: number }[],
  total: number,
  shippingCost: number
): JournalRow[] {
  const rows: JournalRow[] = [];

  const inventory = total - shippingCost;
  if (inventory !== 0) rows.push({ type: 'D', account: 'Persediaan', amount: inventory });
  if (shippingCost > 0) rows.push({ type: 'D', account: 'Beban Ongkos Kirim', amount: shippingCost });

  payments
    .filter(({ amount }) => amount > 0)
    .forEach(({ method, amount }) => {
      rows.push({ type: 'K', account: PURCHASE_CREDIT_ACCOUNT[method] ?? method, amount });
    });

  return rows;
}

/**
 * Jurnal yang akan ditulis backend untuk RETUR barang masuk.
 *
 * Diturunkan dari TransactionRepository::returnItems: kredit Persediaan sebesar nilai
 * barang yang dikembalikan, lalu debit ke akun-akun pembayaran transaksi itu, dibagi
 * PROPORSIONAL menurut besar tiap pembayaran.
 *
 * Yang tidak bisa ditiru di sini: bagian Utang/Giro yang tagihannya sudah lunas dialihkan
 * backend ke Kas, dan sisa tagihannya hanya diketahui server. Preview ini karena itu
 * menampilkan niatnya — akun asal pembayarannya — bukan hasil akhirnya baris per baris.
 *
 * `shippingCost` sengaja tidak ada di daftar parameter: ongkos kirim tidak pernah ikut
 * diretur.
 */
export function buildReturnJournal(
  payments: { method: string; amount: number }[],
  totalPaid: number,
  returnValue: number
): JournalRow[] {
  if (returnValue <= 0) return [];

  const rows: JournalRow[] = [{ type: 'K', account: 'Persediaan', amount: returnValue }];

  if (totalPaid <= 0) {
    rows.push({ type: 'D', account: 'Kas', amount: returnValue });
    return rows;
  }

  const dipakai = payments.filter(({ amount }) => amount > 0);
  let terbagi = 0;

  dipakai.forEach(({ method, amount }, i) => {
    // Pembayaran terakhir menerima SISANYA, bukan hasil pembulatannya sendiri — sama
    // seperti di backend, supaya debit dan kreditnya tidak meleset satu rupiah.
    const bagian = i === dipakai.length - 1 ? returnValue - terbagi : Math.round(returnValue * (amount / totalPaid));
    terbagi += bagian;
    if (bagian > 0) rows.push({ type: 'D', account: PURCHASE_CREDIT_ACCOUNT[method] ?? method, amount: bagian });
  });

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
 *
 * Pada `variant="purchase"` justru sebaliknya: barang masuk disimpan sebagai Menunggu
 * dan jurnalnya baru ditulis saat statusnya naik ke Ditinjau, jadi kartunya menggambarkan
 * rencana — dan keterangannya mengatakan itu.
 */
export function JournalPreviewCard({
  payments,
  total,
  shippingCost,
  variant = 'sale',
}: {
  payments: { method: string; amount: number }[];
  total: number;
  shippingCost: number;
  /** `purchase` untuk barang masuk — jurnalnya lain, dan saat penulisannya juga lain. */
  variant?: 'sale' | 'purchase';
}): JSX.Element {
  const purchase = variant === 'purchase';
  const rows = purchase
    ? buildPurchaseJournal(payments, total, shippingCost)
    : buildJournal(payments, total, shippingCost);
  const debit = rows.filter((b) => b.type === 'D').reduce((t, b) => t + b.amount, 0);
  const credit = rows.filter((b) => b.type === 'K').reduce((t, b) => t + b.amount, 0);
  const balanced = debit === credit;

  return (
    <div className="flex flex-col gap-2.5 rounded-card border border-border bg-surface px-3.75 py-3.25 shadow-sm">
      <span className="text-base font-semibold">Preview jurnal</span>
      <span className="text-sm leading-[17px] text-foreground-muted">
        {purchase ? 'Ditulis saat status naik ke Ditinjau.' : 'Ditulis setelah transaksi disimpan.'}
      </span>

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
