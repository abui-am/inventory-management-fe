import Tippy from '@tippyjs/react';
import { NextPage } from 'next';
import Link from 'next/link';
import React, { useState } from 'react';
import { Download, Eye, PlusLg, Search } from 'react-bootstrap-icons';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { SelectSortBy, SelectSortType, TextField } from '@/components/Form';
import Pagination from '@/components/Pagination';
import Table from '@/components/Table';
import { DetailSale } from '@/components/table/TableComponent';
import { SALE_SORT_BY_OPTIONS, SORT_TYPE_OPTIONS } from '@/constants/options';
import { useFetchMyself } from '@/hooks/query/useFetchEmployee';
import useFetchInvoice from '@/hooks/query/useFetchInvoice';
import useFetchSales from '@/hooks/query/useFetchSale';
import useWindowSize, { MD } from '@/hooks/useWindowSize';
import { Option } from '@/typings/common';
import { Pic, SaleTransactionsData, Sender } from '@/typings/sale';
import { formatDate, formatPaymentMethod, formatToIDR } from '@/utils/format';
import printInvoice from '@/utils/printInvoice';

const TransactionPage: NextPage<unknown> = () => {
  const [paginationUrl, setPaginationUrl] = React.useState('');
  const [sortBy, setSortBy] = useState<Option<string[]> | null>(SALE_SORT_BY_OPTIONS[0]);
  const [sortType, setSortType] = useState<Option | null>(SORT_TYPE_OPTIONS[1]);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [transaction, setTranscation] = useState<SaleTransactionsData | null>();
  const params = sortBy?.data?.reduce((previousValue, currentValue) => {
    return { ...previousValue, [currentValue]: sortType?.value };
  }, {});
  const windowSize = useWindowSize();
  const isMd = windowSize >= MD;
  const { data: dataMyself } = useFetchMyself();

  const isAdmin = dataMyself?.data.user.roles.map((role) => role.id).includes(1);

  const { data: dataTrasaction } = useFetchSales({
    order_by: params,
    search,
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
  } = dataTrasaction?.data?.transactions ?? {};
  const data = dataRes.map(
    ({
      transaction_code,
      payments,
      created_at,
      sender,
      payment_method,
      pic,
      items,
      id,
      status,
      customer,
      discount,
      purchase_date,
      ...props
    }) => ({
      id: transaction_code,
      date: formatDate(created_at, { withHour: true }),
      pic: <PIC pic={pic} sender={sender} isAdmin={!!isAdmin} />,
      detail: (
        <div>
          <label className="block">Pembeli:</label>
          <span className="text-base font-bold block mb-2">{customer?.full_name}</span>
          <label className="block">Diskon:</label>
          <span className="text-base font-bold block mb-2">{formatToIDR(discount)}</span>
          <label className="block">Pembayaran (metode):</label>
          <span className="text-base font-bold block mb-2">
            {formatToIDR(payments?.[0]?.payment_price)} ({formatPaymentMethod(payment_method)})
          </span>
          <label className="block">Tanggal Penjualan:</label>
          <span className="text-base font-bold block mb-2">{formatDate(purchase_date, { withHour: true })}</span>
          {!isMd ? <PIC pic={pic} sender={sender} isAdmin={!!isAdmin} /> : null}
        </div>
      ),

      col8: (
        <div className="flex gap-2">
          <Tippy content="Download Invoice">
            <ButtonDownload transactionId={id} />
          </Tippy>
          <Tippy content="Lihat detail">
            <Button
              size="small"
              onClick={() => {
                setTranscation({
                  transaction_code,
                  created_at,
                  sender,
                  discount,
                  payment_method,
                  payments,
                  pic,
                  items,
                  id,
                  status,
                  customer,
                  purchase_date,
                  ...props,
                });
              }}
            >
              <Eye width={24} height={24} />
            </Button>
          </Tippy>
        </div>
      ),
    })
  );
  const columns = React.useMemo(
    () => [
      {
        Header: 'Kode Transaksi',
        accessor: 'id', // accessor is the "key" in the data
      },
      {
        Header: 'Tanggal',
        accessor: 'date',
      },
      {
        Header: 'Detail Pembelian',
        accessor: 'detail',
        width: '30%',
      },

      ...(isMd
        ? [
            {
              Header: 'Kasir & Pengirim',
              accessor: 'pic',
            },
          ]
        : []),

      {
        Header: 'Aksi',
        accessor: 'col8',
        width: '100px',
      },
    ],
    [isMd]
  );
  return (
    <CardDashboard>
      {transaction && (
        <DetailSale
          transactions={transaction}
          open={!!transaction}
          onClose={() => {
            setTranscation(null);
          }}
        />
      )}

      <Table
        columns={columns}
        data={data}
        search={() => (
          <div className="mt-2 mb-4 flex justify-between">
            <h2 className="text-2xl font-bold">Daftar Transaksi</h2>
            <div className="flex flex-col items-end">
              <div className="flex flex-wrap mb-4">
                <TextField
                  Icon={<Search />}
                  value={search}
                  onChange={(e) => {
                    setPaginationUrl('');
                    setSearch(e.target.value);
                  }}
                  variant="contained"
                  placeholder="Cari nama transaksi"
                />
                <Link href="/transaction/add">
                  <span>
                    <Button className="ml-3" Icon={<PlusLg className="w-4" />}>
                      Tambah
                    </Button>
                  </span>
                </Link>
              </div>

              <div className="flex flex-wrap justify-end -mr-4 -mb-4">
                <SelectSortBy
                  value={sortBy}
                  onChange={(val) => {
                    setSortBy(val as Option<string[]>);
                  }}
                  options={SALE_SORT_BY_OPTIONS}
                />

                <SelectSortType
                  value={sortType}
                  defaultValue={SORT_TYPE_OPTIONS[1]}
                  onChange={(val) => {
                    setSortType(val as Option);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      />
      <Pagination
        stats={{
          from: `${from ?? '0'}`,
          to: `${to ?? '0'}`,
          total: `${total ?? '0'}`,
        }}
        onClickGoToPage={(val) => {
          setPaginationUrl(`${(last_page_url as string).split('?')[0]}?page=${val}`);
        }}
        onChangePerPage={(page) => {
          setPaginationUrl('');
          setPageSize(page?.value ?? 0);
        }}
        onClickPageButton={(url) => {
          setPaginationUrl(url);
        }}
        links={links?.filter(({ label }) => !['&laquo; Previous', 'Next &raquo;'].includes(label)) ?? []}
        onClickNext={() => {
          setPaginationUrl((next_page_url as string) ?? '');
        }}
        onClickPrevious={() => {
          setPaginationUrl((prev_page_url as string) ?? '');
        }}
      />
    </CardDashboard>
  );
};

const ButtonDownload = ({ transactionId }: { transactionId: string }) => {
  const { refetch: refetchDownload, isLoading } = useFetchInvoice(transactionId, {
    enabled: false,
  });
  const handleDownload = async () => {
    // download invoice

    const { data } = await refetchDownload();

    if (data) {
      printInvoice(data);
    }
  };

  return (
    <Button disabled={isLoading} loading={isLoading} size="small" onClick={handleDownload}>
      <Download width={24} height={24} />
    </Button>
  );
};

const PIC = ({ pic, sender, isAdmin }: { pic: Pic; sender: Sender; isAdmin: boolean }) => {
  return isAdmin ? (
    <div>
      <label>Kasir:</label>
      <a
        href={`/employee/${pic.id}`}
        className="block font-bold mb-2 hover:text-blue-600"
      >{`${pic.employee.first_name} ${pic.employee.last_name}`}</a>
      <label>Pengirim:</label>
      <a
        href={`/employee/${sender.id}`}
        className="block font-bold hover:text-blue-600"
      >{`${sender?.first_name} ${sender?.last_name}`}</a>
    </div>
  ) : (
    <div>
      <label>Kasir:</label>
      <span className="block font-bold mb-2">{`${pic.employee.first_name} ${pic.employee.last_name}`}</span>
      <label>Pengirim:</label>
      <span className="block font-bold">{`${sender?.first_name} ${sender?.last_name}`}</span>
    </div>
  );
};
export default TransactionPage;
