import dayjs from 'dayjs';
import { ChevronDown, ChevronUp, Info, Plus, Search } from 'lucide-react';
import { NextPage } from 'next';
import React, { useMemo, useState } from 'react';

import CreateExpenseDialog from '@/components/expense/CreateExpenseDialog';
import ExpenseCardList, { bebanOtomatis, SumberDana, TandaOtomatis } from '@/components/expense/ExpenseCardList';
import Pagination from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import DateRangeFilter, { DateRange } from '@/components/ui/date-range-filter';
import FilterTabs from '@/components/ui/filter-tabs';
import { Input } from '@/components/ui/input';
import Kpi from '@/components/ui/kpi';
import Skeleton from '@/components/ui/skeleton';
import { useFetchExpense } from '@/hooks/query/useFetchExpense';
import { cn } from '@/lib/cn';
import { ThemeablePage } from '@/typings/page';
import { useDebounceValue } from '@/utils/debounce';
import { formatDateYYYYMMDDHHmmss } from '@/utils/format';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

// Disalin PERSIS dari /transaction dan /debt — daftar-daftar di aplikasi ini tidak boleh
// punya ritme yang berbeda.
const TH = 'border-b border-border px-2.5 pb-1.75 pt-2.25 text-xs font-bold text-foreground-subtle';
const TD = 'border-b border-border px-2.5 py-2 align-middle text-base';

/** Kolom yang benar-benar bisa disortir server. */
const SORTABLE: Record<string, string> = {
  waktu: 'date',
  nama: 'name',
  jumlah: 'amount',
};

type Kolom = { key: string; label: string; align?: 'right'; width?: string; className?: string };

const COLUMNS: Kolom[] = [
  { key: 'waktu', label: 'Waktu', width: '150px' },
  { key: 'nama', label: 'Nama beban', width: '240px' },
  { key: 'keterangan', label: 'Keterangan' },
  { key: 'pencatat', label: 'Dicatat oleh', width: '150px', className: 'hidden lg:table-cell' },
  { key: 'sumber', label: 'Sumber dana', width: '140px' },
  { key: 'jumlah', label: 'Jumlah', align: 'right', width: '150px' },
];

const ariaSort = (aktif: boolean, dir: 'asc' | 'desc'): 'ascending' | 'descending' | undefined => {
  if (!aktif) return undefined;
  return dir === 'asc' ? 'ascending' : 'descending';
};

/**
 * Beban — semua uang keluar yang bukan pembelian barang.
 *
 * Tiap baris di sini menulis jurnal D Beban / K sumber dananya lewat
 * `ExpenseObserver::created`. Observer itu TIDAK bereaksi pada `updated` maupun
 * `deleted`: mengubah nominal tidak menyentuh jurnal yang sudah ditulis, dan menghapus
 * beban meninggalkan ayatnya menggantung tanpa dokumen penjelas. Karena itu baris yang
 * sudah tercatat sengaja dibiarkan hanya-baca meski API-nya menyediakan PATCH dan DELETE.
 */
const ExpensePage: NextPage & ThemeablePage = () => {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'waktu', dir: 'desc' });
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

  const rentang = useMemo(() => {
    if (!dari || !sampai) return {};
    return {
      where_greater_equal: { date: formatDateYYYYMMDDHHmmss(dayjs(dari).startOf('day')) },
      where_lower_equal: { date: formatDateYYYYMMDDHHmmss(dayjs(sampai).endOf('day')) },
    };
  }, [dari, sampai]);

  const { data, isLoading } = useFetchExpense({
    paginated: true,
    per_page: pageSize,
    search: debouncedSearch,
    order_by: { [SORTABLE[sort.key] ?? 'date']: sort.dir },
    forceUrl: paginationUrl || undefined,
    ...rentang,
    ...(tab === 'all' ? {} : { where: { payment_method: tab } }),
  });

  const {
    data: rows,
    from,
    to,
    total,
    links,
    next_page_url: berikutnya,
    prev_page_url: sebelumnya,
  } = data?.data?.expenses ?? {};

  const totals = data?.data?.totals;

  const toggleSort = (key: string) => {
    if (!SORTABLE[key]) return;
    saring(setSort)(sort.key === key ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' });
  };

  const kelas = (key: string) => COLUMNS.find((c) => c.key === key)?.className;
  const signature = `${paginationUrl}|${tab}|${debouncedSearch}|${sort.key}${sort.dir}|${pageSize}|${dari}|${sampai}`;

  const kosong = useMemo(() => {
    if (debouncedSearch) {
      return { judul: `Tidak ada hasil untuk "${debouncedSearch}"`, pesan: 'Pencarian membaca nama dan keterangan.' };
    }
    if (tab !== 'all') {
      return {
        judul: `Belum ada beban dari ${tab === 'cash' ? 'kas' : 'bank'}`,
        pesan: 'Beban dengan sumber dana lain masih bisa dilihat di tab Semua.',
      };
    }
    if (dari && sampai) {
      return { judul: 'Belum ada beban di periode ini', pesan: 'Coba pilih tanggal yang lain.' };
    }
    return {
      judul: 'Belum ada beban tercatat',
      pesan:
        'Listrik, sewa, ongkir, bahan habis pakai — semua uang keluar yang bukan pembelian barang dicatat di sini.',
    };
  }, [debouncedSearch, tab, dari, sampai]);

  const ketPeriode =
    dari && sampai ? `${dayjs(dari).format('D MMM')} – ${dayjs(sampai).format('D MMM YYYY')}` : 'Semua waktu';

  return (
    <div className="flex flex-col gap-2.5">
      {/* SPEC-01 — apa yang terjadi di halaman ini, dan satu tombol untuk menambah */}
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="min-w-0">
          <h1 className="text-lg font-bold">Beban</h1>
          <p className="mt-0.5 text-sm text-foreground-subtle">
            Beban yang disimpan langsung masuk buku besar dan mengurangi sumber dananya.
          </p>
        </div>

        <Button size="sm" onClick={() => setCatatOpen(true)}>
          <Plus strokeWidth={2.2} aria-hidden />
          Catat beban
        </Button>
      </div>

      {/* SPEC-02 */}
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Kpi label="Total beban" nilai={totals?.total} ket={ketPeriode} />
        <Kpi label="Dibayar kas" nilai={totals?.cash} ket={totals ? `${totals.cash_count} catatan` : ''} />
        <Kpi label="Dibayar bank" nilai={totals?.bank} ket={totals ? `${totals.bank_count} catatan` : ''} />
      </div>

      {/* SPEC-03 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          aria-label="Filter sumber dana"
          value={tab}
          onChange={saring(setTab)}
          tabs={[
            { value: 'all', label: 'Semua', count: totals?.count },
            { value: 'cash', label: 'Kas', count: totals?.cash_count },
            { value: 'bank', label: 'Bank', count: totals?.bank_count },
          ]}
        />

        <div className="flex w-full flex-wrap items-center gap-1.75 md:w-auto">
          <div className="relative w-full md:w-[240px]">
            <Search
              size={14}
              strokeWidth={1.9}
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-2.5 z-10 my-auto text-foreground-subtle"
            />
            <Input
              size="sm"
              className="rounded-control pl-[31px] pr-2.5"
              placeholder="Cari nama atau keterangan…"
              aria-label="Cari beban"
              value={search}
              onChange={(e) => saring(setSearch)(e.target.value)}
            />
          </div>

          <DateRangeFilter value={range} onChange={saring(setRange)} />
        </div>
      </div>

      {/* Di bawah md tiap baris jadi kartu. */}
      <div className="md:hidden">
        <ExpenseCardList rows={rows} loading={isLoading} perPage={pageSize} empty={kosong} />

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

      {/* SPEC-04 */}
      <div className="hidden overflow-hidden rounded-card border border-border bg-surface shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-raised">
                {COLUMNS.map((col) => {
                  const aktif = sort.key === col.key;
                  const bisaUrut = SORTABLE[col.key];
                  const Arrow = sort.dir === 'asc' ? ChevronUp : ChevronDown;

                  return (
                    <th
                      key={col.key}
                      scope="col"
                      style={col.width ? { width: col.width } : undefined}
                      className={cn(TH, col.align === 'right' ? 'text-right' : 'text-left', col.className)}
                      aria-sort={ariaSort(aktif, sort.dir)}
                    >
                      {bisaUrut ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(col.key)}
                          className={cn(
                            'group inline-flex items-center gap-1 transition-colors duration-fast hover:text-foreground',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25',
                            aktif && 'text-foreground'
                          )}
                        >
                          {col.label}
                          {aktif ? (
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
                rows?.map((row) => (
                  <tr key={row.id} className="transition-colors duration-fast hover:bg-surface-raised">
                    <td className={cn(TD, 'whitespace-nowrap font-mono text-foreground-subtle')}>
                      {dayjs(row.date).format('DD MMM YYYY HH.mm')}
                    </td>
                    <td className={cn(TD, 'max-w-0 truncate font-medium')} title={row.name}>
                      <span className="inline-flex max-w-full items-center gap-1.75">
                        <span className="truncate">{row.name}</span>
                        {bebanOtomatis(row) && <TandaOtomatis />}
                      </span>
                    </td>
                    <td className={cn(TD, 'max-w-0 truncate text-foreground-muted')} title={row.description}>
                      {row.description || '—'}
                    </td>
                    <td className={cn(TD, kelas('pencatat'), 'truncate whitespace-nowrap text-foreground-muted')}>
                      {row.user_name || '—'}
                    </td>
                    <td className={cn(TD, 'whitespace-nowrap')}>
                      <SumberDana metode={row.payment_method} />
                    </td>
                    <td className={cn(TD, 'whitespace-nowrap text-right font-mono font-semibold tabular-nums')}>
                      {formatNumber(+row.amount)}
                    </td>
                  </tr>
                ))}
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

      {/* Menyatakan aturan yang selama ini hanya diketahui dari mencoba. */}
      <p className="flex items-start gap-1.5 rounded-lg bg-info-subtle px-3.25 py-2 text-sm leading-[17px] text-info">
        <Info size={13} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
        <span>
          Beban yang sudah tercatat tidak bisa diubah atau dihapus dari sini — jurnalnya sudah ditulis dan tidak ikut
          berubah. Beban bertanda <span className="font-medium">otomatis</span> lahir dari gaji, audit barang, atau
          ongkir transaksi.
        </span>
      </p>

      <CreateExpenseDialog isOpen={catatOpen} onClose={() => setCatatOpen(false)} />
    </div>
  );
};

ExpensePage.themeable = true;

export default ExpensePage;
