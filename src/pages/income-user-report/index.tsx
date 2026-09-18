import dayjs from 'dayjs';
import { Eye, Printer, Users } from 'lucide-react';
import { NextPage } from 'next';
import React, { useMemo, useState } from 'react';

import { jumlahkan, susunBaris } from '@/components/income-user-report/rows';
import UserCardList from '@/components/income-user-report/UserCardList';
import UserReportTable from '@/components/income-user-report/UserReportTable';
import { Button } from '@/components/ui/button';
import DateRangeFilter, { DateRange } from '@/components/ui/date-range-filter';
import Kpi from '@/components/ui/kpi';
import { PeriodPresets, PRESET_RENTANG, rentangHariIni } from '@/components/ui/period-presets';
import { useFetchIncomeUserReport } from '@/hooks/query/useFetchIncomeUserReport';
import { ThemeablePage } from '@/typings/page';
import { formatDateYYYYMMDDHHmmss } from '@/utils/format';

/**
 * Laporan per Kasir — uang yang masuk dan keluar lewat tiap orang.
 *
 * Semua angkanya dari SATU permintaan: `POST /income-report/user-report` tanpa `type`
 * (getUserAllReport). Layar lama memecah jawaban yang sama jadi empat tab, padahal
 * permintaannya memang cuma satu.
 *
 * Kolom terakhir dinamai Saldo, bukan Setoran: untuk yang tugasnya membeli barang angkanya
 * negatif — ia memakai uang toko, bukan memegangnya.
 */
const IncomeUserReportPage: NextPage & ThemeablePage = () => {
  const [range, setRange] = useState<DateRange>(rentangHariIni);
  const [dipilihDari, dipilihSampai] = range;

  // Sama dengan /income-report: satu tanggal dibaca sebagai rentang satu hari itu, dan
  // querynya tidak pernah dimatikan — `enabled: false` di react-query v4 berarti `loading`
  // selamanya, bukan diam.
  const dari = dipilihDari ?? dayjs().startOf('day').toDate();
  const sampai = dipilihSampai ?? dari;

  const mulaiKe = dayjs(dari).startOf('day').valueOf();
  const selesaiKe = dayjs(sampai).endOf('day').valueOf();
  const satuHari = dayjs(selesaiKe).diff(dayjs(mulaiKe), 'day') === 0;

  const rentang = useMemo(
    () => ({
      date_start: formatDateYYYYMMDDHHmmss(dayjs(mulaiKe)),
      date_end: formatDateYYYYMMDDHHmmss(dayjs(selesaiKe)),
    }),
    [mulaiKe, selesaiKe]
  );

  const { data, isLoading } = useFetchIncomeUserReport(rentang);

  const baris = useMemo(() => susunBaris(data?.data?.income_report ?? []), [data]);
  const total = jumlahkan(baris);
  const penjual = baris.filter((o) => o.jual > 0).length;

  const kosong = {
    judul: satuHari ? 'Belum ada aktivitas hari ini' : 'Belum ada aktivitas di periode ini',
    pesan: 'Baris muncul sendiri begitu ada penjualan, pembelian, atau beban yang tercatat atas nama seseorang.',
  };

  const periode = satuHari
    ? dayjs(dari).format('DD MMM YYYY')
    : `${dayjs(dari).format('D MMM')} – ${dayjs(sampai).format('D MMM YYYY')}`;

  return (
    <div className="flex flex-col gap-2.5">
      {/* SPEC-01 — judul, rentang bawaan hari ini, dan Print */}
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="min-w-0">
          <h1 className="text-lg font-bold">Laporan per Kasir</h1>
          <p className="mt-0.5 text-sm text-foreground-subtle">
            Uang yang masuk dan keluar lewat tiap orang di periode ini — dan berapa yang harusnya masih dipegang.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.75 print:hidden">
          {/* SPEC-02 — rentang yang paling sering dipakai, sekali klik */}
          <PeriodPresets value={range} onChange={setRange} />

          <DateRangeFilter value={range} onChange={setRange} />

          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer strokeWidth={1.9} aria-hidden />
            Print
          </Button>
        </div>
      </div>

      {/* SPEC-03 — empat angka yang sama dengan kaki tabel, supaya terbaca sebelum menggulir */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Penjualan" nilai={isLoading ? undefined : total.jual} ket={`Dari ${penjual} orang · ${periode}`} />
        <Kpi label="Pembelian" nilai={isLoading ? undefined : total.beli} ket="uang toko yang dipakai beli barang" />
        <Kpi
          label="Beban"
          nilai={isLoading ? undefined : total.beban}
          tone="destructive"
          ket="dibayar dari uang yang dipegang"
        />
        <Kpi
          label="Saldo bersih"
          nilai={isLoading ? undefined : total.saldo}
          tone={total.saldo >= 0 ? 'success' : 'destructive'}
          ket="penjualan − pembelian − beban"
        />
      </div>

      {/* SPEC-04 — di bawah md tiap orang jadi kartu; tabel lima kolom tidak muat di 360px */}
      <div className="md:hidden">
        <UserCardList baris={baris} loading={isLoading} empty={kosong} />
      </div>

      {/* SPEC-05 — satu baris per orang, bisa dibuka jadi rincian cara bayar */}
      <UserReportTable
        baris={baris}
        loading={isLoading}
        kosong={
          <div className="flex flex-col items-center gap-1.75">
            <Users size={26} strokeWidth={1.6} className="text-foreground-subtle" aria-hidden />
            <p className="text-base font-semibold">{kosong.judul}</p>
            <p className="max-w-[340px] text-sm text-foreground-muted">{kosong.pesan}</p>
            <div className="mt-1.5 flex flex-wrap justify-center gap-1.75">
              <Button
                size="sm"
                onClick={() =>
                  setRange([
                    dayjs().subtract(1, 'day').startOf('day').toDate(),
                    dayjs().subtract(1, 'day').endOf('day').toDate(),
                  ])
                }
              >
                Lihat kemarin
              </Button>
              <Button size="sm" variant="outline" onClick={() => setRange(PRESET_RENTANG[1].rentang())}>
                Lihat 7 hari terakhir
              </Button>
            </div>
          </div>
        }
      />

      {/* SPEC-06 — satu kalimat yang mencegah kolom Saldo dibaca sebagai jumlah setoran */}
      <p className="flex items-start gap-1.5 rounded-lg bg-info-subtle px-3.25 py-2 text-sm leading-[17px] text-info">
        <Eye size={13} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
        <span>
          Saldo tidak selalu menunjukkan jumlah setoran. Saldo positif berarti masih ada uang toko yang harus
          disetorkan, sedangkan saldo negatif berarti uang yang dikeluarkan lebih besar dari yang diterima. Piutang dan
          giro tetap tercatat sebagai penjualan meskipun uang belum diterima. Untuk mencocokkan dengan uang di laci,
          gunakan Kas pada rincian, bukan Saldo.Kas di rinciannya, bukan kolom Saldo.
        </span>
      </p>
    </div>
  );
};

IncomeUserReportPage.themeable = true;

export default IncomeUserReportPage;
