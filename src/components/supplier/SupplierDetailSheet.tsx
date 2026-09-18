import dayjs from 'dayjs';
import { Pencil } from 'lucide-react';
import React from 'react';

import { inisial } from '@/components/customer/CustomerDetailSheet';
import { sumPayments } from '@/components/stock-in/StockInTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Sheet from '@/components/ui/sheet';
import { BarisNilai, Seksi } from '@/components/ui/sheet-section';
import { useFetchDebt } from '@/hooks/query/useFetchDebt';
import useFetchTransactions from '@/hooks/query/useFetchStockIn';
import { SupplierData } from '@/typings/supplier';
import { formatPhoneNumber } from '@/utils/format';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/**
 * Rincian supplier sebagai sheet kanan.
 *
 * Cermin dari rincian customer: yang di sana piutang, di sini utang. Modal lamanya hanya
 * mengulang tiga kolom yang sudah terlihat di tabel — nama, nomor HP, alamat — jadi
 * membukanya tidak pernah menambah satu pun pengetahuan.
 */
export function SupplierDetailSheet({
  supplier,
  open,
  onClose,
  onClosed,
  onEdit,
}: {
  supplier: SupplierData;
  open: boolean;
  onClose: () => void;
  onClosed?: () => void;
  onEdit: () => void;
}): JSX.Element {
  // Dua permintaan tambahan, dan hanya saat sheet-nya terbuka.
  const { data: dataDebt } = useFetchDebt(
    { per_page: 20, where: { debtable_id: supplier.id, is_paid: false }, order_by: { due_date: 'asc' } },
    { enabled: open }
  );

  const { data: dataMasuk } = useFetchTransactions(
    {
      per_page: 5,
      where: { transactionable_id: supplier.id },
      // Sama seperti rincian customer: barang masuk yang ditolak tidak ditampilkan maupun
      // dihitung, karena barisnya tidak menyebutkan statusnya.
      where_not: { status: 'declined' },
      order_by: { created_at: 'desc' },
    },
    { enabled: open }
  );

  const utang = dataDebt?.data?.debts?.data ?? [];
  const masuk = dataMasuk?.data?.transactions?.data ?? [];
  const jumlahMasuk = dataMasuk?.data?.transactions?.total;
  const terakhir = masuk[0]?.created_at;

  const berjalan = +(supplier.total_receivable ?? 0);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      onClosed={onClosed}
      width="w-[420px]"
      title={
        <span className="flex min-w-0 items-center gap-2.25">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-xs font-bold text-accent">
            {inisial(supplier.name)}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="flex items-center gap-2">
              <span className="truncate text-lg font-semibold leading-tight">{supplier.name}</span>
              {berjalan > 0 ? <Badge variant="warning">Punya utang</Badge> : <Badge variant="success">Lunas</Badge>}
            </span>
            <span className="text-xs leading-tight text-foreground-subtle">
              Terdaftar {dayjs(supplier.created_at).format('DD MMM YYYY')}
            </span>
          </span>
        </span>
      }
      actions={
        <Button size="icon-xs" variant="ghost" aria-label="Ubah supplier" tooltip="Ubah" onClick={onEdit}>
          <Pencil strokeWidth={1.8} aria-hidden />
        </Button>
      }
      footer={
        <div className="flex flex-shrink-0 items-center justify-between border-t border-border bg-surface-raised px-4 py-2 text-xs text-foreground-subtle">
          <span>Terakhir diubah</span>
          <span className="font-mono">{dayjs(supplier.updated_at).format('DD/MM/YYYY')}</span>
        </div>
      }
    >
      <div className="border-b border-border-subtle px-4 py-3.25">
        <div className="text-xs text-foreground-subtle">Utang berjalan</div>
        <div
          className={`mt-0.5 font-mono text-xl font-bold tracking-[-0.02em] ${
            berjalan > 0 ? 'text-warning' : 'text-foreground'
          }`}
        >
          Rp {formatNumber(berjalan)}
        </div>

        <div className="mt-2.25 flex gap-4.5">
          <div>
            <div className="text-xs text-foreground-subtle">Barang masuk</div>
            <div className="font-mono font-semibold tabular-nums">{jumlahMasuk ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs text-foreground-subtle">Terakhir kirim</div>
            <div className="font-mono font-semibold">{terakhir ? dayjs(terakhir).format('DD MMM') : '—'}</div>
          </div>
        </div>
      </div>

      <Seksi title="Kontak">
        <div className="flex flex-col gap-0.75">
          <BarisNilai label="Nomor HP" value={formatPhoneNumber(supplier.phone_number) || '—'} />
          <div className="flex items-start justify-between gap-3 text-sm">
            <span className="shrink-0 text-foreground-muted">Alamat</span>
            <span className="text-right">{supplier.address || '—'}</span>
          </div>
        </div>
      </Seksi>

      {/* Inilah jawaban dari "utang segini datang dari mana". */}
      {utang.length > 0 && (
        <Seksi title="Utang belum lunas" count={utang.length}>
          <div className="flex flex-col gap-1.75">
            {utang.map((baris) => {
              const jatuhTempo = dayjs(baris.due_date);
              const lewat = jatuhTempo.isBefore(dayjs(), 'day');
              const sisa = +(baris.amount ?? 0) - +(baris.paid_amount ?? 0);

              return (
                <div key={baris.id} className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-mono text-sm">{baris.description || '—'}</div>
                    <div className={`text-xs ${lewat ? 'text-destructive' : 'text-foreground-subtle'}`}>
                      {lewat
                        ? `Lewat ${dayjs().diff(jatuhTempo, 'day')} hari`
                        : `Jatuh tempo ${jatuhTempo.format('DD MMM YYYY')}`}
                    </div>
                  </div>
                  <span className="whitespace-nowrap font-mono text-base font-semibold tabular-nums">
                    {formatNumber(sisa)}
                  </span>
                </div>
              );
            })}
          </div>
        </Seksi>
      )}

      <Seksi title="Barang masuk terakhir" count={masuk.length}>
        {masuk.length === 0 ? (
          <p className="text-sm text-foreground-subtle">Belum pernah mengirim barang.</p>
        ) : (
          <div className="flex flex-col gap-1.75">
            {masuk.map((row) => (
              <div key={row.id} className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-mono text-sm">{row.transaction_code}</div>
                  <div className="text-xs text-foreground-subtle">
                    {dayjs(row.created_at).format('DD MMM YYYY')} · {row.items?.length ?? 0} barang
                  </div>
                </div>
                <span className="whitespace-nowrap font-mono text-base font-semibold tabular-nums">
                  {formatNumber(sumPayments(row.payments))}
                </span>
              </div>
            ))}
          </div>
        )}
      </Seksi>
    </Sheet>
  );
}

export default SupplierDetailSheet;
