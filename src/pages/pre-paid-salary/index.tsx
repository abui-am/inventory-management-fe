import dayjs from 'dayjs';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Info, Plus, Search } from 'lucide-react';
import { NextPage } from 'next';
import React, { useMemo, useState } from 'react';

import { inisialKaryawan } from '@/components/employee/EmployeeCardList';
import Pagination from '@/components/Pagination';
import AdvanceSalaryCardList from '@/components/pre-paid-salary/AdvanceSalaryCardList';
import CreateAdvanceSalaryDialog from '@/components/pre-paid-salary/CreateAdvanceSalaryDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DateRangeFilter, { DateRange } from '@/components/ui/date-range-filter';
import { Input } from '@/components/ui/input';
import Kpi from '@/components/ui/kpi';
import Skeleton from '@/components/ui/skeleton';
import { useFetchAdvancePayrolls } from '@/hooks/query/useFetchAdvancePayrolls';
import { useFetchUnpaginatedEmployee } from '@/hooks/query/useFetchEmployee';
import { cn } from '@/lib/cn';
import { Datum } from '@/typings/advance-payrolls';
import { EmployeeData } from '@/typings/employee';
import { ThemeablePage } from '@/typings/page';
import { useDebounceValue } from '@/utils/debounce';
import { formatDateYYYYMM, formatDateYYYYMMDDHHmmss, formatNumber } from '@/utils/format';

// Disalin PERSIS dari /expense dan /employee.
const TH = 'border-b border-border px-2.5 pb-1.75 pt-2.25 text-xs font-bold text-foreground-subtle';
const TD = 'border-b border-border px-2.5 py-2 align-middle text-base';

/** Kolom yang benar-benar ada di tabel `advance_payrolls`, jadi aman dipakai `order_by`. */
const SORTABLE: Record<string, string> = {
  dibayar: 'created_at',
  jumlah: 'amount',
  jabatan: 'employee_position',
};

type Kolom = { key: string; label: string; align?: 'right'; width?: string; className?: string };

const COLUMNS: Kolom[] = [
  { key: 'nama', label: 'Nama', width: '28%' },
  { key: 'jabatan', label: 'Jabatan', width: '170px' },
  { key: 'bulan', label: 'Bulan gajian', width: '140px' },
  { key: 'dibayar', label: 'Dibayar', width: '140px', className: 'hidden lg:table-cell' },
  { key: 'jumlah', label: 'Jumlah', align: 'right', width: '150px' },
  { key: 'sisa', label: 'Sisa gaji bulan itu', align: 'right', width: '180px' },
];

const ariaSort = (aktif: boolean, dir: 'asc' | 'desc'): 'ascending' | 'descending' | undefined => {
  if (!aktif) return undefined;
  return dir === 'asc' ? 'ascending' : 'descending';
};

/**
 * Gaji di Muka — gaji yang dibayarkan sebelum tanggal gajian.
 *
 * Yang diperbaiki dari layar lama:
 *
 * - Tabelnya mencatat pembayaran tapi tidak pernah menjawab pertanyaan yang membawa orang
 *   ke sini: untuk bulan gajian ini, siapa yang sudah mengambil dan BERAPA SISANYA. Sisa
 *   itu yang menentukan daftar gaji nanti lunas atau belum (`PayrollRepository`:
 *   `paid_amount >= salary` → LUNAS).
 * - Saringan tanggalnya memakai `created_at` — kapan uangnya dibayarkan — padahal
 *   pengelompokan yang dipakai akuntansinya `payroll_month`. Sekarang keduanya ada, dan
 *   masing-masing diberi label.
 * - Akibat akuntansinya tidak pernah disebut: mencatat gaji di muka LANGSUNG mengeluarkan
 *   kas dan menambah Beban (`AdvancePayrollObserver` → `CreatePayrollExpenseJob`).
 *
 * Gaji karyawan tidak ikut di respons `advance_payrolls` (hanya nama, jabatan, dan id),
 * jadi kolom sisa menggabungkannya dengan daftar karyawan tanpa paginasi — permintaan yang
 * sama yang sudah dipakai /employee untuk angka ringkasannya.
 */
const PrepaidSalaryPage: NextPage & ThemeablePage = () => {
  const [bulan, setBulan] = useState(() => dayjs().startOf('month').toDate());
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'dibayar', dir: 'desc' });
  const [pageSize, setPageSize] = useState(10);
  const [paginationUrl, setPaginationUrl] = useState('');
  const [range, setRange] = useState<DateRange>([null, null]);
  const [catatOpen, setCatatOpen] = useState(false);

  const debouncedSearch = useDebounceValue(search, 500);

  const saring =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      setPaginationUrl('');
      set(value);
    };

  const [dari, sampai] = range;
  const bulanKey = formatDateYYYYMM(bulan);

  const rentang = useMemo(() => {
    if (!dari || !sampai) return {};
    return {
      where_greater_equal: { created_at: formatDateYYYYMMDDHHmmss(dayjs(dari).startOf('day')) },
      where_lower_equal: { created_at: formatDateYYYYMMDDHHmmss(dayjs(sampai).endOf('day')) },
    };
  }, [dari, sampai]);

  const saringan = {
    // `search` dikirim HANYA kalau diisi. `SearchFilter` di backend mengiterasi
    // `$model->searchable`, dan sampai properti itu ada di modelnya, mengirim string
    // kosong pun membuat endpoint ini melempar 500 — bukan hasil kosong.
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    where: { payroll_month: bulanKey },
    ...rentang,
  };

  const { data, isLoading } = useFetchAdvancePayrolls({
    paginated: true,
    per_page: pageSize,
    order_by: { [SORTABLE[sort.key] ?? 'created_at']: sort.dir },
    forceUrl: paginationUrl || undefined,
    ...saringan,
  });

  /** Seluruh catatan bulan itu — untuk angka ringkasan dan untuk menghitung sisa per orang. */
  const { data: dataBulan, isLoading: memuatRingkasan } = useFetchAdvancePayrolls({
    paginated: false,
    where: { payroll_month: bulanKey },
  });

  const { data: dataKaryawan } = useFetchUnpaginatedEmployee();

  const semuaBulanIni = useMemo(() => {
    const isi = dataBulan?.data?.advance_payrolls as unknown;
    if (Array.isArray(isi)) return isi as Datum[];
    return ((isi as { data?: Datum[] })?.data ?? []) as Datum[];
  }, [dataBulan]);

  /** Jumlah yang sudah diambil tiap karyawan untuk bulan gajian yang sedang dipilih. */
  const diambilPerOrang = useMemo(() => {
    const peta = new Map<string, number>();
    semuaBulanIni.forEach((row) => {
      const id = row.employee?.id;
      if (!id) return;
      peta.set(id, (peta.get(id) ?? 0) + +(row.amount ?? 0));
    });
    return peta;
  }, [semuaBulanIni]);

  const gajiPerOrang = useMemo(() => {
    const peta = new Map<string, number>();
    (dataKaryawan?.data?.employees ?? []).forEach((e: EmployeeData) => peta.set(e.id, +(e.salary ?? 0)));
    return peta;
  }, [dataKaryawan]);

  const karyawanAktif = (dataKaryawan?.data?.employees ?? []).filter((e: EmployeeData) => e.active !== false).length;

  const ringkasan = useMemo(() => {
    const total = semuaBulanIni.reduce((jumlah, row) => jumlah + +(row.amount ?? 0), 0);
    const orang = diambilPerOrang.size;
    let sisa = 0;
    diambilPerOrang.forEach((diambil, id) => {
      sisa += Math.max((gajiPerOrang.get(id) ?? 0) - diambil, 0);
    });
    return { total, orang, rata: orang ? Math.round(total / orang) : 0, sisa };
  }, [semuaBulanIni, diambilPerOrang, gajiPerOrang]);

  const {
    data: rows,
    from,
    to,
    total,
    links,
    next_page_url: berikutnya,
    prev_page_url: sebelumnya,
  } = data?.data?.advance_payrolls ?? {};

  const toggleSort = (key: string) => {
    if (!SORTABLE[key]) return;
    saring(setSort)(sort.key === key ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' });
  };

  const kelas = (key: string) => COLUMNS.find((c) => c.key === key)?.className;
  const signature = `${paginationUrl}|${bulanKey}|${debouncedSearch}|${sort.key}${sort.dir}|${pageSize}|${dari}|${sampai}`;

  /** Sisa gaji orang itu untuk bulan yang dipilih; `undefined` selama gajinya belum datang. */
  const sisaGaji = (row: Datum): number | undefined => {
    const id = row.employee?.id;
    if (!id || !gajiPerOrang.has(id)) return undefined;
    return Math.max((gajiPerOrang.get(id) ?? 0) - (diambilPerOrang.get(id) ?? 0), 0);
  };

  const kosong = useMemo(() => {
    if (debouncedSearch) {
      return {
        judul: `Tidak ada hasil untuk "${debouncedSearch}"`,
        pesan: `Pencarian membaca nama karyawan, dan hanya di bulan gajian ${dayjs(bulan).format('MMMM YYYY')}.`,
      };
    }
    if (dari && sampai) {
      return {
        judul: 'Tidak ada yang dibayar di periode itu',
        pesan: 'Saringan tanggal membaca kapan uangnya dibayarkan, bukan bulan gajiannya. Coba longgarkan.',
      };
    }
    return {
      judul: `Belum ada gaji di muka untuk ${dayjs(bulan).format('MMMM YYYY')}`,
      pesan:
        'Daftar gaji bulan ini akan dibuat penuh untuk semua karyawan aktif. Catat di sini kalau ada yang mengambil gajinya lebih awal.',
    };
  }, [debouncedSearch, dari, sampai, bulan]);

  return (
    <div className="flex flex-col gap-2.5">
      {/* SPEC-01 */}
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="min-w-0">
          <h1 className="text-lg font-bold">Gaji di Muka</h1>
          <p className="mt-0.5 max-w-[620px] text-sm text-foreground-subtle">
            Gaji yang dibayarkan sebelum tanggal gajian. Jumlahnya otomatis terpotong dari daftar gaji bulan yang
            dipilih.
          </p>
        </div>

        <Button size="sm" onClick={() => setCatatOpen(true)}>
          <Plus strokeWidth={2.2} aria-hidden /> Catat gaji di muka
        </Button>
      </div>

      {/* SPEC-02 */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Dibayar di muka"
          nilai={memuatRingkasan ? undefined : ringkasan.total}
          ket={`untuk gaji ${dayjs(bulan).format('MMMM YYYY')}`}
        />
        <Kpi
          label="Karyawan"
          nilai={memuatRingkasan ? undefined : ringkasan.orang}
          ket={karyawanAktif ? `dari ${karyawanAktif} yang aktif` : ''}
        />
        <Kpi
          label="Rata-rata per orang"
          nilai={memuatRingkasan ? undefined : ringkasan.rata}
          ket="dari gaji sebulannya"
        />
        <Kpi
          label="Sisa dibayar nanti"
          nilai={memuatRingkasan ? undefined : ringkasan.sisa}
          ket="kalau tidak ada tambahan"
          tone="warning"
        />
      </div>

      {/* SPEC-03 — dua penyaring yang artinya berbeda, masing-masing diberi label */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.25">
          <span className="text-sm text-foreground-subtle">Bulan gajian</span>
          <div className="flex items-center gap-1.5">
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Bulan sebelumnya"
              onClick={() => saring(setBulan)(dayjs(bulan).subtract(1, 'month').toDate())}
            >
              <ChevronLeft strokeWidth={2} aria-hidden />
            </Button>
            <span className="flex h-8 min-w-[110px] items-center justify-center rounded-control border border-border-strong bg-surface px-3 text-base font-semibold">
              {dayjs(bulan).format('MMMM YYYY')}
            </span>
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Bulan berikutnya"
              onClick={() => saring(setBulan)(dayjs(bulan).add(1, 'month').toDate())}
            >
              <ChevronRight strokeWidth={2} aria-hidden />
            </Button>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-1.75 md:w-auto">
          <span className="text-sm text-foreground-subtle">Dibayar</span>
          <DateRangeFilter value={range} onChange={saring(setRange)} />
          <div className="relative w-full md:w-[230px]">
            <Search
              size={14}
              strokeWidth={1.9}
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-2.5 z-10 my-auto text-foreground-subtle"
            />
            <Input
              size="sm"
              className="rounded-control pl-[31px] pr-2.5"
              placeholder="Cari nama karyawan…"
              aria-label="Cari karyawan"
              value={search}
              onChange={(e) => saring(setSearch)(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* SPEC-04 */}
      <div className="hidden overflow-hidden rounded-card border border-border bg-surface shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-raised">
                {COLUMNS.map((col) => {
                  const aktifKolom = sort.key === col.key;
                  const bisaUrut = SORTABLE[col.key];
                  const Arrow = sort.dir === 'asc' ? ChevronUp : ChevronDown;

                  return (
                    <th
                      key={col.key}
                      scope="col"
                      style={col.width ? { width: col.width } : undefined}
                      className={cn(TH, col.align === 'right' ? 'text-right' : 'text-left', col.className)}
                      aria-sort={ariaSort(aktifKolom, sort.dir)}
                    >
                      {bisaUrut ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(col.key)}
                          className={cn(
                            'group inline-flex items-center gap-1 transition-colors duration-fast hover:text-foreground',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25',
                            aktifKolom && 'text-foreground'
                          )}
                        >
                          {col.label}
                          {aktifKolom ? (
                            <Arrow size={11} aria-hidden />
                          ) : (
                            <ChevronDown
                              size={11}
                              aria-hidden
                              className="opacity-0 transition-opacity duration-fast group-hover:opacity-60"
                            />
                          )}
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody key={signature} className="animate-in fade-in duration-200">
              {isLoading &&
                Array.from({ length: pageSize }, (_, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <tr key={i}>
                    {COLUMNS.map((col) => (
                      <td key={col.key} className={cn(TD, kelas(col.key))}>
                        <div className="flex h-[26px] items-center">
                          <Skeleton className="h-3.5 w-full" />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}

              {!isLoading && (rows?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-2.5 py-10 text-center">
                    <div className="text-base font-semibold">{kosong.judul}</div>
                    <div className="mx-auto mt-1 max-w-[420px] text-sm text-foreground-subtle">{kosong.pesan}</div>
                  </td>
                </tr>
              )}

              {!isLoading &&
                rows?.map((row) => {
                  const nama = `${row.employee?.first_name ?? ''} ${row.employee?.last_name ?? ''}`.trim();
                  const sisa = sisaGaji(row);

                  return (
                    <tr key={row.id} className="transition-colors duration-fast hover:bg-surface-raised">
                      <td className={TD}>
                        <span className="inline-flex min-w-0 items-center gap-2.25">
                          <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-accent-subtle text-2xs font-bold text-accent">
                            {inisialKaryawan(row.employee?.first_name, row.employee?.last_name)}
                          </span>
                          <span className="truncate font-medium">{nama || '—'}</span>
                        </span>
                      </td>
                      <td className={TD}>
                        <span className="text-foreground-muted">{row.employee_position || '—'}</span>
                      </td>
                      <td className={TD}>
                        <Badge variant="neutral">{dayjs(row.payroll_month).format('MMM YYYY')}</Badge>
                      </td>
                      <td className={cn(TD, kelas('dibayar'))}>
                        <span className="text-foreground-muted">{dayjs(row.created_at).format('DD MMM YYYY')}</span>
                      </td>
                      <td className={cn(TD, 'text-right')}>
                        <span className="font-mono font-semibold tabular-nums">{formatNumber(+(row.amount ?? 0))}</span>
                      </td>
                      <td className={cn(TD, 'text-right')}>
                        {sisa === undefined && <span className="text-foreground-subtle">…</span>}
                        {sisa === 0 && <Badge variant="success">Lunas</Badge>}
                        {!!sisa && (
                          <span className="font-mono tabular-nums text-foreground-muted">{formatNumber(sisa)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {!isLoading && (rows?.length ?? 0) > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-border bg-surface-raised px-2.5 py-2.25">
            <span className="text-sm text-foreground-subtle">
              {ringkasan.orang} dari {karyawanAktif || '…'} karyawan aktif sudah mengambil gaji di muka untuk{' '}
              {dayjs(bulan).format('MMMM YYYY')}
            </span>
            <span className="flex flex-wrap items-baseline gap-4.5 text-sm text-foreground-subtle">
              <span>
                Total di muka{' '}
                <span className="ml-1.5 font-mono text-base font-bold tabular-nums text-foreground">
                  {formatNumber(ringkasan.total)}
                </span>
              </span>
              <span>
                Sisa{' '}
                <span className="ml-1.5 font-mono text-base font-bold tabular-nums text-foreground">
                  {formatNumber(ringkasan.sisa)}
                </span>
              </span>
            </span>
          </div>
        )}
      </div>

      <div className="md:hidden">
        <AdvanceSalaryCardList rows={rows} loading={isLoading} perPage={pageSize} empty={kosong} sisaGaji={sisaGaji} />
      </div>

      <div className="mt-2 overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        <Pagination
          stats={{ from: `${from ?? 0}`, to: `${to ?? 0}`, total: `${total ?? 0}` }}
          onChangePerPage={(page) => {
            setPaginationUrl('');
            setPageSize(page?.value ?? 10);
          }}
          onClickPageButton={(url) => setPaginationUrl(url)}
          links={links ?? []}
          onClickNext={() => setPaginationUrl((berikutnya as string) ?? '')}
          onClickPrevious={() => setPaginationUrl((sebelumnya as string) ?? '')}
        />
      </div>

      <p className="flex items-start gap-2 rounded-card bg-info-subtle px-3.25 py-2.5 text-sm text-info">
        <Info size={14} strokeWidth={1.9} aria-hidden className="mt-px shrink-0" />
        <span>
          <span className="font-semibold">Uangnya keluar saat dicatat, bukan saat gajian.</span> Mencatat gaji di muka
          langsung mengurangi Kas dan menambah Beban hari itu juga. Yang menunggu tanggal gajian hanyalah pemotongannya
          di daftar gaji — kalau jumlahnya sudah sama dengan gajinya, barisnya langsung berstatus lunas.
        </span>
      </p>

      <CreateAdvanceSalaryDialog
        isOpen={catatOpen}
        onClose={() => setCatatOpen(false)}
        bulanAwal={bulan}
        sudahDiambil={(employeeId, bulanDipilih) =>
          bulanDipilih === bulanKey ? diambilPerOrang.get(employeeId) ?? 0 : 0
        }
      />
    </div>
  );
};

PrepaidSalaryPage.themeable = true;

export default PrepaidSalaryPage;
