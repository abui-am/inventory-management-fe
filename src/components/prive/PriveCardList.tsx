import dayjs from 'dayjs';
import React from 'react';

import { SumberDana } from '@/components/expense/ExpenseCardList';
import { RecordCard, RecordCardList } from '@/components/ui/record-card';
import { Datum } from '@/typings/prives';
import { formatNumber } from '@/utils/format';

/**
 * Daftar prive di layar sempit. Keterangan jadi judul kartu — itu satu-satunya yang
 * membedakan satu penarikan dari penarikan lain; tanggal dan pencatatnya jadi pendamping.
 */
export function PriveCardList({
  rows,
  loading,
  perPage,
  empty,
}: {
  rows?: Datum[];
  loading: boolean;
  perPage: number;
  empty: { judul: string; pesan: string };
}): JSX.Element {
  return (
    <RecordCardList loading={loading} count={perPage} empty={empty} isEmpty={(rows?.length ?? 0) === 0}>
      {rows?.map((row) => (
        <RecordCard
          key={row.id}
          utama={row.description || '—'}
          pendamping={[
            `${dayjs(row.prive_date).format('DD MMM YYYY')}${row.user?.username ? ` · ${row.user.username}` : ''}`,
          ]}
          nilai={formatNumber(+(row.amount ?? 0))}
          nilaiLabel="Diambil"
          status={<SumberDana metode={row.transaction_method} />}
        />
      ))}
    </RecordCardList>
  );
}

export default PriveCardList;
