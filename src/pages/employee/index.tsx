import { ChevronDown, ChevronUp, Eye, Info, Pencil, Plus, RotateCcw, Search } from 'lucide-react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useMemo, useState } from 'react';

import EmployeeCardList, { inisialKaryawan, namaLengkap } from '@/components/employee/EmployeeCardList';
import EmployeeDetailSheet from '@/components/employee/EmployeeDetailSheet';
import ReactivateEmployeeDialog from '@/components/employee/ReactivateEmployeeDialog';
import { ThemedSelect } from '@/components/Form';
import Pagination from '@/components/Pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FilterTabs } from '@/components/ui/filter-tabs';
import { Input } from '@/components/ui/input';
import Kpi from '@/components/ui/kpi';
import Skeleton from '@/components/ui/skeleton';
import useFetchEmployee, { useFetchUnpaginatedEmployee } from '@/hooks/query/useFetchEmployee';
import { cn } from '@/lib/cn';
import { EmployeeData } from '@/typings/employee';
import { ThemeablePage } from '@/typings/page';
import { useDebounceValue } from '@/utils/debounce';
import { controlStyle } from '@/utils/style';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

// Disalin PERSIS dari /customer dan /transaction — tiga daftar di aplikasi yang sama
// tidak boleh punya ritme yang berbeda.
const TH = 'border-b border-border px-2.5 pb-1.75 pt-2.25 text-xs font-bold text-foreground-subtle';
const TD = 'border-b border-border px-2.5 py-2 align-middle text-base';

/** Kolom yang benar-benar ada di tabel `employees`, jadi aman dipakai `order_by`. */
const SORTABLE: Record<string, string> = {
  nama: 'first_name',
  jabatan: 'position',
  gaji: 'salary',
};

const SORT_OPTIONS = [
  { label: 'Nama A–Z', value: 'nama:asc' },
  { label: 'Nama Z–A', value: 'nama:desc' },
  { label: 'Gaji tertinggi', value: 'gaji:desc' },
  { label: 'Gaji terendah', value: 'gaji:asc' },
];

type Kolom = { key: string; label: string; align?: 'right'; width?: string; className?: string };

const COLUMNS: Kolom[] = [
  { key: 'nama', label: 'Nama', width: '34%' },
  { key: 'jabatan', label: 'Jabatan', width: '170px' },
  { key: 'gaji', label: 'Gaji per bulan', align: 'right', width: '150px' },
  { key: 'akun', label: 'Akun login', width: '150px', className: 'hidden lg:table-cell' },
  { key: 'aksi', label: '', align: 'right', width: '120px' },
];

/**
 * Tiga keadaan, bukan dua.
 *
 * `undefined` berarti "jangan kirim `where.active` sama sekali" — itulah tab Semua.
 * Menuliskannya sebagai `where: {}` bukan hal yang sama: `WhereFilter` akan tetap
 * dipanggil dengan array kosong.
 */
const STATUS: Record<string, boolean | undefined> = {
  aktif: true,
  nonaktif: false,
  semua: undefined,
};

const ariaSort = (aktif: boolean, dir: 'asc' | 'desc'): 'ascending' | 'descending' | undefined => {
  if (!aktif) return undefined;
  return dir === 'asc' ? 'ascending' : 'descending';
};

/**
 * Daftar karyawan.
 *
 * Layar lama mengunci daftarnya ke `where: { active: true }`, sehingga tombol Deactivate
 * di halaman detail membuat orangnya LENYAP dari satu-satunya daftar yang ada — tanpa
 * saringan, tanpa jalan kembali. Saringan status di sini memakai filter `where` yang
 * sudah tersedia di `BaseFilter`, jadi tidak ada endpoint baru.
 *
 * Kolom "Akun Dashboard" yang isinya "Aktif / Tidak Aktif" juga diganti: kata yang sama
 * persis dengan status karyawannya sendiri, untuk dua hal yang sama sekali berbeda.
 */
const EmployeePage: NextPage & ThemeablePage = () => {
  const [status, setStatus] = useState('aktif');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'nama', dir: 'asc' });
  const [pageSize, setPageSize] = useState(10);
  const [paginationUrl, setPaginationUrl] = useState('');
  const [mengaktifkan, setMengaktifkan] = useState<EmployeeData | null>(null);
  // Rinciannya modal, bukan halaman: isinya tidak sampai satu layar, dan yang dilakukan
  // orang di sini memeriksa beberapa orang berturut-turut tanpa kehilangan tempat di daftar.
  const [dirinci, setDirinci] = useState<EmployeeData | null>(null);
  const [tutupSheet, setTutupSheet] = useState(false);

  const { push } = useRouter();
  const debouncedSearch = useDebounceValue(search, 500);

  /** Menyaring berarti kembali ke halaman satu — `forceUrl` menyimpan filter yang lama. */
  const saring =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      setPaginationUrl('');
      set(value);
    };

  const aktif = STATUS[status];

  const { data: dataEmployee, isLoading } = useFetchEmployee({
    search: debouncedSearch,
    order_by: { [SORTABLE[sort.key] ?? 'first_name']: sort.dir },
    ...(aktif === undefined ? {} : { where: { active: aktif } }),
    per_page: pageSize,
    forceUrl: paginationUrl || undefined,
  });

  /**
   * Angka ringkasan dari SATU permintaan tanpa paginasi, bukan empat permintaan berhitung.
   * Karyawan sebuah toko ada di orde puluhan, jadi menjumlahkannya di sini lebih murah
   * daripada empat kali `per_page: 1` hanya untuk membaca `total`-nya.
   */
  const { data: dataSemua, isLoading: memuatRingkasan } = useFetchUnpaginatedEmployee();

  const ringkasan = useMemo(() => {
    const semua = dataSemua?.data?.employees ?? [];
    const yangAktif = semua.filter((e) => e.active !== false);
    return {
      aktif: yangAktif.length,
      nonaktif: semua.length - yangAktif.length,
      akun: yangAktif.filter((e) => e.has_dashboard_account).length,
      gaji: yangAktif.reduce((jumlah, e) => jumlah + +(e.salary ?? 0), 0),
    };
  }, [dataSemua]);

  const {
    data: rows,
    from,
    to,
    total,
    links,
    next_page_url: berikutnya,
    prev_page_url: sebelumnya,
  } = dataEmployee?.data?.employees ?? {};

  const toggleSort = (key: string) => {
    if (!SORTABLE[key]) return;
    saring(setSort)(sort.key === key ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  };

  const kelas = (key: string) => COLUMNS.find((c) => c.key === key)?.className;
  const signature = `${paginationUrl}|${debouncedSearch}|${status}|${sort.key}${sort.dir}|${pageSize}`;

  /** Pesan kosong diturunkan dari penyaring yang BENAR-BENAR aktif. */
  const kosong = useMemo(() => {
    if (debouncedSearch) {
      return {
        judul: `Tidak ada hasil untuk "${debouncedSearch}"`,
        pesan:
          status === 'aktif'
            ? 'Pencarian hanya membaca karyawan aktif. Coba lihat di tab Semua.'
            : 'Pencarian membaca nama depan dan nama belakang karyawan.',
      };
    }
    if (status === 'nonaktif') {
      return {
        judul: 'Tidak ada karyawan nonaktif',
        pesan: 'Semua orang di daftar ini masih bekerja.',
      };
    }
    return {
      judul: 'Belum ada karyawan',
      pesan: 'Gaji dan jabatan yang ditambahkan di sini dipakai untuk membuat daftar gaji tiap bulan.',
    };
  }, [debouncedSearch, status]);

  return (
    <div className="flex flex-col gap-2.5">
      {/* SPEC-01 — judul, penjelasan, dan satu aksi utama */}
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="min-w-0">
          <h1 className="text-lg font-bold">Karyawan</h1>
          <p className="mt-0.5 text-sm text-foreground-subtle">
            Orang yang bekerja di toko. Yang berstatus aktif ikut masuk daftar gaji tiap bulan.
          </p>
        </div>

        <Link href="/employee/add">
          <Button size="sm">
            <Plus strokeWidth={2.2} aria-hidden /> Tambah karyawan
          </Button>
        </Link>
      </div>

      {/* SPEC-02 — empat angka yang menjawab pertanyaan pertama saat halaman dibuka */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Karyawan aktif"
          nilai={memuatRingkasan ? undefined : ringkasan.aktif}
          ket="ikut daftar gaji bulan ini"
        />
        <Kpi label="Nonaktif" nilai={memuatRingkasan ? undefined : ringkasan.nonaktif} ket="tidak ikut daftar gaji" />
        <Kpi
          label="Punya akun login"
          nilai={memuatRingkasan ? undefined : ringkasan.akun}
          ket={`dari ${ringkasan.aktif} orang yang aktif`}
        />
        <Kpi
          label="Gaji sebulan"
          nilai={memuatRingkasan ? undefined : ringkasan.gaji}
          ket="kalau semuanya dibayar penuh"
        />
      </div>

      {/* SPEC-03 — saringan status, pencarian, dan sortir untuk layar sempit */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <FilterTabs
          aria-label="Saring karyawan menurut status"
          value={status}
          onChange={saring(setStatus)}
          tabs={[
            { value: 'aktif', label: 'Aktif', count: memuatRingkasan ? undefined : ringkasan.aktif },
            { value: 'nonaktif', label: 'Nonaktif', count: memuatRingkasan ? undefined : ringkasan.nonaktif },
            {
              value: 'semua',
              label: 'Semua',
              count: memuatRingkasan ? undefined : ringkasan.aktif + ringkasan.nonaktif,
            },
          ]}
        />

        <div className="flex w-full flex-wrap items-center gap-1.75 md:w-auto">
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

          {/* Hanya di layar sempit: di tabel, sortirnya ada di header kolom. */}
          <div className="min-w-0 flex-1 md:hidden">
            <ThemedSelect
              name="sortir"
              instanceId="sortir-karyawan"
              aria-label="Urutkan karyawan"
              value={SORT_OPTIONS.find((o) => o.value === `${sort.key}:${sort.dir}`) ?? SORT_OPTIONS[0]}
              options={SORT_OPTIONS}
              additionalStyle={controlStyle}
              onChange={(val) => {
                const [key, dir] = `${(val as { value?: string })?.value ?? 'nama:asc'}`.split(':');
                saring(setSort)({ key, dir: dir as 'asc' | 'desc' });
              }}
            />
          </div>
        </div>
      </div>

      {/* SPEC-04 — tabel mulai dari md; di bawah itu tiap baris jadi kartu */}
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

              {!isLoading && rows?.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-2.5 py-12 text-center">
                    <p className="text-base font-medium">{kosong.judul}</p>
                    <p className="mt-1 text-sm text-foreground-muted">{kosong.pesan}</p>
                  </td>
                </tr>
              )}

              {!isLoading &&
                rows?.map((row) => {
                  const nama = namaLengkap(row);
                  const nonaktif = row.active === false;
                  const gaji = +(row.salary ?? 0);

                  return (
                    <tr key={row.id} className="transition-colors duration-fast hover:bg-surface-raised">
                      <td className={cn(TD, 'max-w-0')}>
                        <div className={cn('flex items-center gap-2.25', nonaktif && 'opacity-60')}>
                          <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-accent-subtle text-2xs font-bold text-accent">
                            {inisialKaryawan(row.first_name, row.last_name)}
                          </span>
                          <span className="truncate font-medium" title={nama}>
                            {nama}
                          </span>
                        </div>
                      </td>

                      <td className={cn(TD, 'truncate text-foreground-muted')}>{row.position || '—'}</td>

                      {/* Gaji karyawan nonaktif sengaja tidak ditampilkan: ia tidak ikut
                          dibuatkan baris gaji bulan berikutnya, jadi angkanya akan terbaca
                          seperti kewajiban yang masih berjalan. */}
                      <td className={cn(TD, 'whitespace-nowrap text-right font-mono font-semibold tabular-nums')}>
                        {nonaktif || gaji === 0 ? (
                          <span className="font-normal text-foreground-subtle">—</span>
                        ) : (
                          formatNumber(gaji)
                        )}
                      </td>

                      <td className={cn(TD, kelas('akun'))}>
                        {row.has_dashboard_account ? (
                          <Badge variant="info">Ada</Badge>
                        ) : (
                          <span className="text-sm text-foreground-subtle">Belum dibuat</span>
                        )}
                      </td>

                      <td className={TD}>
                        <div className="flex items-center justify-end gap-1">
                          {nonaktif ? (
                            <>
                              {/* Lihat tetap ada untuk yang nonaktif: sejak rinciannya berupa
                                  modal, baris inilah satu-satunya jalan membukanya — tanpa
                                  tombol ini datanya tidak bisa diperiksa sama sekali. */}
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                aria-label={`Lihat ${nama}`}
                                onClick={() => setDirinci(row)}
                              >
                                <Eye strokeWidth={1.7} aria-hidden />
                              </Button>
                              <Button size="xs" variant="outline" onClick={() => setMengaktifkan(row)}>
                                <RotateCcw strokeWidth={1.9} aria-hidden /> Aktifkan
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                aria-label={`Lihat ${nama}`}
                                onClick={() => setDirinci(row)}
                              >
                                <Eye strokeWidth={1.7} aria-hidden />
                              </Button>
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                aria-label={`Ubah ${nama}`}
                                onClick={() => push(`/employee/${row.id}/edit`)}
                              >
                                <Pencil strokeWidth={1.8} aria-hidden />
                              </Button>
                            </>
                          )}
                        </div>
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

      <div className="md:hidden">
        <EmployeeCardList
          rows={rows}
          loading={isLoading}
          perPage={pageSize}
          empty={kosong}
          onOpen={setDirinci}
          onEdit={(row) => push(`/employee/${row.id}/edit`)}
          onReactivate={setMengaktifkan}
        />

        <div className="mt-2 overflow-hidden rounded-card border border-border bg-surface shadow-sm">
          <Pagination
            stats={{ from: `${from ?? '0'}`, to: `${to ?? '0'}`, total: `${total ?? '0'}` }}
            links={links ?? []}
            onClickPageButton={(url) => setPaginationUrl(url)}
            onClickNext={() => setPaginationUrl((berikutnya as string) ?? '')}
            onClickPrevious={() => setPaginationUrl((sebelumnya as string) ?? '')}
          />
        </div>
      </div>

      {/* SPEC-05 — satu kalimat yang menjelaskan ke mana perginya karyawan yang dinonaktifkan */}
      <p className="flex items-start gap-1.5 rounded-lg bg-info-subtle px-3.25 py-2 text-sm leading-[17px] text-info">
        <Info size={13} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
        <span>
          Menonaktifkan karyawan tidak menghapusnya. Ia pindah ke tab Nonaktif, berhenti ikut dibuatkan baris gaji bulan
          berikutnya, dan bisa diaktifkan lagi dari sana. Daftar gaji bulan yang sudah jadi tidak ikut berubah.
        </span>
      </p>

      {/* `onClosed`, bukan membuang datanya di `onClose`: sheet butuh isinya tetap ada
          selama animasi keluar berjalan, sama dengan sheet rincian lain. */}
      {dirinci && (
        <EmployeeDetailSheet
          employee={dirinci}
          open={!!dirinci && !tutupSheet}
          onClose={() => setTutupSheet(true)}
          onClosed={() => {
            setDirinci(null);
            setTutupSheet(false);
          }}
        />
      )}

      {mengaktifkan && (
        <ReactivateEmployeeDialog
          employeeId={mengaktifkan.id}
          nama={namaLengkap(mengaktifkan)}
          isOpen={!!mengaktifkan}
          onClose={() => setMengaktifkan(null)}
        />
      )}
    </div>
  );
};

EmployeePage.themeable = true;

export default EmployeePage;
