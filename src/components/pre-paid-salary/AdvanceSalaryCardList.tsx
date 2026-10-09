import dayjs from 'dayjs';
import React from 'react';

import { inisialKaryawan } from '@/components/employee/EmployeeCardList';
import { Badge } from '@/components/ui/badge';
import { RecordCard, RecordCardList } from '@/components/ui/record-card';
import { Datum } from '@/typings/advance-payrolls';
import { formatNumber } from '@/utils/format';

/** Daftar gaji di muka di layar sempit; sisa gaji bulan itu turun ke kaki kartu. */
export function AdvanceSalaryCardList({
  rows,
  loading,
  perPage,
  empty,
  sisaGaji,
}: {
  rows?: Datum[];
  loading: boolean;
  perPage: number;
  empty: { judul: string; pesan: string };
  /** `undefined` selama daftar gaji karyawan belum datang — bukan 0, supaya tidak berbohong. */
  sisaGaji: (row: Datum) => number | undefined;
}): JSX.Element {
  return (
    <RecordCardList loading={loading} count={perPage} empty={empty} isEmpty={(rows?.length ?? 0) === 0}>
      {rows?.map((row) => {
        const nama = `${row.employee?.first_name ?? ''} ${row.employee?.last_name ?? ''}`.trim();
        const sisa = sisaGaji(row);

        return (
          <RecordCard
            key={row.id}
            avatar={
              <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-accent-subtle text-2xs font-bold text-accent">
                {inisialKaryawan(row.employee?.first_name, row.employee?.last_name)}
              </span>
            }
            utama={nama || '—'}
            pendamping={[
              `${row.employee_position || 'Tanpa jabatan'} · dibayar ${dayjs(row.created_at).format('DD MMM YYYY')}`,
            ]}
            nilai={formatNumber(+(row.amount ?? 0))}
            nilaiLabel="Di muka"
            status={<Badge variant="neutral">{dayjs(row.payroll_month).format('MMM YYYY')}</Badge>}
            meta={sisa === undefined ? undefined : `Sisa ${formatNumber(sisa)}`}
          />
        );
      })}
    </RecordCardList>
  );
}

export default AdvanceSalaryCardList;
