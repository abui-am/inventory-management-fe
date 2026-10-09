import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight, Info, Printer, Wallet } from 'lucide-react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { forwardRef, useMemo, useState } from 'react';

import { DatePickerComponent } from '@/components/Form';
import PaySalaryDialog from '@/components/monthly-salary/PaySalaryDialog';
import { BarisGaji, jumlahkan, susunBaris } from '@/components/monthly-salary/rows';
import SalaryCardList from '@/components/monthly-salary/SalaryCardList';
import SalaryTable from '@/components/monthly-salary/SalaryTable';
import Pagination from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import Kpi from '@/components/ui/kpi';
import { useFetchSalary, useFetchUnpaginatedSalary } from '@/hooks/query/useFetchSalary';
import { ThemeablePage } from '@/typings/page';
import { formatDateYYYYMM } from '@/utils/format';

/**
 * Nama bulan di pemilih bulan — kotaknya sendiri yang membuka kalender, tanpa kotak
 * input bawaan datepicker. react-datepicker memberi `value` dan `onClick` ke
 * `customInput`, dan memasang ref-nya untuk menempatkan kalender.
 */
const TombolBulan = forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void }>(
  ({ value, onClick }, ref) => (
    <Button ref={ref} size="sm" variant="outline" className="min-w-[110px]" onClick={onClick}>
      {value}
    </Button>
  )
);
TombolBulan.displayName = 'TombolBulan';

/**
 * Gaji Karyawan — daftar gaji satu bulan dan berapa yang sudah dibayarkan.
 *
 * Layar lama tidak punya SATU pun jumlah: berapa total gaji bulan ini, berapa yang sudah
 * dibayar, berapa sisanya — semuanya harus dijumlah sendiri dari baris tabel yang
 * berpaginasi. Empat angka di kepala halaman diambil dari satu permintaan tanpa paginasi,
 * jadi ia benar-benar sebulan penuh, bukan halaman yang sedang dilihat.
 *
 * Statusnya juga dibuat tiga tingkat. `Payroll::$statuses` hanya punya 'lunas' dan
 * 'belum lunas', sehingga orang yang sudah dibayar separuh terbaca persis sama dengan
 * yang belum dibayar sepeser pun — lihat `components/monthly-salary/StatusGaji`.
 */
const MonthlySalaryPage: NextPage & ThemeablePage = () => {
  const router = useRouter();

  const [tanggal, setTanggal] = useState(router.query.date ? new Date(router.query.date as string) : new Date());
  const [pageSize, setPageSize] = useState(10);
  const [paginationUrl, setPaginationUrl] = useState('');
  const [membayar, setMembayar] = useState<BarisGaji | null>(null);

  const bulan = formatDateYYYYMM(tanggal);
  const bulanTeks = dayjs(tanggal).format('MMMM YYYY');

  const gantiBulan = (next: Date) => {
    setPaginationUrl('');
    setTanggal(next);
  };

  const { data: datasource, isLoading } = useFetchSalary({
    per_page: pageSize,
    where_payroll_month: bulan,
    // Sisa terbesar di atas: yang masih harus dibayar itulah yang membuat orang membuka
    // layar ini, jadi ia tidak perlu dicari dulu di halaman kedua.
    order_by: { paid_amount: 'asc' },
    paginated: true,
    forceUrl: paginationUrl || undefined,
  });

  /** Angka sebulan penuh — tidak bisa dijumlahkan dari satu halaman tabel. */
  const { data: dataSemua, isLoading: memuatRingkasan } = useFetchUnpaginatedSalary({
    where_payroll_month: bulan,
  });

  const {
    data: rows = [],
    from,
    to,
    total,
    links,
    next_page_url: berikutnya,
    prev_page_url: sebelumnya,
  } = datasource?.data?.payrolls ?? {};

  const baris = useMemo(() => susunBaris(rows), [rows]);
  const semua = useMemo(() => susunBaris(dataSemua?.data?.payrolls ?? []), [dataSemua]);
  const ringkasan = jumlahkan(semua);

  // Daftar bulan ini belum pernah dibuat. Dibaca dari permintaan TANPA paginasi supaya
  // halaman kedua yang kebetulan kosong tidak ikut terbaca sebagai "belum dibuat".
  const belumDibuat = !memuatRingkasan && semua.length === 0;

  const kosong = (
    <div className="flex flex-col items-center gap-1.75">
      <Wallet size={26} strokeWidth={1.6} className="text-foreground-subtle" aria-hidden />
      <p className="text-base font-semibold">Daftar gaji {bulanTeks} belum dibuat</p>
      <p className="max-w-[340px] text-sm text-foreground-muted">
        Daftarnya disusun sekali tiap bulan dari karyawan yang aktif. Gaji yang sudah dibayar di muka ikut terhitung
        otomatis.
      </p>
      <div className="mt-1.5">
        <Button
          size="sm"
          onClick={() => router.push({ pathname: '/monthly-salary/preview', query: { date: tanggal.toISOString() } })}
        >
          Buat daftar
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-2.5">
      {/* SPEC-01 — judul dan penjelasannya */}
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="min-w-0">
          <h1 className="text-lg font-bold">Gaji Karyawan</h1>
          <p className="mt-0.5 text-sm text-foreground-subtle">
            Gaji yang harus dibayar bulan ini, dan berapa yang sudah dibayarkan ke tiap orang.
          </p>
        </div>
      </div>

      {/* SPEC-02 — empat angka sebulan penuh, bukan sehalaman */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Gaji bulan ini"
          nilai={memuatRingkasan ? undefined : ringkasan.gaji}
          ket={`${semua.length} orang di daftar`}
        />
        <Kpi
          label="Sudah dibayar"
          nilai={memuatRingkasan ? undefined : ringkasan.dibayar}
          tone="success"
          ket={`${ringkasan.persen}% dari total`}
        >
          <div className="mt-1.75 h-1 overflow-hidden rounded-pill bg-surface-sunken">
            <div className="h-full rounded-pill bg-accent" style={{ width: `${ringkasan.persen}%` }} />
          </div>
        </Kpi>
        <Kpi
          label="Sisa dibayar"
          nilai={memuatRingkasan ? undefined : ringkasan.sisa}
          tone="destructive"
          ket="masih harus dikeluarkan bulan ini"
        />
        <Kpi
          label="Belum lunas"
          nilai={memuatRingkasan ? undefined : `${ringkasan.belumLunas} orang`}
          ket="termasuk yang baru dibayar sebagian"
        />
      </div>

      {/* SPEC-03 — pemilih bulan dengan panah, dan Print */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 print:hidden">
        <div className="flex items-center gap-1.5">
          <Button
            size="icon-sm"
            variant="outline"
            aria-label="Bulan sebelumnya"
            onClick={() => gantiBulan(dayjs(tanggal).subtract(1, 'month').toDate())}
          >
            <ChevronLeft strokeWidth={2} aria-hidden />
          </Button>

          <DatePickerComponent
            dateFormat="MMMM yyyy"
            showMonthYearPicker
            selected={tanggal}
            onChange={(next: Date) => gantiBulan(next)}
            // Kalendernya jauh lebih lebar dari tombolnya, jadi `bottom-start` bawaan
            // membuatnya menjulur jauh ke kanan dan terbaca tidak menempel ke tombol.
            popperPlacement="bottom"
            customInput={<TombolBulan />}
          />

          <Button
            size="icon-sm"
            variant="outline"
            aria-label="Bulan berikutnya"
            onClick={() => gantiBulan(dayjs(tanggal).add(1, 'month').toDate())}
          >
            <ChevronRight strokeWidth={2} aria-hidden />
          </Button>
        </div>

        <Button size="sm" variant="outline" onClick={() => window.print()}>
          <Printer strokeWidth={1.9} aria-hidden />
          Print
        </Button>
      </div>

      {/* SPEC-04 — tabel mulai dari md; di bawah itu tiap orang jadi kartu */}
      <div className="hidden overflow-hidden rounded-card border border-border bg-surface shadow-sm md:block">
        <SalaryTable
          baris={baris}
          loading={isLoading || memuatRingkasan}
          perPage={pageSize}
          kosong={kosong}
          onBayar={setMembayar}
        />

        {!belumDibuat && (
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

      <div className="md:hidden">
        <SalaryCardList
          baris={baris}
          loading={isLoading || memuatRingkasan}
          perPage={pageSize}
          kosong={kosong}
          onBayar={setMembayar}
        />

        {!belumDibuat && (
          <div className="mt-2 overflow-hidden rounded-card border border-border bg-surface shadow-sm">
            <Pagination
              stats={{ from: `${from ?? '0'}`, to: `${to ?? '0'}`, total: `${total ?? '0'}` }}
              links={links ?? []}
              onClickPageButton={(url) => setPaginationUrl(url)}
              onClickNext={() => setPaginationUrl((berikutnya as string) ?? '')}
              onClickPrevious={() => setPaginationUrl((sebelumnya as string) ?? '')}
            />
          </div>
        )}
      </div>

      {/* SPEC-05 — apa yang sebenarnya terjadi saat gaji dibayar */}
      <p className="flex items-start gap-1.5 rounded-lg bg-info-subtle px-3.25 py-2 text-sm leading-[17px] text-info">
        <Info size={13} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
        <span>
          Membayar gaji langsung masuk buku besar: tiap pembayaran dicatat sebagai beban &ldquo;Beban Gaji&rdquo; pada
          tanggal pembayarannya, jadi angkanya ikut terbawa ke Laporan Pendapatan bulan itu. Gaji yang sudah dibayar di
          muka sudah terhitung di kolom Sudah dibayar sejak daftarnya dibuat.
        </span>
      </p>

      {membayar && (
        <PaySalaryDialog baris={membayar} bulan={bulanTeks} isOpen={!!membayar} onClose={() => setMembayar(null)} />
      )}
    </div>
  );
};

MonthlySalaryPage.themeable = true;

export default MonthlySalaryPage;
