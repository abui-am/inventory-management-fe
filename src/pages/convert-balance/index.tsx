import dayjs from 'dayjs';
import { ArrowLeftRight, ChevronDown, ChevronUp, Info, Search } from 'lucide-react';
import { NextPage } from 'next';
import React, { useMemo, useState } from 'react';

import CreateTopUpDialog from '@/components/convert-balance/CreateTopUpDialog';
import TopUpCardList from '@/components/convert-balance/TopUpCardList';
import { SumberDana } from '@/components/expense/ExpenseCardList';
import Pagination from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import DateRangeFilter, { DateRange } from '@/components/ui/date-range-filter';
import FilterTabs from '@/components/ui/filter-tabs';
import { Input } from '@/components/ui/input';
import Kpi from '@/components/ui/kpi';
import Skeleton from '@/components/ui/skeleton';
import { useFetchLedgerTopUps } from '@/hooks/query/useFetchLedgerTopUp';
import { cn } from '@/lib/cn';
import { ThemeablePage } from '@/typings/page';
import { useDebounceValue } from '@/utils/debounce';
import { formatDateYYYYMMDDHHmmss } from '@/utils/format';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

// Disalin PERSIS dari /expense dan /debt — daftar-daftar di aplikasi ini tidak boleh
// punya ritme yang berbeda.
const TH = 'border-b border-border px-2.5 pb-1.75 pt-2.25 text-xs font-bold text-foreground-subtle';
const TD = 'border-b border-border px-2.5 py-2 align-middle text-base';

/** Kolom yang benar-benar bisa disortir server. */
const SORTABLE: Record<string, string> = {
  waktu: 'created_at',
  sumber: 'payment_method',
  jumlah: 'amount',
};

type Kolom = { key: string; label: string; align?: 'right'; width?: string };

const COLUMNS: Kolom[] = [
  { key: 'waktu', label: 'Waktu', width: '170px' },
  { key: 'sumber', label: 'Sumber dana', width: '190px' },
  { key: 'tujuan', label: 'Akun tujuan' },
  { key: 'jumlah', label: 'Jumlah', align: 'right', width: '160px' },
];

const ariaSort = (aktif: boolean, dir: 'asc' | 'desc'): 'ascending' | 'descending' | undefined => {
  if (!aktif) return undefined;
  return dir === 'asc' ? 'ascending' : 'descending';
};

/**
 * Konversi Saldo — memindahkan uang ke sebuah akun buku besar.
 *
 * Satu baris di sini menulis D akun tujuan / K sumber dananya lewat
 * `CreateLedgerJob::setLedgerTopUpLedger`. Sumber "uang pribadi" mengkredit MODAL, bukan
 * akun kas: konversi itu setoran modal pemilik dan menambah kekayaan toko, sementara tiga
 * sumber lainnya hanya memindahkan uang yang sudah ada. Karena itu KPI-nya dipisah, dan
 * barisnya diberi keterangan — layar lama menampilkan keempatnya sebagai hal yang sama.
 *
 * Seperti beban, baris yang sudah tercatat tidak bisa diubah atau dihapus: backend tidak
 * menyediakan PATCH/DELETE untuk top up, dan jurnalnya memang tidak dihitung ulang.
 */
const ConvertBalancePage: NextPage & ThemeablePage = () => {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'waktu', dir: 'desc' });
  const [pageSize, setPageSize] = useState(10);
  const [paginationUrl, setPaginationUrl] = useState('');
  const [range, setRange] = useState<DateRange>([null, null]);
  const [konversiOpen, setKonversiOpen] = useState(false);

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
      where_greater_equal: { created_at: formatDateYYYYMMDDHHmmss(dayjs(dari).startOf('day')) },
      where_lower_equal: { created_at: formatDateYYYYMMDDHHmmss(dayjs(sampai).endOf('day')) },
    };
  }, [dari, sampai]);

  const { data, isLoading } = useFetchLedgerTopUps({
    paginated: true,
    per_page: pageSize,
    search: debouncedSearch,
    order_by: { [SORTABLE[sort.key] ?? 'created_at']: sort.dir },
    forceUrl: paginationUrl || undefined,
    ...rentang,
    ...(tab === 'all' ? {} : { where: { ledger_account_id: tab } }),
  });

  const {
    data: rows,
    from,
    to,
    total,
    links,
    next_page_url: berikutnya,
    prev_page_url: sebelumnya,
  } = data?.data?.ledger_top_ups ?? {};

  const totals = data?.data?.totals;

  const toggleSort = (key: string) => {
    if (!SORTABLE[key]) return;
    saring(setSort)(sort.key === key ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' });
  };

  const signature = `${paginationUrl}|${tab}|${debouncedSearch}|${sort.key}${sort.dir}|${pageSize}|${dari}|${sampai}`;

  // Tab dibentuk dari akun tujuan yang benar-benar terpakai di rentang ini, bukan dari
  // daftar akun yang mungkin ada: tab "Ke Giro" yang selalu kosong hanya menambah pilihan.
  const tabAkun = useMemo(() => totals?.accounts ?? [], [totals]);

  const namaTab = useMemo(() => tabAkun.find(({ ledger_account_id: id }) => id === tab)?.name, [tabAkun, tab]);

  const kosong = useMemo(() => {
    if (debouncedSearch) {
      return { judul: `Tidak ada hasil untuk "${debouncedSearch}"`, pesan: 'Pencarian membaca nama akun tujuannya.' };
    }
    if (tab !== 'all') {
      return {
        judul: `Belum ada konversi ke ${namaTab ?? 'akun ini'}`,
        pesan: 'Konversi ke akun lain masih bisa dilihat di tab Semua.',
      };
    }
    if (dari && sampai) {
      return { judul: 'Belum ada konversi di periode ini', pesan: 'Coba pilih tanggal yang lain.' };
    }
    return {
      judul: 'Belum ada konversi saldo',
      pesan: 'Setor uang pribadi ke kas toko, atau pindahkan uang antara Kas, Bank, dan Giro.',
    };
  }, [debouncedSearch, tab, namaTab, dari, sampai]);

  const ketPeriode =
    dari && sampai ? `${dayjs(dari).format('D MMM')} – ${dayjs(sampai).format('D MMM YYYY')}` : 'Semua waktu';

  return (
    <div className="flex flex-col gap-2.5">
      {/* Judulnya menyebutkan jurnalnya, karena itulah yang berubah saat tombol ditekan. */}
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="min-w-0">
          <h1 className="text-lg font-bold">Konversi Saldo</h1>
          <p className="mt-0.5 text-sm text-foreground-subtle">
            Memindahkan uang ke salah satu akun buku besar. Akun tujuannya bertambah, sumber dananya berkurang.
          </p>
        </div>

        <Button size="sm" onClick={() => setKonversiOpen(true)}>
          <ArrowLeftRight strokeWidth={2.2} aria-hidden />
          Konversi saldo
        </Button>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Kpi label="Total dikonversi" nilai={totals?.total} ket={ketPeriode} />
        <Kpi
          label="Setoran modal"
          nilai={totals?.capital}
          ket={totals ? `${totals.capital_count} dari uang pribadi` : ''}
        />
        <Kpi
          label="Pindah antar kas"
          nilai={totals?.transfer}
          ket={totals ? `${totals.transfer_count} konversi` : ''}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          aria-label="Filter akun tujuan"
          value={tab}
          onChange={saring(setTab)}
          tabs={[
            { value: 'all', label: 'Semua', count: totals?.count },
            ...tabAkun.map(({ ledger_account_id: id, name, count }) => ({
              value: id,
              label: `Ke ${name}`,
              count,
            })),
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
              placeholder="Cari akun tujuan…"
              aria-label="Cari konversi"
              value={search}
              onChange={(e) => saring(setSearch)(e.target.value)}
            />
          </div>

          <DateRangeFilter value={range} onChange={saring(setRange)} />
        </div>
      </div>

      {/* Di bawah md tiap baris jadi kartu. */}
      <div className="md:hidden">
        <TopUpCardList rows={rows} loading={isLoading} perPage={pageSize} empty={kosong} />

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
                      className={cn(TH, col.align === 'right' ? 'text-right' : 'text-left')}
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
                      <td key={col.key} className={TD}>
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
                      {dayjs(row.created_at).format('DD MMM YYYY HH.mm')}
                    </td>
                    <td className={cn(TD, 'whitespace-nowrap')}>
                      <SumberDana metode={row.payment_method} />
                    </td>
                    <td className={cn(TD, 'max-w-0 truncate')}>
                      <span className="font-medium">{row.ledger_account?.name}</span>
                      {/* Keterangan ini satu-satunya tempat perbedaan artinya terlihat
                          di daftar — tanpa itu barisnya sama saja dengan pindah kas. */}
                      {row.payment_method === 'personal_money' && (
                        <span className="block text-xs text-foreground-subtle">dicatat sebagai setoran modal</span>
                      )}
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

      <p className="flex items-start gap-1.5 rounded-lg bg-info-subtle px-3.25 py-2 text-sm leading-[17px] text-info">
        <Info size={13} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
        <span>
          Konversi tidak menambah kekayaan toko — kecuali kalau sumbernya uang pribadi. Sumber itu dikreditkan ke akun
          Modal, jadi tercatat sebagai setoran modal pemilik. Baris yang sudah tercatat tidak bisa diubah atau dihapus.
        </span>
      </p>

      <CreateTopUpDialog isOpen={konversiOpen} onClose={() => setKonversiOpen(false)} />
    </div>
  );
};

ConvertBalancePage.themeable = true;

export default ConvertBalancePage;
