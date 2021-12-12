import { NextPage } from 'next';
import Link from 'next/link';
import React, { useState } from 'react';
import { PlusLg, Search } from 'react-bootstrap-icons';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { SelectSortBy, SelectSortType, TextField } from '@/components/Form';
import Pagination from '@/components/Pagination';
import Table from '@/components/Table';
import { DetailSale } from '@/components/table/TableComponent';
import { SALE_SORT_BY_OPTIONS, SORT_TYPE_OPTIONS } from '@/constants/options';
import useFetchSales from '@/hooks/query/useFetchSale';
import { Option } from '@/typings/common';
import { formatDate, formatToIDR } from '@/utils/format';

const TransactionPage: NextPage<unknown> = () => {
  const [paginationUrl, setPaginationUrl] = React.useState('');
  const [sortBy, setSortBy] = useState<Option<string[]> | null>(SALE_SORT_BY_OPTIONS[0]);
  const [sortType, setSortType] = useState<Option | null>(SORT_TYPE_OPTIONS[0]);
  const [pageSize, setPageSize] = useState(10);
  const params = sortBy?.data?.reduce((previousValue, currentValue) => {
    return { ...previousValue, [currentValue]: sortType?.value };
  }, {});

  const { data: dataTrasaction } = useFetchSales({
    order_by: params,
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
  } = dataTrasaction?.data.transactions ?? {};
  const data = dataRes.map(
    ({ transaction_code, created_at, sender, payment_method, pic, items, id, status, customer, ...props }) => ({
      id: transaction_code,
      date: formatDate(created_at, { withHour: true }),
      purchaseMethod: payment_method,
      payAmount: formatToIDR(items.reduce((prev, next) => prev + next.pivot.total_price, 0)),
      pic: `${pic.employee.first_name} ${pic.employee.last_name}`,
      customer: customer?.full_name,
      sender: `${sender?.first_name} ${sender?.last_name}`,
      col8: (
        <DetailSale
          transactions={{
            transaction_code,
            created_at,
            sender,
            payment_method,
            pic,
            items,
            id,
            status,
            customer,
            ...props,
          }}
        />
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
        Header: 'Pembeli',
        accessor: 'customer',
      },
      {
        Header: 'Metode Pembayaran',
        accessor: 'purchaseMethod',
      },
      {
        Header: 'Pembayaran',
        accessor: 'payAmount',
      },

      {
        Header: 'Kasir',
        accessor: 'pic',
      },
      {
        Header: 'Pengirim',
        accessor: 'sender',
      },

      {
        Header: 'Aksi',
        accessor: 'col8',
      },
    ],
    []
  );
  return (
    <CardDashboard>
      <Table
        columns={columns}
        data={data}
        search={({ setGlobalFilter }) => (
          <div className="mt-2 mb-6 flex justify-between">
            <h2 className="text-2xl font-bold">Daftar Transaksi</h2>

            <div className="flex">
              <div className="flex flex-wrap">
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
              <TextField
                Icon={<Search />}
                onChange={(e) => setGlobalFilter(e.target.value)}
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
