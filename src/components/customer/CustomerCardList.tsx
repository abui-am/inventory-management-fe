import dayjs from 'dayjs';
import { Pencil } from 'lucide-react';
import React from 'react';

import { inisial } from '@/components/customer/CustomerDetailSheet';
import { Button } from '@/components/ui/button';
import { RecordCard, RecordCardList } from '@/components/ui/record-card';
import { cn } from '@/lib/cn';
import { CustomerData } from '@/typings/customer';
import { formatPhoneNumber } from '@/utils/format';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/** Daftar customer di layar sempit. Peran tiap kolom dijelaskan di `RecordCard`. */
export function CustomerCardList({
  rows,
  loading,
  perPage,
  empty,
  onOpen,
  onEdit,
}: {
  rows?: CustomerData[];
  loading: boolean;
  perPage: number;
  empty: { judul: string; pesan: string };
  onOpen: (row: CustomerData) => void;
  onEdit: (row: CustomerData) => void;
}): JSX.Element {
  return (
    <RecordCardList loading={loading} count={perPage} empty={empty} isEmpty={rows?.length === 0}>
      {rows?.map((row) => {
        const piutang = +(row.total_debt ?? 0);

        return (
          <RecordCard
            key={row.id}
            ariaLabel={`Lihat ${row.full_name}`}
            onOpen={() => onOpen(row)}
            avatar={
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-2xs font-bold',
                  piutang > 0 ? 'bg-accent-subtle text-accent' : 'bg-surface-raised text-foreground-subtle'
                )}
              >
                {inisial(row.full_name)}
              </span>
            }
            utama={row.full_name}
            pendamping={[
              // eslint-disable-next-line react/jsx-key
              <span className="font-mono">{formatPhoneNumber(row.phone_number) || '—'}</span>,
              row.address || '—',
            ]}
            nilaiLabel="Piutang"
            nilai={piutang > 0 ? formatNumber(piutang) : '—'}
            nilaiTone={piutang > 0 ? 'warning' : 'muted'}
            meta={dayjs(row.created_at).format('DD MMM YYYY')}
            aksi={
              <Button size="icon-xs" variant="ghost" aria-label={`Ubah ${row.full_name}`} onClick={() => onEdit(row)}>
                <Pencil strokeWidth={1.8} aria-hidden />
              </Button>
            }
          />
        );
      })}
    </RecordCardList>
  );
}

export default CustomerCardList;
