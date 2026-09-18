import dayjs from 'dayjs';
import { ArrowLeftRight, Banknote, BookOpen, Check, ChevronRight, Receipt, ShoppingCart, Wallet } from 'lucide-react';

import { GOLONGAN, golonganAkun } from '@/components/ledger/accounts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Sheet from '@/components/ui/sheet';
import Skeleton from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { Datum, LedgerSource } from '@/typings/ledgers';
import { formatNumber } from '@/utils/format';

const TH = 'border-b border-border px-0 pb-1.75 pt-0 text-xs font-bold text-foreground-subtle';
const TD = 'border-b border-border px-0 py-2 align-middle text-base';

/**
 * Kalimat yang menjelaskan ayatnya dalam bahasa sehari-hari, per jenis dokumen asal.
 *
 * Halaman ini dipakai pemilik toko, bukan akuntan. Tanpa kalimat ini, lima baris debit
 * dan kredit hanya bisa dibaca orang yang sudah paham pembukuan berpasangan.
 */
/**
 * `transactions` menampung DUA hal yang jurnalnya berbeda: penjualan ke customer dan
 * barang masuk dari supplier. Penjelasan penjualan dipakai sebagai bawaan karena itu yang
 * paling sering dibuka dari Jurnal Umum; pemanggil dari halaman barang masuk mengirim
 * penjelasannya sendiri lewat prop `explanation`.
 */
const PENJELASAN: Record<LedgerSource['type'], string> = {
  transactions:
    'Satu penjualan menulis dua pasang baris: harga jualnya masuk ke Kas, Piutang, atau Utang lalu dicatat sebagai Penjualan, dan harga belinya keluar dari Persediaan lalu dicatat sebagai Harga Pokok Penjualan.',
  expenses: 'Beban menambah catatan pengeluaran dan mengurangi Kas atau Bank, tergantung cara bayarnya.',
  prives:
    'Prive adalah uang yang diambil pemilik untuk keperluan pribadi — ia mengurangi Kas dan modal, bukan beban toko.',
  debts:
    'Pembayaran utang atau penerimaan piutang memindahkan uang antara Kas dan catatan utang-piutangnya, tanpa menambah penjualan atau beban baru.',
  ledger_top_ups:
    'Konversi saldo memindahkan uang antar akun — misalnya dari Kas ke Bank — tanpa menambah atau mengurangi total harta.',
  capital_reports:
    'Tutup buku memindahkan laba periode ini ke modal, lalu mengosongkan akun pendapatan dan beban untuk periode berikutnya.',
};

/**
 * Ikon dan warna per jenis dokumen asal.
 *
 * Kelasnya ditulis utuh, bukan dirangkai (`bg-${warna}-subtle`): pemindai Tailwind
 * membaca berkas sumber sebagai teks dan tidak pernah melihat nama kelas yang disusun
 * saat runtime — kelas begitu tidak pernah jadi CSS.
 */
const IKON_SUMBER: Record<LedgerSource['type'], { Icon: typeof ShoppingCart; kelas: string }> = {
  transactions: { Icon: ShoppingCart, kelas: 'bg-success-subtle text-success' },
  expenses: { Icon: Receipt, kelas: 'bg-destructive-subtle text-destructive' },
  prives: { Icon: Wallet, kelas: 'bg-accent-subtle text-accent' },
  debts: { Icon: Banknote, kelas: 'bg-warning-subtle text-warning' },
  ledger_top_ups: { Icon: ArrowLeftRight, kelas: 'bg-info-subtle text-info' },
  capital_reports: { Icon: BookOpen, kelas: 'bg-surface-raised text-foreground-muted' },
};

const JUDUL_SUMBER: Record<LedgerSource['type'], string> = {
  transactions: 'Transaksi',
  expenses: 'Beban',
  prives: 'Prive',
  debts: 'Utang / piutang',
  ledger_top_ups: 'Konversi saldo',
  capital_reports: 'Tutup buku',
};

export function JournalEntrySheet({
  source,
  rows,
  total,
  open,
  onClose,
  onClosed,
  onOpenSource,
  explanation,
}: {
  source: LedgerSource;
  /** Seluruh baris yang berbagi `ledgerable_id` — `undefined` selagi diambil. */
  rows?: Datum[];
  total?: { debit: number; credit: number; difference: number };
  open: boolean;
  onClose: () => void;
  onClosed?: () => void;
  /** `undefined` kalau dokumen asalnya belum punya halaman rincian sendiri. */
  onOpenSource?: () => void;
  /** Menimpa penjelasan bawaan — lihat catatan di atas PENJELASAN. */
  explanation?: string;
}): JSX.Element {
  const waktu = rows?.length ? dayjs(rows[0].created_at).format('DD MMM YYYY · HH:mm') : undefined;
  const balance = total ? total.difference === 0 : undefined;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      onClosed={onClosed}
      width="w-[420px]"
      title={<span className="truncate text-lg font-semibold">Ayat jurnal</span>}
      subtitle={waktu ?? <Skeleton className="mt-0.5 h-3.5 w-32" />}
    >
      <div className="flex flex-col gap-3 px-4 py-3.5">
        {/* Terbentuk dari — inilah jawaban "jurnal ini datang dari mana". */}
        <div className="flex flex-col gap-1.75 rounded-group border border-border px-3 py-2.5">
          <span className="text-xs font-bold text-foreground-subtle">Terbentuk dari</span>
          <div className="flex items-center gap-2.25">
            {/* Ikonnya menjawab "ini dari mana" sebelum kodenya sempat dibaca — penjualan,
                beban, prive, dan tutup buku terbedakan sekilas. */}
            <span
              className={cn(
                'flex size-[26px] shrink-0 items-center justify-center rounded-control',
                IKON_SUMBER[source.type].kelas
              )}
              aria-hidden
            >
              {(() => {
                const { Icon } = IKON_SUMBER[source.type];
                return <Icon size={14} strokeWidth={1.8} />;
              })()}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-mono text-sm font-semibold">
                {source.code ?? JUDUL_SUMBER[source.type]}
              </span>
              {source.label && <span className="truncate text-xs text-foreground-subtle">{source.label}</span>}
            </div>
            {onOpenSource && (
              <Button size="xs" variant="outline" className="ml-auto shrink-0" onClick={onOpenSource}>
                Buka
                <ChevronRight strokeWidth={2} aria-hidden />
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.75">
          <span className="text-xs font-bold text-foreground-subtle">
            {rows ? `${rows.length} baris buku besar` : 'Baris buku besar'}
          </span>

          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th scope="col" className={cn(TH, 'text-left')}>
                  Akun
                </th>
                <th scope="col" className={cn(TH, 'text-right')}>
                  Debit
                </th>
                <th scope="col" className={cn(TH, 'text-right')}>
                  Kredit
                </th>
              </tr>
            </thead>
            <tbody>
              {!rows &&
                // Empat baris: ayat penjualan — bentuk yang paling sering muncul —
                // menulis empat baris, jadi kartunya tidak melonjak saat data tiba.
                Array.from({ length: 4 }, (_, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <tr key={i}>
                    <td className={cn(TD, 'h-[37px] py-0')}>
                      <Skeleton className="h-5 w-24" />
                    </td>
                    <td className={cn(TD, 'h-[37px] py-0')}>
                      <Skeleton className="ml-auto h-[18px] w-16" />
                    </td>
                    <td className={cn(TD, 'h-[37px] py-0')}>
                      <Skeleton className="ml-auto h-[18px] w-16" />
                    </td>
                  </tr>
                ))}

              {rows?.map((row) => {
                const debit = row.type === 'debit' ? row.amount : null;
                const kredit = row.type === 'credit' ? row.amount : null;
                return (
                  <tr key={row.id}>
                    <td className={TD}>
                      <Badge variant={GOLONGAN[golonganAkun(row.description, source.type)].variant}>
                        {row.description}
                      </Badge>
                    </td>
                    <td
                      className={cn(
                        TD,
                        'text-right font-mono tabular-nums',
                        debit === null ? 'text-foreground-subtle' : 'font-semibold'
                      )}
                    >
                      {debit === null ? '—' : formatNumber(debit)}
                    </td>
                    <td
                      className={cn(
                        TD,
                        'text-right font-mono tabular-nums',
                        kredit === null ? 'text-foreground-subtle' : 'font-semibold'
                      )}
                    >
                      {kredit === null ? '—' : formatNumber(kredit)}
                    </td>
                  </tr>
                );
              })}

              {total && (
                <tr>
                  <td className={cn(TD, 'border-b-0 font-semibold')}>Total</td>
                  <td className={cn(TD, 'border-b-0 text-right font-mono font-bold tabular-nums')}>
                    {formatNumber(total.debit)}
                  </td>
                  <td className={cn(TD, 'border-b-0 text-right font-mono font-bold tabular-nums')}>
                    {formatNumber(total.credit)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {balance !== undefined && (
            <div
              className={cn(
                'flex items-center justify-between gap-2 rounded-control px-2.5 py-1.5',
                balance ? 'bg-success-subtle' : 'bg-warning-subtle'
              )}
            >
              <span className={cn('flex items-center gap-1.5 text-sm', balance ? 'text-success' : 'text-warning')}>
                {balance && <Check size={12} strokeWidth={2.6} aria-hidden />}
                {balance ? 'Debit dan kredit sama besar' : 'Debit dan kredit tidak sama'}
              </span>
              <span className={cn('font-mono text-sm font-semibold', balance ? 'text-success' : 'text-warning')}>
                {balance ? 'Balance' : formatNumber(total?.difference ?? 0)}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.25">
          <span className="text-xs font-bold text-foreground-subtle">Penjelasan</span>
          <p className="text-sm leading-relaxed text-foreground-muted">{explanation ?? PENJELASAN[source.type]}</p>
        </div>
      </div>
    </Sheet>
  );
}

export default JournalEntrySheet;
