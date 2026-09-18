import dayjs from 'dayjs';
import { Pencil } from 'lucide-react';
import React from 'react';

import { sumPayments } from '@/components/stock-in/StockInTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Sheet from '@/components/ui/sheet';
import { BarisNilai, Seksi } from '@/components/ui/sheet-section';
import { useFetchDebt } from '@/hooks/query/useFetchDebt';
import useFetchSales from '@/hooks/query/useFetchSale';
import { CustomerData } from '@/typings/customer';
import { SalesResponse } from '@/typings/sale';
import { formatPhoneNumber } from '@/utils/format';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/** Inisial dari dua kata pertama, tanpa sapaan. "Ibu Sari Wulandari" → "SW". */
export const inisial = (nama = ''): string =>
  nama
    .replace(/^(ibu|bu|pak|bapak|mbak|mas)\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((kata) => kata[0] ?? '')
    .join('')
    .toUpperCase();

/**
 * Rincian customer sebagai sheet kanan.
 *
 * Modal lamanya hanya mengulang tiga kolom yang sudah terlihat di tabel — nama, nomor HP,
 * alamat — jadi membukanya tidak pernah menambah satu pun pengetahuan. Yang benar-benar
 * dibawa orang ke layar ini cuma satu pertanyaan: piutang segini datang dari mana.
 * Karena itu sheet ini menampilkan piutang yang belum lunas beserta transaksinya.
 */
export function CustomerDetailSheet({
  customer,
  open,
  onClose,
  onClosed,
  onEdit,
}: {
  customer: CustomerData;
  open: boolean;
  onClose: () => void;
  onClosed?: () => void;
  onEdit: () => void;
}): JSX.Element {
  // Dua permintaan tambahan, dan hanya saat sheet-nya terbuka.
  const { data: dataDebt } = useFetchDebt(
    {
      per_page: 20,
      where: { debtable_id: customer.id, is_paid: false },
      order_by: { due_date: 'asc' },
    },
    { enabled: open }
  );

  const { data: dataSales } = useFetchSales<SalesResponse>(
    {
      per_page: 5,
      where: { transactionable_id: customer.id },
      // Transaksi yang dibatalkan tidak ikut: barisnya di sini tidak punya lencana status,
      // jadi ia akan terbaca sebagai penjualan yang sah — dan `total`-nya dipakai sebagai
      // jumlah transaksi customer ini.
      where_not: { status: 'declined' },
      order_by: { created_at: 'desc' },
    },
    { enabled: open }
  );

  const utang = dataDebt?.data?.debts?.data ?? [];
  const transaksi = dataSales?.data?.transactions?.data ?? [];
  // Angka pasti, bukan panjang halaman: `total` datang dari pagination backend.
  const jumlahTransaksi = dataSales?.data?.transactions?.total;
  const terakhir = transaksi[0]?.created_at;

  const piutang = +(customer.total_debt ?? 0);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      onClosed={onClosed}
      width="w-[420px]"
      // Tanggal terdaftar ikut MASUK ke judul, bukan lewat `subtitle`: subtitle merentang
      // sepanjang kepala sheet, jadi ia jatuh di bawah avatar dan menempel ke tepinya.
      // Di dalam judul ia sejajar di bawah nama, dan tingginya tetap 48px.
      title={
        <span className="flex min-w-0 items-center gap-2.25">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-xs font-bold text-accent">
            {inisial(customer.full_name)}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="flex items-center gap-2">
              <span className="truncate text-lg font-semibold leading-tight">{customer.full_name}</span>
              {piutang > 0 ? <Badge variant="warning">Punya piutang</Badge> : <Badge variant="success">Lunas</Badge>}
            </span>
            <span className="text-xs leading-tight text-foreground-subtle">
              Terdaftar {dayjs(customer.created_at).format('DD MMM YYYY')}
            </span>
          </span>
        </span>
      }
      actions={
        <Button size="icon-xs" variant="ghost" aria-label="Ubah customer" tooltip="Ubah" onClick={onEdit}>
          <Pencil strokeWidth={1.8} aria-hidden />
        </Button>
      }
      footer={
        <div className="flex flex-shrink-0 items-center justify-between border-t border-border bg-surface-raised px-4 py-2 text-xs text-foreground-subtle">
          <span>Terakhir diubah</span>
          <span className="font-mono">{dayjs(customer.updated_at).format('DD/MM/YYYY')}</span>
        </div>
      }
    >
      {/* SPEC-11 */}
      <div className="border-b border-border-subtle px-4 py-3.25">
        <div className="text-xs text-foreground-subtle">Piutang berjalan</div>
        <div
          className={`mt-0.5 font-mono text-xl font-bold tracking-[-0.02em] ${
            piutang > 0 ? 'text-warning' : 'text-foreground'
          }`}
        >
          Rp {formatNumber(piutang)}
        </div>

        <div className="mt-2.25 flex gap-4.5">
          <div>
            <div className="text-xs text-foreground-subtle">Transaksi</div>
            <div className="font-mono font-semibold tabular-nums">{jumlahTransaksi ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs text-foreground-subtle">Terakhir beli</div>
            <div className="font-mono font-semibold">{terakhir ? dayjs(terakhir).format('DD MMM') : '—'}</div>
          </div>
        </div>
      </div>

      {/* SPEC-12 */}
      <Seksi title="Kontak">
        <div className="flex flex-col gap-0.75">
          <BarisNilai label="Nomor HP" value={formatPhoneNumber(customer.phone_number) || '—'} />
          <div className="flex items-start justify-between gap-3 text-sm">
            <span className="shrink-0 text-foreground-muted">Alamat</span>
            <span className="text-right">{customer.address || '—'}</span>
          </div>
        </div>
      </Seksi>

      {/* SPEC-13: inilah jawaban dari "piutang segini datang dari mana". */}
      {utang.length > 0 && (
        <Seksi title="Piutang belum lunas" count={utang.length}>
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

      {/* SPEC-14 */}
      <Seksi title="Transaksi terakhir" count={transaksi.length}>
        {transaksi.length === 0 ? (
          <p className="text-sm text-foreground-subtle">Belum pernah bertransaksi.</p>
        ) : (
          <div className="flex flex-col gap-1.75">
            {transaksi.map((row) => (
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

export default CustomerDetailSheet;
