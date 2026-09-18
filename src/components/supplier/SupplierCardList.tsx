import dayjs from 'dayjs';
import { Pencil } from 'lucide-react';
import React from 'react';

import { inisial } from '@/components/customer/CustomerDetailSheet';
import { Button } from '@/components/ui/button';
import { RecordCard, RecordCardList } from '@/components/ui/record-card';
import { cn } from '@/lib/cn';
import { SupplierData } from '@/typings/supplier';
import { formatPhoneNumber } from '@/utils/format';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/** Daftar supplier di layar sempit. Peran tiap kolom dijelaskan di `RecordCard`. */
export function SupplierCardList({
  rows,
  loading,
  perPage,
  empty,
  onOpen,
  onEdit,
}: {
  rows?: SupplierData[];
  loading: boolean;
  perPage: number;
  empty: { judul: string; pesan: string };
  onOpen: (row: SupplierData) => void;
  onEdit: (row: SupplierData) => void;
}): JSX.Element {
  return (
    <RecordCardList loading={loading} count={perPage} empty={empty} isEmpty={rows?.length === 0}>
      {rows?.map((row) => {
        const utang = +(row.total_receivable ?? 0);

        return (
          <RecordCard
            key={row.id}
            ariaLabel={`Lihat ${row.name}`}
            onOpen={() => onOpen(row)}
            avatar={
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-2xs font-bold',
                  utang > 0 ? 'bg-accent-subtle text-accent' : 'bg-surface-raised text-foreground-subtle'
                )}
              >
                {inisial(row.name)}
              </span>
            }
            utama={row.name}
            pendamping={[
              // eslint-disable-next-line react/jsx-key
              <span className="font-mono">{formatPhoneNumber(row.phone_number) || '—'}</span>,
              row.address || '—',
            ]}
            nilaiLabel="Utang"
            nilai={utang > 0 ? formatNumber(utang) : '—'}
            nilaiTone={utang > 0 ? 'warning' : 'muted'}
            meta={dayjs(row.created_at).format('DD MMM YYYY')}
            aksi={
              <Button size="icon-xs" variant="ghost" aria-label={`Ubah ${row.name}`} onClick={() => onEdit(row)}>
                <Pencil strokeWidth={1.8} aria-hidden />
              </Button>
            }
          />
        );
      })}
    </RecordCardList>
  );
}

export default SupplierCardList;
