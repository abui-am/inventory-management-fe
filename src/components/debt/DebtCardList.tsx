import dayjs from 'dayjs';
import { Banknote } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RecordCard, RecordCardList } from '@/components/ui/record-card';
import { Datum } from '@/typings/debts';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/** Status tagihan: lunas, lewat jatuh tempo, atau masih berjalan. */
export const statusTagihan = (
  debt: Datum
): { label: string; variant: 'success' | 'destructive' | 'warning'; lewat: number } => {
  const lewat = debt.due_date && !debt.is_paid ? dayjs().diff(dayjs(debt.due_date), 'day') : 0;

  if (debt.is_paid) return { label: 'Lunas', variant: 'success', lewat: 0 };
  if (lewat > 0) return { label: 'Lewat tempo', variant: 'destructive', lewat };
  return { label: 'Belum lunas', variant: 'warning', lewat: 0 };
};

/**
 * Keterangan tagihan memuat kode transaksi ("Transaksi TRDO2609008"). Kodenya dibedakan
 * dengan huruf mono, sama seperti kode di tabel mana pun — angka dan huruf besar yang
 * berdempetan hampir tidak terbaca dengan huruf biasa.
 */
export const keteranganTagihan = (teks?: string | null): React.ReactNode => {
  if (!teks) return '—';
  return teks.split(/([A-Z]{2,}\d{4,})/).map((bagian, i) =>
    /^[A-Z]{2,}\d{4,}$/.test(bagian) ? (
      // eslint-disable-next-line react/no-array-index-key
      <span key={i} className="font-mono">
        {bagian}
      </span>
    ) : (
      bagian
    )
  );
};

/** Daftar tagihan di layar sempit. Peran tiap kolom dijelaskan di `RecordCard`. */
export function DebtCardList({
  rows,
  loading,
  perPage,
  empty,
  onPay,
}: {
  rows?: Datum[];
  loading: boolean;
  perPage: number;
  empty: { judul: string; pesan: string };
  onPay: (row: Datum) => void;
}): JSX.Element {
  return (
    <RecordCardList loading={loading} count={perPage} empty={empty} isEmpty={rows?.length === 0}>
      {rows?.map((row) => {
        const sisa = +(row.amount ?? 0) - +(row.paid_amount ?? 0);
        const status = statusTagihan(row);

        return (
          <RecordCard
            key={row.id}
            ariaLabel={`Terima piutang ${row.related_model?.name ?? ''}`}
            onOpen={() => (sisa > 0 ? onPay(row) : undefined)}
            redup={row.is_paid}
            utama={row.related_model?.name ?? '—'}
            pendamping={[
              keteranganTagihan(row.description),
              status.lewat > 0
                ? `Lewat ${status.lewat} hari`
                : `Jatuh tempo ${dayjs(row.due_date).format('DD MMM YYYY')}`,
            ]}
            nilaiLabel="Sisa"
            nilai={sisa > 0 ? formatNumber(sisa) : '—'}
            nilaiTone={sisa === 0 ? 'muted' : 'warning'}
            status={<Badge variant={status.variant}>{status.label}</Badge>}
            meta={dayjs(row.created_at).format('DD MMM YYYY')}
            aksi={
              sisa > 0 ? (
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Terima piutang"
                  className="hover:text-success"
                  onClick={() => onPay(row)}
                >
                  <Banknote strokeWidth={1.8} aria-hidden />
                </Button>
              ) : null
            }
          />
        );
      })}
    </RecordCardList>
  );
}

export default DebtCardList;
