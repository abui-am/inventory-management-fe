import { NextPage } from 'next';
import Link from 'next/link';
import React from 'react';
import { PlusLg, Search } from 'react-bootstrap-icons';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { TextField } from '@/components/Form';
import Pagination from '@/components/Pagination';
import Table from '@/components/Table';
import { DetailStockIn } from '@/components/table/TableComponent';
import useFetchTransactions from '@/hooks/query/useFetchStockIn';
import { formatDate, formatToIDR } from '@/utils/format';

const TransactionPage: NextPage<unknown> = () => {
  const [paginationUrl, setPaginationUrl] = React.useState('');
  const { data: dataTrasaction } = useFetchTransactions({
    order_by: { created_at: 'desc' },
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
  } = dataTrasaction?.data.transactions ?? {};
  const data = dataRes.map(
    ({ transaction_code, created_at, supplier, payment_method, pic, items, id, status, ...props }) => ({
      col1: transaction_code,
      col2: formatDate(created_at, { withHour: true }),
      col4: payment_method,
      col5: formatToIDR(items.reduce((prev, next) => prev + next.pivot.total_price, 0)),
      col6: `${pic.employee.first_name} ${pic.employee.last_name}`,
      col7: 'Abui',
      col8: (
        <DetailStockIn
          transactions={{ transaction_code, created_at, supplier, payment_method, pic, items, id, status, ...props }}
        />
      ),
    })
  );
  const columns = React.useMemo(
    () => [
      {
        Header: 'Kode Transaksi',
        accessor: 'col1', // accessor is the "key" in the data
      },
      {
        Header: 'Tanggal',
        accessor: 'col2',
      },
      {
        Header: 'Metode Pembayaran',
        accessor: 'col4',
      },
      {
        Header: 'Pembayaran',
        accessor: 'col5',
      },
      {
        Header: 'Kasir',
        accessor: 'col6',
      },

      {
        Header: 'Pengirim',
        accessor: 'col7',
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
        onClickPageButton={(url) => {
          setPaginationUrl(url);
        }}
        links={links?.filter(({ label }) => !['&laquo; Previous', 'Next &raquo;'].includes(label)) ?? []}
        onClickNext={() => {
          setPaginationUrl(next_page_url ?? '');
        }}
        onClickPrevious={() => {
          setPaginationUrl(prev_page_url ?? '');
        }}
      />
    </CardDashboard>
  );
};

export default TransactionPage;
