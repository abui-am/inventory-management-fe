import { Download, Eye, Plus, Search } from 'lucide-react';
import { NextPage } from 'next';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';

import { CardDashboard } from '@/components/Container';
import { SelectSortBy, SelectSortType, TextField } from '@/components/Form';
import Pagination from '@/components/Pagination';
import Table from '@/components/Table';
import { DetailSale } from '@/components/table/TableComponent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Skeleton from '@/components/ui/skeleton';
import { SALE_SORT_BY_OPTIONS, SORT_TYPE_OPTIONS } from '@/constants/options';
import useFetchInvoice from '@/hooks/query/useFetchInvoice';
import useFetchSales from '@/hooks/query/useFetchSale';
import { Option } from '@/typings/common';
import { ThemeablePage } from '@/typings/page';
import { SaleTransactionsData } from '@/typings/sale';
import { useDebounceValue } from '@/utils/debounce';
import { formatDate, formatPaymentMethod, formatToIDR } from '@/utils/format';
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

const STATUS_BADGE: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'destructive' }> = {
  accepted: { label: 'Diterima', variant: 'success' },
  pending: { label: 'Menunggu', variant: 'warning' },
  'on-review': { label: 'Ditinjau', variant: 'info' },
  declined: { label: 'Ditolak', variant: 'destructive' },
};

const TransactionPage: NextPage<unknown> & ThemeablePage = () => {
  const [paginationUrl, setPaginationUrl] = useState('');
  const [sortBy, setSortBy] = useState<Option<string[]> | null>(SALE_SORT_BY_OPTIONS[0]);
  const [sortType, setSortType] = useState<Option | null>(SORT_TYPE_OPTIONS[1]);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  // 500 ms: tanpa ini tiap ketikan mengirim satu request pencarian
  const debouncedSearch = useDebounceValue(search, 500);
  const [transaction, setTransaction] = useState<SaleTransactionsData | null>();

  const params = sortBy?.data?.reduce((prev, curr) => ({ ...prev, [curr]: sortType?.value }), {});

  const { data: dataTransaction, isLoading } = useFetchSales({
    order_by: params,
    search: debouncedSearch,
    per_page: pageSize,
    forceUrl: paginationUrl,
  });

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

  const data = dataRes.map((row) => {
    const { transaction_code, payments, created_at, customer, status, id } = row;
    const badge = STATUS_BADGE[status ?? 'accepted'] ?? STATUS_BADGE.accepted;
    const methods = Array.from(
      new Set((payments ?? []).map((p: Payment) => formatPaymentMethod(p.payment_method ?? '')))
    );

    return {
      waktu: <span className="whitespace-nowrap">{formatDate(created_at, { withHour: true })}</span>,
      kode: <span className="font-mono text-sm">{transaction_code}</span>,
      customer: customer?.full_name ?? <span className="text-foreground-subtle">Umum</span>,
      pembayaran: <span className="text-foreground-muted">{methods.join(' · ')}</span>,
      jumlah: <span className="block text-right font-mono tabular-nums">{formatToIDR(sumPayments(payments))}</span>,
      status: <Badge variant={badge.variant}>{badge.label}</Badge>,
      aksi: (
        <div className="flex justify-end gap-1">
          <ButtonDownload transactionId={id} />
          <Button size="icon-sm" variant="ghost" aria-label="Lihat detail" onClick={() => setTransaction(row)}>
            <Eye aria-hidden />
          </Button>
        </div>
      ),
    };
  });

  const columns = useMemo(
    () => [
      { Header: 'Waktu', accessor: 'waktu', width: '15%' },
      { Header: 'Kode', accessor: 'kode', width: '16%' },
      { Header: 'Customer', accessor: 'customer', width: '22%' },
      { Header: 'Pembayaran', accessor: 'pembayaran', width: '15%' },
      { Header: 'Jumlah', accessor: 'jumlah', width: '15%', className: 'justify-end' },
      { Header: 'Status', accessor: 'status', width: '10%' },
      { Header: '', accessor: 'aksi', width: '90px', className: 'justify-end' },
    ],
    []
  );

  return (
    <CardDashboard>
      {transaction && (
        <DetailSale transactions={transaction} open={!!transaction} onClose={() => setTransaction(null)} />
      )}

      <Table
        columns={columns}
        data={data}
        search={() => (
          <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Daftar Transaksi</h2>

            <div className="flex flex-wrap items-center gap-2">
              <TextField
                Icon={<Search />}
                value={search}
                onChange={(e) => {
                  setPaginationUrl('');
                  setSearch(e.target.value);
                }}
                placeholder="Cari kode atau customer"
                className="w-full sm:w-56"
              />
              <SelectSortBy
                disableMargin
                value={sortBy}
                onChange={(val) => setSortBy(val as Option<string[]>)}
                options={SALE_SORT_BY_OPTIONS}
                className="w-full sm:w-48"
              />
              <SelectSortType
                value={sortType}
                defaultValue={SORT_TYPE_OPTIONS[1]}
                onChange={(val) => setSortType(val as Option)}
                className="w-full sm:w-40"
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
          <p className="text-base font-medium">Belum ada transaksi</p>
          <p className="text-sm text-foreground-muted">
            {debouncedSearch
              ? `Tidak ada hasil untuk "${debouncedSearch}".`
              : 'Transaksi yang dibuat akan muncul di sini.'}
          </p>
        </div>
      )}

      <Pagination
        stats={{ from: `${from ?? '0'}`, to: `${to ?? '0'}`, total: `${total ?? '0'}` }}
        onClickGoToPage={(val) => setPaginationUrl(`${(last_page_url as string).split('?')[0]}?page=${val}`)}
        onChangePerPage={(page) => {
          setPaginationUrl('');
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
