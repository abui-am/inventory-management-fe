import dayjs from 'dayjs';
import { BookOpen, Eye, Lock, Printer } from 'lucide-react';
import { NextPage } from 'next';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';

import CapitalCard from '@/components/capital-report/CapitalCard';
import { bacaAngka, modalAkhirBerjalan } from '@/components/capital-report/rows';
import Pagination from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import Kpi from '@/components/ui/kpi';
import Skeleton from '@/components/ui/skeleton';
import { useFetchCapitalReportDates, useFetchCapitalReportInfo } from '@/hooks/query/useFetchCapitalReportDate';
import { cn } from '@/lib/cn';
import { ThemeablePage } from '@/typings/page';

const TH = 'border-b border-border px-2.5 pb-1.75 pt-2.25 text-xs font-bold text-foreground-subtle';
const TD = 'border-b border-border px-2.5 py-2 align-middle text-base';

/**
 * Perubahan Modal — bagaimana modal pemilik berubah sejak tutup buku terakhir.
 *
 * Layar lama hanya berupa tabel tiga kolom (Nama, Tanggal, tombol mata) tanpa satu pun
 * angka: untuk tahu modal sekarang berapa, orang harus menekan "Tambah" dan masuk ke
 * layar pembuatan laporan. Di sini periode berjalan ditampilkan langsung, dan daftar
 * periode yang sudah ditutup duduk di sebelahnya.
 *
 * Yang paling penting dan tidak pernah disebut layar lama: tutup buku MENGUNCI periodenya.
 * Sesudahnya `void()`, retur, dan penolakan barang masuk menolak bekerja di tanggal yang
 * sudah ditutup. Itu dinyatakan di catatan bawah, bukan ditemukan sendiri.
 */
const CapitalReportPage: NextPage & ThemeablePage = () => {
  const [paginationUrl, setPaginationUrl] = useState('');
  const [pageSize, setPageSize] = useState(10);

  const { data: dataInfo, isLoading: memuatInfo } = useFetchCapitalReportInfo({});
  const { data: dataDates, isLoading: memuatDaftar } = useFetchCapitalReportDates({
    forceUrl: paginationUrl || undefined,
    per_page: pageSize,
    order_by: { end_date: 'desc' },
  });

  const info = dataInfo?.data;
  const angka = useMemo(() => bacaAngka(info?.capital_reports ?? []), [info]);
  const modalSekarang = modalAkhirBerjalan(angka);

  const {
    data: periode = [],
    from,
    to,
    total,
    links,
    next_page_url: berikutnya,
    prev_page_url: sebelumnya,
  } = dataDates?.data?.report_dates ?? {};

  const mulai = info?.start_date;
  const sampai = info?.end_date ?? new Date().toISOString();
  const hari = mulai ? dayjs(sampai).diff(dayjs(mulai), 'day') + 1 : 0;

  const periodeTeks = mulai
    ? `${dayjs(mulai).format('D MMM YYYY')} — ${dayjs(sampai).format('D MMM YYYY')} · belum ditutup`
    : 'belum ditutup';

  return (
    <div className="flex flex-col gap-2.5">
      {/* SPEC-01 — judul, penjelasan, dan dua aksi */}
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="min-w-0">
          <h1 className="text-lg font-bold">Perubahan Modal</h1>
          <p className="mt-0.5 text-sm text-foreground-subtle">
            Bagaimana modal pemilik berubah sejak tutup buku terakhir — dan apa yang terjadi kalau periode ini ditutup.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.75 print:hidden">
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer strokeWidth={1.9} aria-hidden />
            Print
          </Button>
          <Link href="/laporan-perubahan-modal/create">
            <Button size="sm">
              <Lock strokeWidth={1.9} aria-hidden /> Tutup buku
            </Button>
          </Link>
        </div>
      </div>

      {/* SPEC-02 — empat angka periode berjalan */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Modal sekarang"
          nilai={memuatInfo ? undefined : modalSekarang}
          ket="kalau periode ini ditutup hari ini"
        />
        {/* Nadanya mengikuti angkanya: periode yang rugi tidak boleh tampil hijau, dan
            prive nol tidak perlu merah. */}
        <Kpi
          label={angka.labaDitahan < 0 ? 'Rugi belum ditutup' : 'Laba belum ditahan'}
          nilai={memuatInfo ? undefined : Math.abs(angka.labaDitahan)}
          tone={angka.labaDitahan < 0 ? 'destructive' : 'success'}
          ket="dari Laporan Pendapatan"
        />
        <Kpi
          label="Prive periode ini"
          nilai={memuatInfo ? undefined : Math.abs(angka.prive)}
          tone={angka.prive === 0 ? 'default' : 'destructive'}
          ket="uang toko yang dipakai pemilik"
        />
        <Kpi
          label="Periode berjalan"
          nilai={memuatInfo ? undefined : `${hari} hari`}
          ket={mulai ? `sejak ${dayjs(mulai).format('D MMM YYYY')}` : 'sejak transaksi pertama'}
        />
      </div>

      {/* SPEC-03 — kiri selalu lebih lebar dari kanan, dengan rasio bukan lebar tetap */}
      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[1.6fr_1fr]">
        <CapitalCard
          judul="Periode berjalan"
          ket={periodeTeks}
          angka={angka}
          modalAkhir={modalSekarang}
          loading={memuatInfo}
          catatan={
            <>
              Angka ini dihitung ulang tiap kali halaman dibuka dan <b>belum ada di buku besar</b>. Ia baru ditulis —
              dan modal pemilik baru benar-benar berubah — saat periodenya ditutup.
            </>
          }
        />

        {/* SPEC-04 — periode yang sudah ditutup, terbaru di atas.
            Kolom "Modal akhir" sengaja TIDAK ada: `GET /capital-report/report-date` hanya
            mengirim tanggalnya, jadi mengisinya butuh satu `POST /capital-report` per baris
            — sepuluh permintaan untuk satu kolom. Angkanya ada di halaman laporannya. */}
        <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2.5 px-3.5 pb-2 pt-3">
            <span className="text-base font-bold">Periode yang sudah ditutup</span>
            <span className="text-xs text-foreground-subtle">terbaru di atas</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-surface-raised">
                  <th scope="col" className={cn(TH, 'text-left')}>
                    Periode
                  </th>
                  <th scope="col" style={{ width: '90px' }} className={cn(TH, 'text-right')}>
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {memuatDaftar &&
                  Array.from({ length: 3 }, (_, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <tr key={i}>
                      {Array.from({ length: 2 }, (_, j) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <td key={j} className={TD}>
                          <div className="flex h-[26px] items-center">
                            <Skeleton className="h-3.5 w-full" />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}

                {!memuatDaftar && periode.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-3.5 py-10 text-center">
                      <div className="flex flex-col items-center gap-1.75">
                        <BookOpen size={26} strokeWidth={1.6} className="text-foreground-subtle" aria-hidden />
                        <p className="text-base font-semibold">Belum pernah tutup buku</p>
                        <p className="max-w-[330px] text-sm text-foreground-muted">
                          Selama belum ada yang ditutup, periode berjalan dihitung sejak transaksi pertama. Modal
                          awalnya 0 sampai ada modal yang disetor.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}

                {!memuatDaftar &&
                  periode.map(({ start_date: awal, end_date: akhir }) => (
                    <tr key={akhir} className="transition-colors duration-fast hover:bg-surface-raised">
                      <td className={TD}>
                        <span className="inline-flex items-center gap-2">
                          <Lock size={13} strokeWidth={1.8} className="shrink-0 text-foreground-subtle" aria-hidden />
                          <span className="font-medium">
                            {awal ? `${dayjs(awal).format('D MMM YYYY')} — ` : ''}
                            {dayjs(akhir).format('D MMM YYYY')}
                          </span>
                        </span>
                      </td>
                      <td className={cn(TD, 'text-right')}>
                        <Link href={`/laporan-perubahan-modal/${akhir}?start_date=${awal ?? ''}`}>
                          <Button size="xs" variant="outline">
                            <Eye strokeWidth={1.7} aria-hidden /> Lihat
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {!memuatDaftar && periode.length > 0 && (
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
          )}
        </div>
      </div>

      {/* SPEC-05 — akibat terbesar dari tombol Tutup buku, dikatakan sebelum ditekan */}
      <p className="flex items-start gap-1.75 rounded-lg border border-dashed border-border-strong bg-surface-raised px-3 py-2.5 text-sm text-foreground-muted">
        <Eye size={14} strokeWidth={1.9} className="mt-0.5 shrink-0 text-accent" aria-hidden />
        <span>
          <b className="text-foreground">Tutup buku menulis ke buku besar, dan mengunci periodenya.</b> Laba periode ini
          dipindahkan ke akun Modal lewat jurnal — bukan sekadar dicatat di layar. Sesudahnya transaksi bertanggal di
          dalam periode itu tidak bisa lagi dibatalkan, diretur, atau ditolak, karena jurnal penutupnya sudah terbit.
        </span>
      </p>
    </div>
  );
};

CapitalReportPage.themeable = true;

export default CapitalReportPage;
