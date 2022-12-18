// import Link from 'next/link';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { Eye, PlusLg } from 'react-bootstrap-icons';

import Table from '@/components/Table';
import { ITEMS_SORT_BY_OPTIONS, SORT_TYPE_OPTIONS } from '@/constants/options';
import { useFetchCapitalReportDates } from '@/hooks/query/useFetchCapitalReportDate';
// import { useFetchItems } from '@/hooks/query/useFetchItem';
import { Option } from '@/typings/common';
import { formatDate } from '@/utils/format';

import { Button } from '../Button';
// import { formatDate } from '@/utils/format';
// import formatCurrency from '@/utils/formatCurrency';
// import { Button } from '../Button';
import { SelectSortBy, SelectSortType } from '../Form';
import Pagination from '../Pagination';
// import Pagination from '../Pagination';
const TableCapitalChangeList: React.FC = () => {
  //   const router = useRouter();
  const [paginationUrl, setPaginationUrl] = React.useState('');
  const [sortBy, setSortBy] = useState<Option<string[]> | null>(ITEMS_SORT_BY_OPTIONS[0]);
  const [sortType, setSortType] = useState<Option | null>(SORT_TYPE_OPTIONS[0]);
  const [pageSize, setPageSize] = useState(10);

  const params = sortBy?.data?.reduce((previousValue, currentValue) => {
    return { ...previousValue, [currentValue]: sortType?.value };
  }, {});

  const { data: dataFetch } = useFetchCapitalReportDates({
    forceUrl: paginationUrl,
    order_by: params,
    per_page: pageSize,
  });

  const { from, to, total, links, next_page_url, last_page_url, prev_page_url } = {} as any;

  const dataRes = dataFetch?.data?.report_dates;
  const router = useRouter();

  const handleOpen = () => {
    router.push('/laporan-perubahan-modal/create');
  };
  const data =
    dataRes?.map(({ end_date, start_date }) => ({
      name: `Laporan ${formatDate(end_date)}`,
      date: `${start_date ? `${formatDate(start_date)} -` : ''} ${formatDate(end_date)}`,
      action: (
        <Link href={`/laporan-perubahan-modal/${end_date}`}>
          <Button>
            <Eye />
          </Button>
        </Link>
      ),
      // action: formatToIDR(items.reduce((prev, next) => prev + next.pivot.total_price, 0)),
    })) ?? [];

  const columns = React.useMemo(
    () => [
      {
        Header: 'Nama',
        accessor: 'name', // accessor is the "key" in the data
      },
      {
        Header: 'Tanggal',
        accessor: 'date',
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
            <h2 className="text-2xl font-bold">Laporan Perubahan Modal</h2>
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

              <Button className="ml-3" onClick={handleOpen} Icon={<PlusLg className="w-4" />}>
                Tambah
              </Button>
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
        links={links?.filter(({ label }: any) => !['&laquo; Previous', 'Next &raquo;'].includes(label)) ?? []}
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
      />
    </>
  );
};

export default TableCapitalChangeList;
