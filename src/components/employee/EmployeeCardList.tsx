import { Pencil, RotateCcw } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RecordCard, RecordCardList } from '@/components/ui/record-card';
import { EmployeeData } from '@/typings/employee';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/** Inisial dari nama depan dan belakang — dua huruf, sama dengan yang dipakai tabelnya. */
export function inisialKaryawan(depan?: string, belakang?: string): string {
  const huruf = [depan, belakang]
    .map((bagian) => bagian?.trim()?.[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('');
  return (huruf || '?').toUpperCase();
}

export function namaLengkap(row: EmployeeData): string {
  return `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim();
}

/**
 * Daftar karyawan di layar sempit.
 *
 * Gaji naik ke posisi "nilai" (kanan atas) karena itu satu-satunya angka di baris ini;
 * status akun turun jadi lencana. Untuk karyawan nonaktif gajinya sengaja tidak
 * ditampilkan — ia tidak ikut dibuatkan baris gaji bulan berikutnya, jadi angkanya akan
 * terbaca seperti tagihan yang masih berjalan.
 */
export function EmployeeCardList({
  rows,
  loading,
  perPage,
  empty,
  onOpen,
  onEdit,
  onReactivate,
}: {
  rows?: EmployeeData[];
  loading: boolean;
  perPage: number;
  empty: { judul: string; pesan: string };
  onOpen: (row: EmployeeData) => void;
  onEdit: (row: EmployeeData) => void;
  onReactivate: (row: EmployeeData) => void;
}): JSX.Element {
  return (
    <RecordCardList loading={loading} count={perPage} empty={empty} isEmpty={(rows?.length ?? 0) === 0}>
      {rows?.map((row) => {
        const nama = namaLengkap(row);
        const nonaktif = row.active === false;
        const gaji = +(row.salary ?? 0);

        return (
          <RecordCard
            key={row.id}
            ariaLabel={`Lihat ${nama}`}
            onOpen={() => onOpen(row)}
            redup={nonaktif}
            avatar={
              <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-accent-subtle text-2xs font-bold text-accent">
                {inisialKaryawan(row.first_name, row.last_name)}
              </span>
            }
            utama={nama}
            pendamping={[row.position || '—']}
            nilai={nonaktif || gaji === 0 ? '—' : formatNumber(gaji)}
            nilaiLabel={nonaktif ? undefined : 'Gaji per bulan'}
            nilaiTone={nonaktif || gaji === 0 ? 'muted' : 'default'}
            status={
              row.has_dashboard_account ? (
                <Badge variant="info">Akun login</Badge>
              ) : (
                <span className="text-2xs text-foreground-subtle">Belum punya akun</span>
              )
            }
            meta={nonaktif ? 'Nonaktif' : undefined}
            aksi={
              nonaktif ? (
                <Button size="xs" variant="outline" onClick={() => onReactivate(row)}>
                  <RotateCcw strokeWidth={1.9} aria-hidden /> Aktifkan
                </Button>
              ) : (
                <Button size="icon-xs" variant="ghost" aria-label={`Ubah ${nama}`} onClick={() => onEdit(row)}>
                  <Pencil strokeWidth={1.8} aria-hidden />
                </Button>
              )
            }
          />
        );
      })}
    </RecordCardList>
  );
}

export default EmployeeCardList;
