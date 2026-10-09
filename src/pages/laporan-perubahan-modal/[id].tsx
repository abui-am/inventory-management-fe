import dayjs from 'dayjs';
import { ArrowLeft, Lock, Printer } from 'lucide-react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { useMemo } from 'react';

import CapitalCard from '@/components/capital-report/CapitalCard';
import { bacaAngka } from '@/components/capital-report/rows';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFetchCapitalReportInfo } from '@/hooks/query/useFetchCapitalReportDate';
import { ThemeablePage } from '@/typings/page';

/**
 * Laporan perubahan modal satu periode yang SUDAH ditutup.
 *
 * Bedanya dengan periode berjalan ada dua, dan keduanya sengaja terlihat: baris "Laba
 * diambil pemilik" ikut ditampilkan, dan modal akhirnya dibaca dari `total_capital` —
 * angka yang benar-benar tersimpan dan sudah ada jurnalnya — bukan dihitung ulang di
 * layar. Menghitungnya ulang akan menghasilkan angka yang bisa berbeda dari yang sudah
 * terbit di buku besar.
 */
const LaporanTersimpanPage: NextPage & ThemeablePage = () => {
  const { query, push } = useRouter();
  const awal = query.start_date as string | undefined;
  const akhir = query.id as string | undefined;

  const { data, isLoading } = useFetchCapitalReportInfo({ start_date: awal, end_date: akhir });

  const info = data?.data;
  const angka = useMemo(() => bacaAngka(info?.capital_reports ?? []), [info]);

  const periodeTeks = `${awal ? `${dayjs(awal).format('D MMM YYYY')} — ` : ''}${dayjs(akhir ?? info?.end_date).format(
    'D MMM YYYY'
  )}`;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 text-lg font-bold">
            Laporan Perubahan Modal
            <Badge variant="neutral">
              <Lock strokeWidth={2} aria-hidden /> Sudah ditutup
            </Badge>
          </h1>
          <p className="mt-0.5 text-sm text-foreground-subtle">
            Periode {periodeTeks}. Angkanya sudah tertulis di buku besar dan tidak dihitung ulang.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.75 print:hidden">
          <Button size="sm" variant="outline" onClick={() => push('/laporan-perubahan-modal')}>
            <ArrowLeft strokeWidth={1.9} aria-hidden /> Kembali
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer strokeWidth={1.9} aria-hidden /> Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[1.6fr_1fr]">
        <CapitalCard
          judul="Laporan periode tersimpan"
          ket={`${periodeTeks} · sudah ditutup`}
          angka={angka}
          // `total_capital` dipakai apa adanya: laba yang diambil dan prive sudah
          // diperhitungkan di dalamnya oleh backend saat laporannya disimpan.
          modalAkhir={+(info?.total_capital ?? 0)}
          loading={isLoading}
          denganDiambil
          catatan={
            <>
              Periode ini <b>terkunci</b>. Transaksi bertanggal di dalamnya tidak bisa lagi dibatalkan, diretur, atau
              ditolak — jurnal penutupnya sudah terbit.
            </>
          }
        />
      </div>
    </div>
  );
};

LaporanTersimpanPage.themeable = true;

export default LaporanTersimpanPage;
