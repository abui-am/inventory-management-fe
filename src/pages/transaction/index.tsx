import dayjs from 'dayjs';
import { ChevronDown, ChevronUp, Download, Eye, Plus, Search } from 'lucide-react';
import { NextPage } from 'next';
import Link from 'next/link';
import React, { ReactNode, useMemo, useState } from 'react';

import { TextField } from '@/components/Form';
import Pagination from '@/components/Pagination';
import TransactionDetailSheet from '@/components/transaction/TransactionDetailSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DateRangeFilter, { DateRange } from '@/components/ui/date-range-filter';
import FilterTabs from '@/components/ui/filter-tabs';
import Skeleton from '@/components/ui/skeleton';
import useFetchInvoice from '@/hooks/query/useFetchInvoice';
import useFetchSales from '@/hooks/query/useFetchSale';
import { cn } from '@/lib/cn';
import { ThemeablePage } from '@/typings/page';
import { SaleTransactionsData } from '@/typings/sale';
import { useDebounceValue } from '@/utils/debounce';
import { formatPaymentMethod } from '@/utils/format';
import printInvoice from '@/utils/printInvoice';

type Payment = { payment_method?: string; payment_price?: number };

/**
 * Jumlah transaksi = jumlah SELURUH pembayarannya.
 *
 * Halaman ini sebelumnya menampilkan `payments[0].payment_price` saja. Pada transaksi
 * yang dibayar dengan lebih dari satu metode — Kas 1.000.000 + Utang 660.000 — daftarnya
 * menulis Rp 1.000.000 dan menyembunyikan sisanya. Backend tidak mengirim total, jadi
 * penjumlahan memang harus di sini, tapi harus seluruhnya.
 */
const sumPayments = (payments: Payment[] = []) => payments.reduce((t, p) => t + (p.payment_price ?? 0), 0);

/** SPEC-34: tanpa awalan "Rp" — kolomnya sudah bernama Jumlah. */
const angka = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/** SPEC-30: `09 Sep 14:32`. Tahun hanya muncul kalau bukan tahun ini. */
const waktu = (iso: string | Date) =>
  dayjs(iso).format(dayjs(iso).year() === dayjs().year() ? 'DD MMM HH:mm' : 'DD MMM YY HH:mm');

const STATUS = {
  pending: { label: 'Menunggu', variant: 'warning' },
  'on-review': { label: 'Ditinjau', variant: 'info' },
  accepted: { label: 'Diterima', variant: 'success' },
  declined: { label: 'Ditolak', variant: 'destructive' },
} as const;

const STATUS_ORDER = ['pending', 'on-review', 'accepted', 'declined'] as const;

const BASE_WHERE = { transactionable_type: 'customers' };

/**
 * Kolom yang benar-benar bisa disortir server.
 *
 * `customer` dan `jumlah` sengaja TIDAK ada di sini: `customers.full_name` adalah relasi
 * dan membuat query melempar 500 (`missing FROM-clause entry for table "customers"`),
 * sedangkan jumlah dihitung dari `payments[]` sehingga tidak punya kolom sama sekali.
 * Header yang tampak bisa diklik tapi menggagalkan request lebih buruk daripada header biasa.
 */
const SORTABLE: Record<string, string> = {
  waktu: 'created_at',
  kode: 'transaction_code',
  pembayaran: 'payment_method',
  status: 'status',
};

// SPEC-27: 10px/700, tracking .07em, uppercase, subtle, padding 9px 10px 7px, garis bawah.
const TH =
  'border-b border-border px-2.5 pb-1.75 pt-2.25 text-2xs font-bold uppercase tracking-[0.07em] text-foreground-subtle';
// SPEC-29: 13px, padding 8px 10px, garis bawah di SETIAP baris termasuk terakhir.
const TD = 'border-b border-border px-2.5 py-2 align-middle text-base';

/** Jumlah per tab. Backend tidak mengembalikan hitungan per status dalam satu response,
 *  jadi tiap tab meminta satu baris dan hanya membaca `total`-nya. */
function useStatusCount(
  status: string | undefined,
  filter: { search: string; between?: Record<string, [string, string]> }
) {
  const { data } = useFetchSales({
    paginated: true,
    per_page: 1,
    // Pencarian ikut dihitung. Tanpa ini tab menulis "Semua 50" tepat di sebelah tabel
    // kosong — angkanya jadi menjawab pertanyaan yang tidak sedang ditanyakan siapa pun.
    search: filter.search,
    where: status ? { ...BASE_WHERE, status } : BASE_WHERE,
    ...(filter.between ? { where_between: filter.between } : {}),
  });
  return data?.data?.transactions?.total;
}

/** `aria-sort` hanya boleh terpasang di kolom yang sedang disortir, bukan di semuanya. */
const ariaSort = (active: boolean, dir: 'asc' | 'desc'): 'ascending' | 'descending' | undefined => {
  if (!active) return undefined;
  return dir === 'asc' ? 'ascending' : 'descending';
};

const TransactionPage: NextPage<unknown> & ThemeablePage = () => {
  const [paginationUrl, setPaginationUrl] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [range, setRange] = useState<DateRange>([null, null]);
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'waktu', dir: 'desc' });
  // Dua state, bukan satu: kalau datanya dibuang saat menutup, komponennya ikut lepas
  // seketika dan animasi keluar tidak pernah sempat berjalan. `transaction` baru
  // dikosongkan setelah react-modal memberi tahu animasinya selesai.
  const [transaction, setTransaction] = useState<SaleTransactionsData | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // 500 ms: tanpa ini tiap ketikan mengirim satu request pencarian
  const debouncedSearch = useDebounceValue(search, 500);

  const between = useMemo(() => {
    const [from, to] = range;
    // Menunggu kedua ujung: menyaring saat baru satu tanggal dipilih membuat daftarnya
    // menyempit ke satu hari lalu melebar lagi sedetik kemudian.
    if (!from || !to) return undefined;
    return {
      created_at: [
        dayjs(from).startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        dayjs(to).endOf('day').format('YYYY-MM-DD HH:mm:ss'),
      ] as [string, string],
    };
  }, [range]);

  const { data: dataTransaction, isLoading } = useFetchSales({
    order_by: { [SORTABLE[sort.key]]: sort.dir },
    search: debouncedSearch,
    per_page: pageSize,
    forceUrl: paginationUrl,
    where: status === 'all' ? BASE_WHERE : { ...BASE_WHERE, status },
    ...(between ? { where_between: between } : {}),
  });

  const countFilter = { search: debouncedSearch, between };
  const counts = {
    all: useStatusCount(undefined, countFilter),
    pending: useStatusCount('pending', countFilter),
    'on-review': useStatusCount('on-review', countFilter),
    accepted: useStatusCount('accepted', countFilter),
    declined: useStatusCount('declined', countFilter),
  };

  const {
    data: rows = [],
    from,
    to,
    total,
    links,
    next_page_url,
    prev_page_url,
    last_page_url,
  } = dataTransaction?.data?.transactions ?? {};

  // Berubah hanya saat isi tabel benar-benar berganti — halaman, penyaring, urutan.
  // Dipakai sebagai `key` tbody supaya animasi masuk berjalan sekali per perubahan,
  // bukan tiap render.
  const signature = `${paginationUrl}|${status}|${debouncedSearch}|${sort.key}${sort.dir}|${pageSize}`;

  const resetPage = () => setPaginationUrl('');

  /**
   * Pesan kosong diturunkan dari penyaring yang BENAR-BENAR aktif, bukan dari satu
   * boolean "kosong". Menyuruh mengubah filter kepada orang yang tidak sedang memakai
   * filter membuat mereka mencari kontrol yang tidak aktif.
   */
  const adaFilter = !!debouncedSearch || status !== 'all' || !!between;

  const kosong = (() => {
    if (debouncedSearch) {
      return {
        judul: `Tidak ada hasil untuk "${debouncedSearch}"`,
        pesan: 'Periksa lagi kode atau nama customer-nya.',
      };
    }
    if (status !== 'all') {
      const nama = STATUS[status as keyof typeof STATUS]?.label.toLowerCase() ?? status;
      return {
        judul: `Belum ada transaksi ${nama}`,
        pesan: between ? 'Tidak ada juga di rentang tanggal ini.' : 'Semua transaksi berada di status lain.',
      };
    }
    if (between) {
      return { judul: 'Tidak ada transaksi di rentang ini', pesan: 'Coba pilih rentang tanggal yang lain.' };
    }
    return { judul: 'Belum ada transaksi', pesan: 'Transaksi yang dibuat akan muncul di sini.' };
  })();

  const resetFilter = () => {
    resetPage();
    setSearch('');
    setStatus('all');
    setRange([null, null]);
  };

  const toggleSort = (key: string) => {
    resetPage();
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  };

  const columns: { key: string; label: string; align?: 'right'; width?: string }[] = [
    { key: 'waktu', label: 'Waktu' },
    { key: 'kode', label: 'Kode' },
    { key: 'customer', label: 'Customer' },
    { key: 'pembayaran', label: 'Pembayaran' },
    { key: 'jumlah', label: 'Jumlah', align: 'right' },
    { key: 'status', label: 'Status' },
    { key: 'aksi', label: 'Aksi', align: 'right', width: '96px' },
  ];

  return (
    <>
      {transaction && (
        <TransactionDetailSheet
          transaction={transaction}
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onClosed={() => setTransaction(null)}
        />
      )}

      {/* SPEC-10: kolom isi, gap 10px */}
      <div className="flex flex-col gap-2.5">
        {/* SPEC-11: toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterTabs
            aria-label="Filter status"
            value={status}
            onChange={(val) => {
              resetPage();
              setStatus(val);
            }}
            tabs={[
              { value: 'all', label: 'Semua', count: counts.all },
              ...STATUS_ORDER.map((key) => ({ value: key, label: STATUS[key].label, count: counts[key] })),
            ]}
          />

          {/* SPEC-17: gap 7px */}
          <div className="flex flex-wrap items-center gap-1.75">
            {/* SPEC-18/19: 220px, 32px, ikon 14px stroke 1.9 */}
            <div className="relative w-[220px]">
              <Search
                size={14}
                strokeWidth={1.9}
                aria-hidden
                // z-10 wajib: TextField membungkus input-nya dalam div.relative yang
                // datang setelah ikon di DOM, dan elemen berposisi dengan z-index auto
                // dicat menurut urutan DOM — tanpa ini kotak input menutupi ikonnya.
                className="pointer-events-none absolute inset-y-0 left-2.5 z-10 my-auto text-foreground-subtle"
              />
              <TextField
                value={search}
                onChange={(e) => {
                  resetPage();
                  setSearch(e.target.value);
                }}
                placeholder="Cari kode, customer…"
                aria-label="Cari transaksi"
                className="h-8 rounded-control pl-[31px] pr-2.5"
              />
            </div>

            <DateRangeFilter
              value={range}
              onChange={(val) => {
                resetPage();
                setRange(val);
              }}
            />

            {/* SPEC-22/23: 32px, radius 7, padding 0 12px, 13px/600, ikon 14 stroke 2.2 */}
            <Link href="/transaction/add">
              <a>
                <Button size="sm">
                  <Plus strokeWidth={2.2} aria-hidden /> Transaksi baru
                </Button>
              </a>
            </Link>
          </div>
        </div>

        {/* SPEC-24: kartu radius 10px, overflow-hidden supaya pita paginasi ikut membulat */}
        <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                {/* SPEC-26 */}
                <tr className="bg-surface-raised">
                  {columns.map(({ key, label, align, width }) => {
                    const sortKey = SORTABLE[key];
                    const activeSort = sort.key === key;
                    return (
                      <th
                        key={key}
                        scope="col"
                        style={width ? { width } : undefined}
                        className={cn(TH, align === 'right' ? 'text-right' : 'text-left')}
                        aria-sort={ariaSort(activeSort, sort.dir)}
                      >
                        {sortKey ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(key)}
                            className={cn(
                              'group inline-flex items-center gap-1 uppercase tracking-[0.07em] transition-colors duration-fast hover:text-foreground',
                              activeSort && 'text-foreground'
                            )}
                          >
                            {label}
                            {activeSort ? (
                              // Referensi tidak menggambarkan penanda sortir sama sekali —
                              // ini keputusanku, dibuat sekecil mungkin supaya tidak
                              // menambah tinggi baris header.
                              <span aria-hidden>
                                {sort.dir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                              </span>
                            ) : (
                              <ChevronDown
                                size={11}
                                aria-hidden
                                className="opacity-0 transition-opacity duration-fast group-hover:opacity-60"
                              />
                            )}
                          </button>
                        ) : (
                          label
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* fade-in 200ms saat isi berganti. Hanya opacity — tidak ada properti yang
                  memicu layout ulang, jadi tabel 50 baris pun tidak tersendat. */}
              <tbody key={signature} className="animate-in fade-in duration-200">
                {isLoading &&
                  Array.from({ length: pageSize }).map((_, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <tr key={i}>
                      {columns.map(({ key }) => (
                        <td key={key} className={TD}>
                          {/* Tinggi isi dikunci 26px — sama dengan tombol aksi, elemen
                              tertinggi di baris asli. Dengan padding 8px dan garis bawah,
                              barisnya jadi 43px persis seperti baris berisi data, jadi
                              tabel tidak melompat saat datanya datang. */}
                          <div className="flex h-[26px] items-center">
                            <Skeleton className="h-3.5 w-full" />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}

                {!isLoading && rows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="px-2.5 py-12 text-center">
                      <p className="text-base font-medium">{kosong.judul}</p>
                      <p className="mt-1 text-sm text-foreground-muted">{kosong.pesan}</p>
                      {adaFilter && (
                        <Button size="xs" variant="outline" className="mt-3" onClick={resetFilter}>
                          Reset filter
                        </Button>
                      )}
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  rows.map((row) => {
                    const badge = STATUS[(row.status ?? 'accepted') as keyof typeof STATUS] ?? STATUS.accepted;
                    const methods = Array.from(
                      new Set((row.payments ?? []).map((p: Payment) => formatPaymentMethod(p.payment_method ?? '')))
                    );
                    return (
                      <tr key={row.id} className="transition-colors duration-fast hover:bg-surface-raised">
                        {/* SPEC-30 */}
                        <td className={cn(TD, 'whitespace-nowrap font-mono tabular-nums text-foreground-muted')}>
                          {waktu(row.created_at)}
                        </td>
                        {/* SPEC-31 */}
                        <td className={cn(TD, 'whitespace-nowrap font-mono font-medium')}>{row.transaction_code}</td>
                        {/* SPEC-32 */}
                        <td className={cn(TD, 'max-w-0 truncate')} title={row.customer?.full_name ?? 'Umum'}>
                          {row.customer?.full_name ?? 'Umum'}
                        </td>
                        {/* SPEC-33 */}
                        <td className={cn(TD, 'whitespace-nowrap text-foreground-muted')}>{methods.join(' · ')}</td>
                        {/* SPEC-34 */}
                        <td className={cn(TD, 'whitespace-nowrap text-right font-mono font-semibold tabular-nums')}>
                          {angka(sumPayments(row.payments))}
                        </td>
                        {/* SPEC-35/36 */}
                        <td className={TD}>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </td>
                        {/* SPEC-37..39: gap 4px, rata kanan, mata dulu lalu unduh */}
                        <td className={TD}>
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              aria-label="Lihat detail"
                              onClick={() => {
                                setTransaction(row);
                                setSheetOpen(true);
                              }}
                            >
                              <Eye strokeWidth={1.7} aria-hidden />
                            </Button>
                            <ButtonDownload transactionId={row.id} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* SPEC-40: pita paginasi di dalam kartu */}
          <Pagination
            stats={{ from: `${from ?? '0'}`, to: `${to ?? '0'}`, total: `${total ?? '0'}` }}
            onClickGoToPage={(val) => setPaginationUrl(`${(last_page_url as string).split('?')[0]}?page=${val}`)}
            onChangePerPage={(page) => {
              resetPage();
              setPageSize(page?.value ?? 0);
            }}
            onClickPageButton={(url) => setPaginationUrl(url)}
            links={links ?? []}
            onClickNext={() => setPaginationUrl((next_page_url as string) ?? '')}
            onClickPrevious={() => setPaginationUrl((prev_page_url as string) ?? '')}
          />
        </div>
      </div>
    </>
  );
};

const ButtonDownload = ({ transactionId }: { transactionId: string }): ReactNode => {
  // isFetching, bukan isLoading: di react-query v4 query dengan `enabled: false`
  // berstatus 'loading' selamanya karena belum pernah punya data, jadi isLoading
  // tidak pernah false dan tombolnya disabled permanen.
  const { refetch: refetchDownload, isFetching } = useFetchInvoice(transactionId, { enabled: false });

  const handleDownload = async () => {
    const { data } = await refetchDownload();
    if (data) printInvoice(data);
  };

  return (
    <Button size="icon-xs" variant="ghost" aria-label="Download invoice" loading={isFetching} onClick={handleDownload}>
      {!isFetching && <Download strokeWidth={1.7} aria-hidden />}
    </Button>
  );
};

// Halaman ini sudah seluruhnya memakai token, jadi aman mengikuti tema pilihan pengguna.
TransactionPage.themeable = true;

export default TransactionPage;
