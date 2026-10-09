import dayjs from 'dayjs';
import { AlertTriangle, ArrowLeft, Users } from 'lucide-react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { useMemo, useState } from 'react';

import Modal from '@/components/Modal';
import { formatAngka } from '@/components/monthly-salary/rows';
import Pagination from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import { DialogDivider, DialogHeading, DialogRow } from '@/components/ui/dialog-summary';
import Kpi from '@/components/ui/kpi';
import Skeleton from '@/components/ui/skeleton';
import { useCreateSalary } from '@/hooks/mutation/useMutateSalary';
import { useFetchPreviewSalary } from '@/hooks/query/useFetchPreviewSalary';
import { cn } from '@/lib/cn';
import { ThemeablePage } from '@/typings/page';
import { formatDateYYYYMM } from '@/utils/format';
import reportError from '@/utils/reportError';

const TH = 'border-b border-border px-2.5 pb-1.75 pt-2.25 text-xs font-bold text-foreground-subtle';
const TD = 'border-b border-border px-2.5 py-2 align-middle text-base';

/**
 * Preview daftar gaji sebelum dibuat.
 *
 * Tombolnya dulu langsung membuka modal bertuliskan "Konfirmasi" tanpa menyebutkan apa
 * pun tentang apa yang terjadi. Yang sebenarnya terjadi di
 * `PayrollRepository::create()` adalah `delete()` atas SELURUH payroll bulan itu sebelum
 * menyusunnya ulang — jadi kalau daftarnya sudah pernah dibuat, pembayaran yang sudah
 * tercatat ikut terhapus. Itu yang kini dikatakan di dialognya.
 */
const PreviewSalaryPage: NextPage & ThemeablePage = () => {
  const router = useRouter();
  const tanggal = router.query.date ? new Date(router.query.date as string) : new Date();
  const bulanTeks = dayjs(tanggal).format('MMMM YYYY');

  const [pageSize, setPageSize] = useState(10);
  const [paginationUrl, setPaginationUrl] = useState('');
  const [konfirmasi, setKonfirmasi] = useState(false);

  const { mutateAsync, isLoading: menyimpan } = useCreateSalary();

  const { data, isLoading } = useFetchPreviewSalary({
    per_page: pageSize,
    where_payroll_month: formatDateYYYYMM(tanggal),
    paginated: true,
    forceUrl: paginationUrl || undefined,
  });

  const {
    data: rows = [],
    from,
    to,
    total,
    links,
    next_page_url: berikutnya,
    prev_page_url: sebelumnya,
  } = data?.data?.employees ?? {};

  /**
   * Total gaji dihitung dari HALAMAN INI, dan dikatakan begitu di labelnya.
   * `POST /payrolls/preview` tidak mengirim jumlah keseluruhan, dan menarik semua halaman
   * hanya untuk satu angka ringkasan bukan harga yang sepadan.
   */
  const gajiHalaman = useMemo(() => rows.reduce((jumlah, e) => jumlah + +(e.salary ?? 0), 0), [rows]);

  const buat = async () => {
    try {
      await mutateAsync({ month: formatDateYYYYMM(tanggal) });
      setKonfirmasi(false);
      router.push(`/monthly-salary?date=${tanggal.toISOString()}`);
    } catch (e) {
      reportError(e, { action: 'monthly-salary/create' });
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="min-w-0">
          <h1 className="text-lg font-bold">Preview daftar gaji {bulanTeks}</h1>
          <p className="mt-0.5 text-sm text-foreground-subtle">
            Gaji dan jabatan tiap karyawan aktif disalin ke daftar bulan ini. Perubahan gaji sesudahnya tidak ikut
            berubah di daftar yang sudah jadi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.75">
          <Button size="sm" variant="outline" onClick={() => router.push('/monthly-salary')}>
            <ArrowLeft strokeWidth={1.9} aria-hidden /> Kembali
          </Button>
          <Button size="sm" disabled={isLoading || rows.length === 0} onClick={() => setKonfirmasi(true)}>
            Buat daftar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Kpi label="Karyawan aktif" nilai={isLoading ? undefined : total ?? 0} ket="yang nonaktif tidak ikut" />
        <Kpi
          label="Gaji di halaman ini"
          nilai={isLoading ? undefined : gajiHalaman}
          ket={`${rows.length} dari ${total ?? 0} orang`}
        />
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-raised">
                <th scope="col" className={cn(TH, 'text-left')}>
                  Nama
                </th>
                <th scope="col" style={{ width: '200px' }} className={cn(TH, 'text-left')}>
                  Jabatan
                </th>
                <th scope="col" style={{ width: '160px' }} className={cn(TH, 'text-right')}>
                  Gaji per bulan
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading &&
                Array.from({ length: pageSize }, (_, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <tr key={i}>
                    {Array.from({ length: 3 }, (_, j) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <td key={j} className={TD}>
                        <div className="flex h-[26px] items-center">
                          <Skeleton className="h-3.5 w-full" />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}

              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-2.5 py-12 text-center">
                    <div className="flex flex-col items-center gap-1.75">
                      <Users size={26} strokeWidth={1.6} className="text-foreground-subtle" aria-hidden />
                      <p className="text-base font-semibold">Tidak ada karyawan aktif</p>
                      <p className="max-w-[340px] text-sm text-foreground-muted">
                        Daftar gaji hanya mengambil karyawan yang berstatus aktif. Aktifkan dulu orangnya di halaman
                        Karyawan.
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading &&
                rows.map((e) => {
                  const nama = `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim();
                  return (
                    <tr key={e.id} className="transition-colors duration-fast hover:bg-surface-raised">
                      <td className={cn(TD, 'max-w-0')}>
                        <div className="flex items-center gap-2.25">
                          <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-accent-subtle text-2xs font-bold text-accent">
                            {(nama.trim()[0] ?? '?').toUpperCase()}
                          </span>
                          <span className="truncate font-medium" title={nama}>
                            {nama}
                          </span>
                        </div>
                      </td>
                      <td className={cn(TD, 'truncate text-foreground-muted')}>{e.position || '—'}</td>
                      <td className={cn(TD, 'whitespace-nowrap text-right font-mono font-semibold tabular-nums')}>
                        {formatAngka(+(e.salary ?? 0))}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <Pagination
          stats={{ from: `${from ?? '0'}`, to: `${to ?? '0'}`, total: `${total ?? '0'}` }}
          links={links ?? []}
          onClickPageButton={(url) => setPaginationUrl(url)}
          onClickNext={() => setPaginationUrl((berikutnya as string) ?? '')}
          onClickPrevious={() => setPaginationUrl((sebelumnya as string) ?? '')}
          onChangePerPage={(page) => {
            setPaginationUrl('');
            setPageSize(page?.value ?? 10);
          }}
        />
      </div>

      <Modal
        isOpen={konfirmasi}
        onRequestClose={menyimpan ? undefined : () => setKonfirmasi(false)}
        bodyClassName="p-4"
      >
        <div className="flex flex-col gap-2.5">
          <DialogHeading title={`Buat daftar gaji ${bulanTeks}?`}>
            Gaji dan jabatan tiap karyawan aktif disalin ke daftar bulan ini. Perubahan gaji sesudah ini tidak ikut
            berubah di daftar yang sudah jadi.
          </DialogHeading>

          <div className="flex flex-col gap-0.5 rounded-group bg-surface-raised px-2.75 py-2.25">
            <DialogRow label="Karyawan aktif" value={`${total ?? 0}`} />
            <DialogDivider />
            <DialogRow label="Gaji di halaman ini" value={formatAngka(gajiHalaman)} strong />
          </div>

          <p className="flex items-start gap-1.5 rounded-lg bg-destructive-subtle px-2.75 py-2 text-sm leading-[17px] text-destructive">
            <AlertTriangle size={14} strokeWidth={1.9} className="mt-0.5 shrink-0" aria-hidden />
            <span>
              Kalau daftar {bulanTeks} sudah pernah dibuat, membuatnya lagi{' '}
              <b>menghapus daftar yang lama beserta pembayaran yang sudah tercatat di dalamnya</b>, lalu menyusunnya
              ulang dari gaji karyawan yang berlaku sekarang.
            </span>
          </p>

          <div className="mt-1 flex justify-end gap-1.75">
            <Button size="sm" variant="outline" onClick={() => setKonfirmasi(false)} disabled={menyimpan}>
              Batal
            </Button>
            <Button size="sm" onClick={buat} loading={menyimpan}>
              Buat daftar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

PreviewSalaryPage.themeable = true;

export default PreviewSalaryPage;
