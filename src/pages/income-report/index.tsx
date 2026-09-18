import dayjs from 'dayjs';
import { ArrowDown, ArrowUp, BarChart3, Eye, Printer } from 'lucide-react';
import { NextPage } from 'next';
import React, { useMemo, useState } from 'react';

import IncomeStatementCard from '@/components/income-report/IncomeStatementCard';
import MoneyInCard from '@/components/income-report/MoneyInCard';
import PurchaseCard from '@/components/income-report/PurchaseCard';
import { Button } from '@/components/ui/button';
import DateRangeFilter, { DateRange } from '@/components/ui/date-range-filter';
import Kpi from '@/components/ui/kpi';
import { PeriodPresets, PRESET_RENTANG, rentangHariIni } from '@/components/ui/period-presets';
import { useFetchIncomeReport } from '@/hooks/query/useFetchIncomeReport';
import { useFetchIncomeUserReport } from '@/hooks/query/useFetchIncomeUserReport';
import { cn } from '@/lib/cn';
import { ThemeablePage } from '@/typings/page';
import { formatDateYYYYMMDDHHmmss } from '@/utils/format';

/** Persentase perubahan, atau `null` kalau pembandingnya nol — 0 → 5 bukan "naik 100%". */
const beda = (sekarang: number, sebelum: number): number | null => {
  if (!sebelum) return null;
  return ((sekarang - sebelum) / Math.abs(sebelum)) * 100;
};

/**
 * Panah + persentase. Warnanya ditentukan pemanggil lewat `baik`, bukan oleh arah panahnya:
 * beban yang naik itu kabar buruk, penjualan yang naik kabar baik.
 */
function Delta({ persen, baik, ket }: { persen: number | null; baik: boolean; ket: string }): JSX.Element {
  if (persen === null) return <span>{ket} belum ada angkanya</span>;
  const Panah = persen >= 0 ? ArrowUp : ArrowDown;
  const naikBaik = persen >= 0 ? baik : !baik;
  return (
    <span className="inline-flex items-center gap-1.25">
      <span
        className={cn('inline-flex items-center gap-0.5 font-semibold', naikBaik ? 'text-success' : 'text-destructive')}
      >
        <Panah size={11} strokeWidth={2.2} aria-hidden />
        {Math.abs(persen).toFixed(1).replace('.', ',')}%
      </span>
      {ket}
    </span>
  );
}

/**
 * Laporan Pendapatan — laba rugi satu rentang, dihitung ulang tiap kali rentangnya diubah.
 *
 * Tiga hal yang dulu tidak pernah terlihat padahal datanya sudah dikirim backend:
 * uang masuk per metode bayar (`user-report`), pembelian barang (`stock_ins`), dan
 * pembanding periode sebelumnya. Yang terakhir memakai panggilan kedua ke endpoint yang
 * sama dengan rentang digeser mundur sepanjang rentang yang sedang dibuka.
 *
 * Halaman ini tidak menyimpan apa pun. Yang menutup periode dan memindahkan laba ke modal
 * adalah Perubahan Modal.
 */
const IncomeReportPage: NextPage & ThemeablePage = () => {
  const [range, setRange] = useState<DateRange>(rentangHariIni);
  const [dipilihDari, dipilihSampai] = range;

  /**
   * Rentang yang BENAR-BENAR dipakai menyusun query.
   *
   * Kalender mengirim `[tanggal, null]` begitu ujung pertama diklik, dan ujung keduanya
   * baru datang pada klik berikutnya. Halaman lain menunggu keduanya sebelum menyaring;
   * laporan ini tidak bisa — ia tidak punya keadaan "belum menyaring", jadi menunggu
   * berarti tidak menampilkan apa pun. Satu tanggal karena itu dibaca sebagai rentang satu
   * hari itu juga, dan melebar sendiri kalau ujung keduanya menyusul.
   *
   * Konsekuensi lain yang lebih penting: querynya TIDAK PERNAH dimatikan. `enabled: false`
   * di react-query v4 bukan "diam" melainkan `loading` selamanya (lihat CLAUDE.md), dan
   * itulah yang membuat halaman ini memutar kerangka tanpa henti begitu satu tanggal
   * diklik.
   */
  const dari = dipilihDari ?? dayjs().startOf('day').toDate();
  const sampai = dipilihSampai ?? dari;

  const hari = dayjs(sampai).endOf('day').diff(dayjs(dari).startOf('day'), 'day') + 1;
  const satuHari = hari === 1;

  const mulaiKe = dayjs(dari).startOf('day').valueOf();
  const selesaiKe = dayjs(sampai).endOf('day').valueOf();

  const rentang = useMemo(
    () => ({
      date_start: formatDateYYYYMMDDHHmmss(dayjs(mulaiKe)),
      date_end: formatDateYYYYMMDDHHmmss(dayjs(selesaiKe)),
    }),
    [mulaiKe, selesaiKe]
  );

  // Pembanding: rentang sepanjang yang sama, digeser mundur tepat di depannya.
  const rentangSebelum = useMemo(
    () => ({
      date_start: formatDateYYYYMMDDHHmmss(dayjs(mulaiKe).subtract(hari, 'day').startOf('day')),
      date_end: formatDateYYYYMMDDHHmmss(dayjs(mulaiKe).subtract(1, 'day').endOf('day')),
    }),
    [mulaiKe, hari]
  );

  const { data: dataSekarang, isLoading } = useFetchIncomeReport(rentang);
  const { data: dataSebelum } = useFetchIncomeReport(rentangSebelum);
  const { data: dataUser, isLoading: loadingUser } = useFetchIncomeUserReport(rentang);

  const laporan = dataSekarang?.data?.income_report;
  const sebelum = dataSebelum?.data?.income_report;
  const perUser = dataUser?.data?.income_report;

  const penjualan = laporan?.incomes?.sales ?? 0;
  const pembelian = laporan?.stock_ins?.purchases ?? 0;
  const kosong = !isLoading && penjualan === 0 && (laporan?.total_expense ?? 0) === 0 && pembelian === 0;

  const ketBanding = satuHari ? 'dibanding kemarin' : `dibanding ${hari} hari sebelumnya`;

  const periode = satuHari
    ? dayjs(dari).format('DD MMM YYYY')
    : `${dayjs(dari).format('D MMM')} – ${dayjs(sampai).format('D MMM YYYY')}`;

  return (
    <div className="flex flex-col gap-2.5">
      {/* SPEC-01 — judul, rentang bawaan hari ini, dan Print */}
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="min-w-0">
          <h1 className="text-lg font-bold">Laporan Pendapatan</h1>
          <p className="mt-0.5 text-sm text-foreground-subtle">
            Dihitung ulang tiap kali periodenya diganti — tidak ada yang disimpan.
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

      {/* SPEC-03 — empat angka yang dibaca duluan, masing-masing dengan pembandingnya */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Penjualan"
          nilai={isLoading ? undefined : penjualan}
          ket={<Delta persen={beda(penjualan, sebelum?.incomes?.sales ?? 0)} baik ket={ketBanding} />}
        />
        <Kpi
          label="Pendapatan bersih"
          nilai={isLoading ? undefined : laporan?.total_income}
          ket={<Delta persen={beda(laporan?.total_income ?? 0, sebelum?.total_income ?? 0)} baik ket={ketBanding} />}
        />
        <Kpi
          label="Total beban"
          nilai={isLoading ? undefined : laporan?.total_expense}
          tone="destructive"
          ket={
            <Delta
              persen={beda(laporan?.total_expense ?? 0, sebelum?.total_expense ?? 0)}
              baik={false}
              ket={ketBanding}
            />
          }
        />
        <Kpi
          label={(laporan?.total_profit ?? 0) >= 0 ? 'Laba bersih' : 'Rugi bersih'}
          nilai={isLoading ? undefined : Math.abs(laporan?.total_profit ?? 0)}
          tone={(laporan?.total_profit ?? 0) >= 0 ? 'success' : 'destructive'}
          ket={<Delta persen={beda(laporan?.total_profit ?? 0, sebelum?.total_profit ?? 0)} baik ket={ketBanding} />}
        />
      </div>

      {/* SPEC-04 — rentang bawaan satu hari membuat keadaan ini sering terlihat: pagi hari
          laporan hari ini memang masih kosong, jadi ia menawarkan rentang yang pasti berisi. */}
      {kosong ? (
        <div className="flex flex-col items-center gap-1.75 rounded-card border border-border bg-surface px-4 py-12 text-center shadow-sm">
          <BarChart3 size={26} strokeWidth={1.6} className="text-foreground-subtle" aria-hidden />
          <p className="text-base font-semibold">
            {satuHari ? 'Belum ada transaksi hari ini' : 'Belum ada transaksi di periode ini'}
          </p>
          <p className="max-w-[340px] text-sm text-foreground-muted">
            Laporan terisi sendiri begitu penjualan pertama tercatat. Beban dan pembelian yang sudah dicatat ikut
            dihitung.
          </p>
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
      ) : (
        // Lebarnya perbandingan, bukan angka tetap: dengan lebar tetap di kiri, kolom kanan
        // ikut tumbuh di layar lebar sampai melewati kartu laba ruginya sendiri.
        <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[1.6fr_1fr]">
          {/* SPEC-05 — laba rugi, sekaligus komposisi bebannya */}
          <IncomeStatementCard laporan={laporan} perUser={perUser} periode={periode} loading={isLoading} />

          {/* SPEC-06 — dua kartu yang menjawab "uangnya ke mana": yang masuk, dan yang keluar untuk barang */}
          <div className="flex min-w-0 flex-col gap-2.5">
            <MoneyInCard perUser={perUser} periodeHariIni={satuHari} loading={loadingUser} />
            <PurchaseCard stockIns={laporan?.stock_ins} loading={isLoading} />
          </div>
        </div>
      )}

      {/* SPEC-07 — menyatakan apa yang TIDAK dilakukan halaman ini */}
      <p className="flex items-start gap-1.5 rounded-lg bg-info-subtle px-3.25 py-2 text-sm leading-[17px] text-info">
        <Eye size={13} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
        <span>
          Tidak ada yang disimpan di sini. Laporan dihitung ulang dari transaksi dan beban di periode yang dipilih;
          bawaannya hari ini. Yang menutup periode dan memindahkan laba ke modal adalah Perubahan Modal, bukan halaman
          ini. Rincian per kasir ada di dalam baris Penjualan dan tiap baris beban.
        </span>
      </p>
    </div>
  );
};

IncomeReportPage.themeable = true;

export default IncomeReportPage;
