import { Check } from 'lucide-react';
import React from 'react';

import { BarisGaji, formatAngka, jumlahkan } from '@/components/monthly-salary/rows';
import StatusGaji from '@/components/monthly-salary/StatusGaji';
import { Button } from '@/components/ui/button';
import Skeleton from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';

// Disalin PERSIS dari /customer dan /income-user-report.
const TH = 'border-b border-border px-2.5 pb-1.75 pt-2.25 text-xs font-bold text-foreground-subtle';
const TD = 'border-b border-border px-2.5 py-2 align-middle text-base';

const KOLOM = 7;

/** Nol ditulis "—": kolom Sisa yang penuh "0" membuat baris yang sudah selesai sama ramainya. */
function Angka({ nilai, nada, tebal }: { nilai: number; nada?: string; tebal?: boolean }): JSX.Element {
  if (nilai === 0) return <span className="font-mono tabular-nums text-foreground-subtle">—</span>;
  return (
    <span className={cn('font-mono tabular-nums', tebal ? 'font-bold' : 'font-semibold', nada)}>
      {formatAngka(nilai)}
    </span>
  );
}

/**
 * Daftar gaji satu bulan.
 *
 * Tiga kolom angka, bukan dua: Gaji, Sudah dibayar, dan SISA. Layar lama hanya punya dua
 * yang pertama, sehingga angka yang sebenarnya dicari — berapa yang masih harus
 * dikeluarkan untuk orang ini — harus dihitung di kepala, baris demi baris.
 *
 * Kaki tabelnya menjumlahkan HALAMAN INI saja, dan mengatakannya. Total satu bulan penuh
 * ada di kartu ringkasan di atas, yang memang diambil tanpa paginasi.
 */
export function SalaryTable({
  baris,
  loading,
  perPage,
  kosong,
  onBayar,
}: {
  baris: BarisGaji[];
  loading: boolean;
  perPage: number;
  kosong: React.ReactNode;
  onBayar: (baris: BarisGaji) => void;
}): JSX.Element {
  const total = jumlahkan(baris);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-surface-raised">
            <th scope="col" className={cn(TH, 'text-left')}>
              Nama
            </th>
            <th scope="col" style={{ width: '160px' }} className={cn(TH, 'text-left')}>
              Jabatan
            </th>
            <th scope="col" style={{ width: '130px' }} className={cn(TH, 'text-right')}>
              Gaji
            </th>
            <th scope="col" style={{ width: '140px' }} className={cn(TH, 'text-right')}>
              Sudah dibayar
            </th>
            <th scope="col" style={{ width: '130px' }} className={cn(TH, 'text-right')}>
              Sisa
            </th>
            <th scope="col" style={{ width: '180px' }} className={cn(TH, 'text-left')}>
              Status
            </th>
            <th scope="col" style={{ width: '96px' }} className={cn(TH, 'text-right')}>
              <span className="sr-only">Aksi</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {loading &&
            Array.from({ length: perPage }, (_, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <tr key={i}>
                {Array.from({ length: KOLOM }, (_, j) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <td key={j} className={TD}>
                    <div className="flex h-[26px] items-center">
                      <Skeleton className="h-3.5 w-full" />
                    </div>
                  </td>
                ))}
              </tr>
            ))}

          {!loading && baris.length === 0 && (
            <tr>
              <td colSpan={KOLOM} className="px-2.5 py-12 text-center">
                {kosong}
              </td>
            </tr>
          )}

          {!loading &&
            baris.map((b) => (
              <tr key={b.id} className="transition-colors duration-fast hover:bg-surface-raised">
                <td className={cn(TD, 'max-w-0')}>
                  <div className="flex items-center gap-2.25">
                    <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-accent-subtle text-2xs font-bold text-accent">
                      {(b.nama.trim()[0] ?? '?').toUpperCase()}
                    </span>
                    <span className="truncate font-medium" title={b.nama}>
                      {b.nama}
                    </span>
                  </div>
                </td>

                <td className={cn(TD, 'truncate text-foreground-muted')}>{b.jabatan || '—'}</td>

                <td className={cn(TD, 'whitespace-nowrap text-right')}>
                  <span className="font-mono font-medium tabular-nums">{formatAngka(b.gaji)}</span>
                </td>

                <td className={cn(TD, 'whitespace-nowrap text-right')}>
                  <Angka nilai={b.dibayar} nada="text-success" />
                </td>

                <td className={cn(TD, 'whitespace-nowrap text-right')}>
                  <Angka nilai={b.sisa} nada="text-destructive" tebal />
                </td>

                <td className={cn(TD, 'whitespace-nowrap')}>
                  <StatusGaji baris={b} />
                </td>

                <td className={cn(TD, 'text-right')}>
                  {b.sisa > 0 ? (
                    <Button size="xs" variant="outline" onClick={() => onBayar(b)}>
                      Bayar
                    </Button>
                  ) : (
                    <Check size={14} strokeWidth={2.2} className="ml-auto text-success" aria-label="Lunas" />
                  )}
                </td>
              </tr>
            ))}
        </tbody>

        {!loading && baris.length > 0 && (
          <tfoot>
            <tr className="bg-surface-raised">
              <td className="px-2.5 py-2 text-base font-bold" colSpan={2}>
                Halaman ini
                <span className="ml-1.5 font-mono text-sm font-normal text-foreground-subtle">{baris.length}</span>
              </td>
              <td className="whitespace-nowrap px-2.5 py-2 text-right">
                <Angka nilai={total.gaji} tebal />
              </td>
              <td className="whitespace-nowrap px-2.5 py-2 text-right">
                <Angka nilai={total.dibayar} nada="text-success" tebal />
              </td>
              <td className="whitespace-nowrap px-2.5 py-2 text-right">
                <Angka nilai={total.sisa} nada="text-destructive" tebal />
              </td>
              {/* Kolom Status dan Aksi tidak punya total. Sel kosong, bukan dihilangkan —
                  membuang selnya akan menggeser seluruh kaki tabel keluar dari kolomnya. */}
              {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
              <td className="px-2.5 py-2" colSpan={2} aria-hidden />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

export default SalaryTable;
