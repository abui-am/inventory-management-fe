// import Link from 'next/link';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { Eye, Search } from 'react-bootstrap-icons';

import Table from '@/components/Table';
import { ITEMS_SORT_BY_OPTIONS, SORT_TYPE_OPTIONS } from '@/constants/options';
// import { useFetchItems } from '@/hooks/query/useFetchItem';
import { Option } from '@/typings/common';

import { Button } from '../Button';
// import { formatDate } from '@/utils/format';
// import formatCurrency from '@/utils/formatCurrency';
// import { Button } from '../Button';
import { SelectSortBy, SelectSortType, TextField } from '../Form';
// import Pagination from '../Pagination';
const TableCapitalChangeList: React.FC = () => {
  //   const router = useRouter();
  const [, setPaginationUrl] = React.useState('');
  const [sortBy, setSortBy] = useState<Option<string[]> | null>(ITEMS_SORT_BY_OPTIONS[0]);
  const [sortType, setSortType] = useState<Option | null>(SORT_TYPE_OPTIONS[0]);
  const [,] = useState(10);
  const [search, setSearch] = useState('');
  //   const params = sortBy?.data?.reduce((previousValue, currentValue) => {
  //     return { ...previousValue, [currentValue]: sortType?.value };
  //   }, {});

  //   const { data: dataItems } = useFetchItems({
  //     forceUrl: paginationUrl,
  //     order_by: params,
  //     search,
  //     per_page: pageSize,
  //   });

  //   const {
  //     from,
  //     to,
  //     total,
  //     links,
  //     next_page_url,
  //     last_page_url,
  //     prev_page_url,
  //   } = dataItems?.data?.items ?? {};

  const dataRes = [
    {
      name: 'Laporan 0001',
      date: '25 Nov 2022 - 26 Nov-2022',
      action: (
        <Link href={`/laporan-perubahan-modal/${'1'}`}>
          <Button>
            <Eye />
          </Button>
        </Link>
      ),
    },
  ];
  const data = dataRes.map(({ name, action, date }) => ({
    name,
    date,
    action,
    // action: formatToIDR(items.reduce((prev, next) => prev + next.pivot.total_price, 0)),
  }));

  const columns = React.useMemo(
    () => [
      {
        Header: 'Nama',
        accessor: 'name', // accessor is the "key" in the data
      },
      {
        Header: 'Tanggal',
        accessor: 'data',
      },
      {
        Header: 'Action',
        accessor: 'action',
      },
    ],
    []
  );

  return (
    <>
      <Table
        columns={columns}
        data={data}
        search={() => (
          <div className="mt-2 mb-6 flex justify-between">
            <h2 className="text-2xl font-bold">Barang</h2>
            <div className="flex">
              <div className="flex flex-wrap">
                <SelectSortBy
                  value={sortBy}
                  onChange={(val) => {
                    setSortBy(val as Option<string[]>);
                  }}
                  options={ITEMS_SORT_BY_OPTIONS}
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
                value={search}
                onChange={(e) => {
                  setPaginationUrl('');
                  setSearch(e.target.value);
                }}
                variant="contained"
                placeholder="Cari nama barang"
              />
            </div>
          </div>
        )}
      />
      {/* <Pagination
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
        onClickGoToPage={(val) => {
          setPaginationUrl(`${(last_page_url as string).split('?')[0]}?page=${val}`);
        }}
        onChangePerPage={(page) => {
          setPaginationUrl('');
          setPageSize(page?.value ?? 0);
        }}
      /> */}
    </>
  );
};

export default TableCapitalChangeList;
