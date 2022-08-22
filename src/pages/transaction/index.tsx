import Tippy from '@tippyjs/react';
import { NextPage } from 'next';
import Link from 'next/link';
import React, { useState } from 'react';
import { Eye, PlusLg, Search } from 'react-bootstrap-icons';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { SelectSortBy, SelectSortType, TextField } from '@/components/Form';
import Pagination from '@/components/Pagination';
import Table from '@/components/Table';
import { DetailSale } from '@/components/table/TableComponent';
import { SALE_SORT_BY_OPTIONS, SORT_TYPE_OPTIONS } from '@/constants/options';
import { useFetchMyself } from '@/hooks/query/useFetchEmployee';
import useFetchSales from '@/hooks/query/useFetchSale';
import { Option } from '@/typings/common';
import { SaleTransactionsData } from '@/typings/sale';
import { formatDate, formatPaymentMethod, formatToIDR } from '@/utils/format';

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
      payment,
      created_at,
      sender,
      payment_method,
      pic,
      items,
      id,
      status,
      customer,
      discount,
      ...props
    }) => ({
      id: transaction_code,
      date: formatDate(created_at, { withHour: true }),
      pic: isAdmin ? (
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
      ),
      customer: (
        <div>
          <label className="block">Pembeli:</label>
          <span className="text-base font-bold block mb-2">{customer?.full_name}</span>
          <label className="block">Diskon:</label>
          <span className="text-base font-bold block mb-2">{formatToIDR(discount)}</span>
          <label className="block">Pembayaran (metode):</label>
          <span className="text-base font-bold block mb-2">
            {formatToIDR(payment?.payment_price)} ({formatPaymentMethod(payment_method)})
          </span>
        </div>
      ),

      col8: (
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
                payment,
                pic,
                items,
                id,
                status,
                customer,
                ...props,
              });
            }}
          >
            <Eye width={24} height={24} />
          </Button>
        </Tippy>
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
        accessor: 'customer',
        width: '30%',
      },

      {
        Header: 'Kasir & Pengirim',
        accessor: 'pic',
      },

      {
        Header: 'Aksi',
        accessor: 'col8',
        width: '100px',
      },
    ],
    []
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
                  <a>
                    <Button className="ml-3" Icon={<PlusLg className="w-4" />}>
                      Tambah
                    </Button>
                  </a>
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

export default TransactionPage;
