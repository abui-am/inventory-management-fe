// import Link from 'next/link';
import React from 'react';
import { Search } from 'react-bootstrap-icons';

import Table from '@/components/Table';
import { useFetchItems } from '@/hooks/query/useFetchItem';
import { formatDate } from '@/utils/format';

// import { Button } from '../Button';
import { TextField } from '../Form';
import Pagination from '../Pagination';
const TableItems: React.FC = () => {
  const [paginationUrl, setPaginationUrl] = React.useState('');

  const { data: dataItems } = useFetchItems({
    order_by: { created_at: 'desc' },
    forceUrl: paginationUrl,
  });

  const { data: dataRes = [], from, to, total, links, next_page_url, prev_page_url } = dataItems?.data.items ?? {};
  const data = dataRes.map(({ name, quantity, unit, updated_at }) => ({
    name,
    quantity,
    unit,
    updated_at: formatDate(updated_at, { withHour: true }),
    // action: formatToIDR(items.reduce((prev, next) => prev + next.pivot.total_price, 0)),
  }));

  const columns = React.useMemo(
    () => [
      {
        Header: 'Nama',
        accessor: 'name', // accessor is the "key" in the data
      },
      {
        Header: 'Jumlah Stock',
        accessor: 'quantity',
      },
      {
        Header: 'Kemasan',
        accessor: 'unit',
      },
      {
        Header: 'Tanggal masuk terakhir',
        accessor: 'updated_at',
      },

      // {
      //   Header: 'Aksi',
      //   accessor: 'action',
      // },
    ],
    []
  );

  return (
    <>
      <Table
        columns={columns}
        data={data}
        search={({ setGlobalFilter }) => (
          <div className="mt-2 mb-6 flex justify-between">
            <h2 className="text-2xl font-bold">Barang</h2>
            <div className="flex">
              <TextField
                Icon={<Search />}
                onChange={(e) => setGlobalFilter(e.target.value)}
                variant="contained"
                placeholder="Cari nama barang"
              />
              {/* <Link href="/stock-in/add">
                    <a>
                      <Button className="ml-3" Icon={<Calculator className="w-4" />}>
                        Tambah
                      </Button>
                    </a>
                  </Link> */}
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
    </>
  );
};

export default TableItems;
