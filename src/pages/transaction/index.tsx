import dayjs from 'dayjs';
import { Download, Eye, Plus, Search } from 'lucide-react';
import { NextPage } from 'next';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';

import { CardDashboard } from '@/components/Container';
import { TextField } from '@/components/Form';
import Pagination from '@/components/Pagination';
import Table from '@/components/Table';
import { DetailSale } from '@/components/table/TableComponent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DateRangeFilter, { DateRange } from '@/components/ui/date-range-filter';
import FilterTabs from '@/components/ui/filter-tabs';
import Skeleton from '@/components/ui/skeleton';
import useFetchInvoice from '@/hooks/query/useFetchInvoice';
import useFetchSales from '@/hooks/query/useFetchSale';
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
const sumPayments = (payments: Payment[] = []) => payments.reduce((total, p) => total + (p.payment_price ?? 0), 0);

const angka = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/** Tahun disembunyikan bila tahun ini — kolomnya jadi lebih sempit tanpa kehilangan apa pun. */
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

/** Jumlah per tab. Backend tidak mengembalikan hitungan per status pada satu response,
 *  jadi tiap tab minta satu baris saja dan hanya membaca `total`-nya. */
function useStatusCount(status?: string, between?: Record<string, [string, string]>) {
  const { data } = useFetchSales({
    paginated: true,
    per_page: 1,
    where: status ? { ...BASE_WHERE, status } : BASE_WHERE,
    ...(between ? { where_between: between } : {}),
  });
  return data?.data?.transactions?.total;
}

const TransactionPage: NextPage<unknown> & ThemeablePage = () => {
  const [paginationUrl, setPaginationUrl] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [range, setRange] = useState<DateRange>([null, null]);
  const [transaction, setTransaction] = useState<SaleTransactionsData | null>();

  // 500 ms: tanpa ini tiap ketikan mengirim satu request pencarian
  const debouncedSearch = useDebounceValue(search, 500);

  const between = useMemo(() => {
    const [from, to] = range;
    if (!from) return undefined;
    return {
      created_at: [
        dayjs(from).startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        dayjs(to ?? from)
          .endOf('day')
          .format('YYYY-MM-DD HH:mm:ss'),
      ] as [string, string],
    };
  }, [range]);

  const { data: dataTransaction, isLoading } = useFetchSales({
    order_by: { created_at: 'desc' },
    search: debouncedSearch,
    per_page: pageSize,
    forceUrl: paginationUrl,
    where: status === 'all' ? BASE_WHERE : { ...BASE_WHERE, status },
    ...(between ? { where_between: between } : {}),
  });

  const counts = {
    all: useStatusCount(undefined, between),
    pending: useStatusCount('pending', between),
    'on-review': useStatusCount('on-review', between),
    accepted: useStatusCount('accepted', between),
    declined: useStatusCount('declined', between),
  };

  const {
    data: dataRes = [],
    from,
    to,
    total,
    links,
    next_page_url,
    prev_page_url,
    last_page_url,
  } = dataTransaction?.data?.transactions ?? {};

  const resetPage = () => setPaginationUrl('');

  const data = dataRes.map((row) => {
    const { transaction_code, payments, created_at, customer, id } = row;
    const badge = STATUS[(row.status ?? 'accepted') as keyof typeof STATUS] ?? STATUS.accepted;
    const methods = Array.from(
      new Set((payments ?? []).map((p: Payment) => formatPaymentMethod(p.payment_method ?? '')))
    );

    return {
      waktu: <span className="whitespace-nowrap font-mono text-sm">{waktu(created_at)}</span>,
      kode: <span className="font-mono text-sm">{transaction_code}</span>,
      customer: customer?.full_name ?? <span className="text-foreground-subtle">Umum</span>,
      pembayaran: <span className="text-foreground-muted">{methods.join(' · ')}</span>,
      jumlah: (
        <span className="block text-right font-mono font-semibold tabular-nums">{angka(sumPayments(payments))}</span>
      ),
      status: <Badge variant={badge.variant}>{badge.label}</Badge>,
      aksi: (
        <div className="flex justify-end gap-1">
          <Button size="icon-sm" variant="ghost" aria-label="Lihat detail" onClick={() => setTransaction(row)}>
            <Eye aria-hidden />
          </Button>
          <ButtonDownload transactionId={id} />
        </div>
      ),
    };
  });

  const columns = useMemo(
    () => [
      { Header: 'Waktu', accessor: 'waktu', width: '14%' },
      { Header: 'Kode', accessor: 'kode', width: '16%' },
      { Header: 'Customer', accessor: 'customer', width: '21%' },
      { Header: 'Pembayaran', accessor: 'pembayaran', width: '15%' },
      { Header: 'Jumlah', accessor: 'jumlah', width: '14%', className: 'justify-end' },
      { Header: 'Status', accessor: 'status', width: '10%' },
      { Header: 'Aksi', accessor: 'aksi', width: '90px', className: 'justify-end' },
    ],
    []
  );

  return (
    <CardDashboard>
      {transaction && (
        <DetailSale transactions={transaction} open={!!transaction} onClose={() => setTransaction(null)} />
      )}

      <Table
        withoutStripe
        columns={columns}
        data={data}
        search={() => (
          <div className="mb-3 flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <FilterTabs
              aria-label="Saring menurut status"
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

            <div className="flex flex-wrap items-center gap-2">
              <TextField
                Icon={<Search />}
                value={search}
                onChange={(e) => {
                  resetPage();
                  setSearch(e.target.value);
                }}
                placeholder="Cari kode, customer…"
                className="w-full sm:w-56"
              />
              <DateRangeFilter
                value={range}
                onChange={(val) => {
                  resetPage();
                  setRange(val);
                }}
              />
              <Link href="/transaction/add">
                <a>
                  <Button>
                    <Plus aria-hidden /> Transaksi baru
                  </Button>
                </a>
              </Link>
            </div>
          </div>
        )}
      />

      {/* Sebelumnya area tabel benar-benar kosong selama memuat, jadi tidak ada tanda
          apakah datanya sedang datang atau memang tidak ada. */}
      {isLoading && (
        <div className="flex flex-col gap-2 py-2">
          {Array.from({ length: 6 }).map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      )}

      {!isLoading && data.length === 0 && (
        <div className="flex flex-col items-center gap-1 py-12 text-center">
          <p className="text-base font-medium">Tidak ada transaksi</p>
          <p className="text-sm text-foreground-muted">
            {debouncedSearch || status !== 'all' || between
              ? 'Coba longgarkan penyaringnya.'
              : 'Transaksi yang dibuat akan muncul di sini.'}
          </p>
        </div>
      )}

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
    </CardDashboard>
  );
};

const ButtonDownload = ({ transactionId }: { transactionId: string }) => {
  // isFetching, bukan isLoading: di react-query v4 query dengan `enabled: false`
  // berstatus 'loading' selamanya karena belum pernah punya data, jadi isLoading
  // tidak pernah false dan tombolnya disabled permanen.
  const { refetch: refetchDownload, isFetching } = useFetchInvoice(transactionId, { enabled: false });

  const handleDownload = async () => {
    const { data } = await refetchDownload();
    if (data) printInvoice(data);
  };

  return (
    <Button size="icon-sm" variant="ghost" aria-label="Unduh faktur" loading={isFetching} onClick={handleDownload}>
      {!isFetching && <Download aria-hidden />}
    </Button>
  );
};

// Halaman ini sudah seluruhnya memakai token — termasuk tabel, pagination, dan modal
// detailnya — jadi aman mengikuti tema pilihan pengguna. Halaman lain masih dipaksa
// terang di _app sampai giliran mereka dipindahkan.
TransactionPage.themeable = true;

export default TransactionPage;
