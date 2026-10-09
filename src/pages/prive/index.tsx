import dayjs from 'dayjs';
import { ChevronDown, ChevronUp, Info, Plus, Search } from 'lucide-react';
import { NextPage } from 'next';
import React, { useMemo, useState } from 'react';

import { SumberDana } from '@/components/expense/ExpenseCardList';
import Pagination from '@/components/Pagination';
import CreatePriveDialog from '@/components/prive/CreatePriveDialog';
import PriveCardList from '@/components/prive/PriveCardList';
import { Button } from '@/components/ui/button';
import DateRangeFilter, { DateRange } from '@/components/ui/date-range-filter';
import { FilterTabs } from '@/components/ui/filter-tabs';
import { Input } from '@/components/ui/input';
import Kpi from '@/components/ui/kpi';
import Skeleton from '@/components/ui/skeleton';
import { useFetchUnpaginatedLedgerAccounts } from '@/hooks/query/useFetchLedgerAccount';
import { useFetchPrives } from '@/hooks/query/useFetchPrives';
import { cn } from '@/lib/cn';
import { ThemeablePage } from '@/typings/page';
import { useDebounceValue } from '@/utils/debounce';
import { formatDateYYYYMMDDHHmmss, formatNumber } from '@/utils/format';

// Disalin PERSIS dari /expense dan /employee — daftar di aplikasi ini tidak boleh punya
// ritme yang berbeda.
const TH = 'border-b border-border px-2.5 pb-1.75 pt-2.25 text-xs font-bold text-foreground-subtle';
const TD = 'border-b border-border px-2.5 py-2 align-middle text-base';

/** Kolom yang benar-benar ada di tabel `prives`, jadi aman dipakai `order_by`. */
const SORTABLE: Record<string, string> = {
  tanggal: 'prive_date',
  jumlah: 'amount',
};

type Kolom = { key: string; label: string; align?: 'right'; width?: string; className?: string };

const COLUMNS: Kolom[] = [
  { key: 'tanggal', label: 'Tanggal', width: '150px' },
  { key: 'keterangan', label: 'Keterangan' },
  { key: 'metode', label: 'Dibayar melalui', width: '160px' },
  { key: 'oleh', label: 'Dicatat oleh', width: '150px', className: 'hidden lg:table-cell' },
  { key: 'jumlah', label: 'Jumlah', align: 'right', width: '170px' },
];

const ariaSort = (aktif: boolean, dir: 'asc' | 'desc'): 'ascending' | 'descending' | undefined => {
  if (!aktif) return undefined;
  return dir === 'asc' ? 'ascending' : 'descending';
};

/**
 * Prive — uang toko yang diambil pemilik.
 *
 * Yang diperbaiki dari layar lama, semuanya terbaca di berkas sebelumnya:
 *
 * - Kolom "Metode Transaksi" menampilkan nilai mentah backend (`cash`, `bank`); sekarang
 *   memakai `SumberDana`, penanda yang sama dengan /expense dan /convert-balance.
 * - Header kolom "Description" — satu-satunya header berbahasa Inggris di halaman
 *   berbahasa Indonesia.
 * - Tidak ada satu pun angka ringkasan: berapa yang diambil periode ini, dan modal
 *   tersisa berapa.
 * - Tidak ada kalimat yang mengatakan bahwa prive MENGURANGI MODAL, bukan beban
 *   (`CreateLedgerJob::setPriveLedger` mendebit Modal, mengkredit Kas/Bank). Halaman
 *   Beban bentuknya mirip, jadi tanpa itu keduanya gampang tertukar.
 */
const PrivePage: NextPage & ThemeablePage = () => {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'tanggal', dir: 'desc' });
  const [pageSize, setPageSize] = useState(10);
  const [paginationUrl, setPaginationUrl] = useState('');
  const [range, setRange] = useState<DateRange>([null, null]);
  const [catatOpen, setCatatOpen] = useState(false);

  const debouncedSearch = useDebounceValue(search, 500);

  /** Menyaring berarti kembali ke halaman satu — `forceUrl` menyimpan filter yang lama. */
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
      where_greater_equal: { prive_date: formatDateYYYYMMDDHHmmss(dayjs(dari).startOf('day')) },
      where_lower_equal: { prive_date: formatDateYYYYMMDDHHmmss(dayjs(sampai).endOf('day')) },
    };
  }, [dari, sampai]);

  const saringan = {
    // `search` dikirim HANYA kalau diisi. `SearchFilter` di backend mengiterasi
    // `$model->searchable`, dan sampai properti itu ada di modelnya, mengirim string
    // kosong pun membuat endpoint ini melempar 500 — bukan hasil kosong.
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...rentang,
    ...(tab === 'all' ? {} : { where: { transaction_method: tab } }),
  };

  const { data, isLoading } = useFetchPrives({
    paginated: true,
    per_page: pageSize,
    order_by: { [SORTABLE[sort.key] ?? 'prive_date']: sort.dir },
    forceUrl: paginationUrl || undefined,
    ...saringan,
  });

  /**
   * Angka ringkasan dari SATU permintaan tanpa paginasi atas saringan yang sama.
   * Backend tidak mengirim `totals` untuk prive — dan menjumlahkan halaman yang sedang
   * terlihat akan berbohong begitu datanya lebih dari satu halaman.
   */
  const { data: dataSemua, isLoading: memuatRingkasan } = useFetchPrives({ paginated: false, ...saringan });
  const { data: dataAkun } = useFetchUnpaginatedLedgerAccounts();

  const ringkasan = useMemo(() => {
    const semua = (dataSemua?.data?.prives as unknown as { data?: never } | undefined) ?? undefined;
    const baris = Array.isArray(dataSemua?.data?.prives)
      ? ((dataSemua?.data?.prives ?? []) as unknown as { amount: string; transaction_method: string }[])
      : (semua as { data?: { amount: string; transaction_method: string }[] })?.data ?? [];

    const total = baris.reduce((jumlah, row) => jumlah + +(row.amount ?? 0), 0);
    const kas = baris.filter((row) => row.transaction_method === 'cash');
    return {
      total,
      jumlah: baris.length,
      rata: baris.length ? Math.round(total / baris.length) : 0,
      kas: kas.reduce((j, row) => j + +(row.amount ?? 0), 0),
      kasJumlah: kas.length,
    };
  }, [dataSemua]);

  const modal = dataAkun?.data?.ledger_accounts?.find((akun) => akun.name === 'Modal')?.balance;

  const {
    data: rows,
    from,
    to,
    total,
    links,
    next_page_url: berikutnya,
    prev_page_url: sebelumnya,
  } = data?.data?.prives ?? {};

  const toggleSort = (key: string) => {
    if (!SORTABLE[key]) return;
    saring(setSort)(sort.key === key ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' });
  };

  const kelas = (key: string) => COLUMNS.find((c) => c.key === key)?.className;
  const signature = `${paginationUrl}|${tab}|${debouncedSearch}|${sort.key}${sort.dir}|${pageSize}|${dari}|${sampai}`;

  const ketPeriode =
    dari && sampai ? `${dayjs(dari).format('D MMM')} – ${dayjs(sampai).format('D MMM YYYY')}` : 'semua waktu';

  /** Pesan kosong diturunkan dari penyaring yang BENAR-BENAR aktif. */
  const kosong = useMemo(() => {
    if (debouncedSearch) {
      return {
        judul: `Tidak ada hasil untuk "${debouncedSearch}"`,
        pesan: 'Pencarian membaca keterangan penarikan.',
      };
    }
    if (tab !== 'all') {
      return {
        judul: `Belum ada prive lewat ${tab === 'cash' ? 'kas' : 'bank'}`,
        pesan: 'Penarikan lewat sumber dana lain masih bisa dilihat di tab Semua.',
      };
    }
    if (dari && sampai) {
      return {
        judul: 'Tidak ada prive di periode ini',
        pesan: 'Coba pilih tanggal yang lain, atau catat penarikan yang baru.',
      };
    }
    return {
      judul: 'Belum ada prive tercatat',
      pesan: 'Uang toko yang diambil pemilik untuk keperluan pribadi dicatat di sini, dan mengurangi Modal.',
    };
  }, [debouncedSearch, tab, dari, sampai]);

  return (
    <div className="flex flex-col gap-2.5">
      {/* SPEC-01 — judul, penjelasan, dan satu aksi utama */}
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="min-w-0">
          <h1 className="text-lg font-bold">Prive</h1>
          <p className="mt-0.5 max-w-[620px] text-sm text-foreground-subtle">
            Uang toko yang diambil pemilik untuk keperluan pribadi. Mengurangi Modal, bukan dicatat sebagai beban usaha.
          </p>
        </div>

        <Button size="sm" onClick={() => setCatatOpen(true)}>
          <Plus strokeWidth={2.2} aria-hidden /> Catat prive
        </Button>
      </div>

      {/* SPEC-02 — empat angka yang menjawab pertanyaan pertama saat halaman dibuka */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Diambil periode ini" nilai={memuatRingkasan ? undefined : ringkasan.total} ket={ketPeriode} />
        <Kpi
          label="Penarikan"
          nilai={memuatRingkasan ? undefined : ringkasan.jumlah}
          ket={memuatRingkasan ? '' : `rata-rata ${formatNumber(ringkasan.rata)}`}
        />
        <Kpi
          label="Lewat kas"
          nilai={memuatRingkasan ? undefined : ringkasan.kas}
          ket={memuatRingkasan ? '' : `${ringkasan.kasJumlah} penarikan`}
        />
        <Kpi label="Modal sekarang" nilai={modal === undefined ? undefined : modal} ket="sesudah prive tercatat" />
      </div>

      {/* SPEC-03 — saringan sumber dana, periode, dan pencarian */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <FilterTabs
          aria-label="Saring prive menurut sumber dana"
          value={tab}
          onChange={saring(setTab)}
          tabs={[
            { value: 'all', label: 'Semua' },
            { value: 'cash', label: 'Kas' },
            { value: 'bank', label: 'Bank' },
          ]}
        />

        <div className="flex w-full flex-wrap items-center gap-1.75 md:w-auto">
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
              placeholder="Cari keterangan…"
              aria-label="Cari prive"
              value={search}
              onChange={(e) => saring(setSearch)(e.target.value)}
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

              {!isLoading && (rows?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-2.5 py-10 text-center">
                    <div className="text-base font-semibold">{kosong.judul}</div>
                    <div className="mt-1 text-sm text-foreground-subtle">{kosong.pesan}</div>
                  </td>
                </tr>
              )}

              {!isLoading &&
                rows?.map((row) => (
                  <tr key={row.id} className="transition-colors duration-fast hover:bg-surface-raised">
                    <td className={TD}>
                      <span className="text-foreground-muted">{dayjs(row.prive_date).format('DD MMM YYYY')}</span>
                    </td>
                    <td className={TD}>
                      <span className="font-medium">{row.description || '—'}</span>
                    </td>
                    <td className={TD}>
                      <SumberDana metode={row.transaction_method} />
                    </td>
                    <td className={cn(TD, kelas('oleh'))}>
                      <span className="font-mono text-sm text-foreground-subtle">{row.user?.username ?? '—'}</span>
                    </td>
                    <td className={cn(TD, 'text-right')}>
                      <span className="font-mono font-semibold tabular-nums">{formatNumber(+(row.amount ?? 0))}</span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Kaki tabel: jumlah penarikan dan totalnya untuk saringan yang sedang aktif. */}
        {!isLoading && (rows?.length ?? 0) > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-border bg-surface-raised px-2.5 py-2.25">
            <span className="text-sm text-foreground-subtle">
              {memuatRingkasan ? '…' : `${ringkasan.jumlah} penarikan`} · {ketPeriode}
            </span>
            <span className="text-sm text-foreground-subtle">
              Total{' '}
              <span className="ml-1.5 font-mono text-base font-bold tabular-nums text-foreground">
                {memuatRingkasan ? '…' : formatNumber(ringkasan.total)}
              </span>
            </span>
          </div>
        )}
      </div>

      <div className="md:hidden">
        <PriveCardList rows={rows} loading={isLoading} perPage={pageSize} empty={kosong} />
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

      {/* Kalimat yang membedakan halaman ini dari /expense yang bentuknya mirip. */}
      <p className="flex items-start gap-2 rounded-card bg-info-subtle px-3.25 py-2.5 text-sm text-info">
        <Info size={14} strokeWidth={1.9} aria-hidden className="mt-px shrink-0" />
        <span>
          <span className="font-semibold">Prive bukan beban.</span> Di buku besar, prive mendebit Modal dan mengkredit
          Kas atau Bank — jadi ia mengurangi hak pemilik, bukan mengurangi laba. Pengeluaran untuk keperluan toko
          tempatnya di halaman Beban.
        </span>
      </p>

      <CreatePriveDialog isOpen={catatOpen} onClose={() => setCatatOpen(false)} />
    </div>
  );
};

PrivePage.themeable = true;

export default PrivePage;
