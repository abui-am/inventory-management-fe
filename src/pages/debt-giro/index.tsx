// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// import dayjs from 'dayjs';
// import { useFormik } from 'formik';
import { NextPage } from 'next';
// import Link from 'next/link';
import React, { useState } from 'react';

// import { PlusLg, Search } from 'react-bootstrap-icons';
// import { object } from 'yup';
// import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { DateRangePicker, SelectSortBy, SelectSortType } from '@/components/Form';
// import CreatePrepaidSalary from '@/components/form/CreatePrepaidSalary';
// import CreatePrive from '@/components/form/CreatePrive';
// import Modal from '@/components/Modal';
// import Pagination from '@/components/Pagination';
// import { SelectSender } from '@/components/Select';
import Table from '@/components/Table';
// import { DetailSale } from '@/components/table/TableComponent';
import { SALE_SORT_BY_OPTIONS, SORT_TYPE_OPTIONS } from '@/constants/options';
// import useFetchSales from '@/hooks/query/useFetchSale';
import { Option } from '@/typings/common';
import { formatDate, formatToIDR } from '@/utils/format';

const PrivePage: NextPage<unknown> = () => {
  // const [setPaginationUrl] = React.useState('');
  const [sortBy, setSortBy] = useState<Option<string[]> | null>(SALE_SORT_BY_OPTIONS[0]);
  const [sortType, setSortType] = useState<Option | null>(SORT_TYPE_OPTIONS[1]);
  // const [setPageSize] = useState(10);
  // const [search, setSearch] = useState('');
  // const params = sortBy?.data?.reduce((previousValue, currentValue) => {
  //   return { ...previousValue, [currentValue]: sortType?.value };
  // }, {});

  const [toDate, setToDate] = useState(new Date());
  const [fromDate, setFromDate] = useState(new Date());

  const dataPrepaidSalary = {
    data: {
      prepaid_salary: {
        data: [
          {
            date: '2022-06-28T13:31:13+0700',
            description: 'Untuk makan',
            status: 'paid',
            paid: 2000000,
            debtAmount: 20000000,
          },
        ],
      },
    } as any,
  };

  const {
    data: dataRes = [],
    // from,
    // to,
    // total,
    // links,
    // next_page_url,
    // prev_page_url,
    // last_page_url,
  } = dataPrepaidSalary?.data.prepaid_salary ?? {};
  const data = dataRes.map(({ date, description, status, paid, debtAmount }: any) => ({
    date: formatDate(date),
    description,
    status,
    paid: formatToIDR(paid),
    debtAmount: formatToIDR(debtAmount),
  }));
  const columns = React.useMemo(
    () => [
      {
        Header: 'Tanggal',
        accessor: 'date', // accessor is the "key" in the data
      },
      {
        Header: 'Keterangan',
        accessor: 'description',
      },
      {
        Header: 'Status',
        accessor: 'status',
      },
      {
        Header: 'Dibayarkan',
        accessor: 'paid',
      },
      {
        Header: 'Jumlah Utang',
        accessor: 'debtAmount',
      },
    ],
    []
  );
  return (
    <CardDashboard>
      <Table
        columns={columns}
        data={data}
        search={() => (
          <div className="mt-2 mb-4 flex justify-between">
            <h2 className="text-2xl font-bold">Daftar Utang Giro Perusahaan</h2>
            <div className="flex flex-col items-end">
              <div className="flex flex-wrap mb-4">
                <DateRangePicker
                  values={[fromDate, toDate]}
                  onChangeFrom={(date) => {
                    setFromDate(date);
                  }}
                  onChangeTo={(date) => {
                    setToDate(date);
                  }}
                />
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
      {/* <Pagination
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
        links={links?.filter(({ label }: any) => !['&laquo; Previous', 'Next &raquo;'].includes(label)) ?? []}
        onClickNext={() => {
          setPaginationUrl((next_page_url as string) ?? '');
        }}
        onClickPrevious={() => {
          setPaginationUrl((prev_page_url as string) ?? '');
        }}
      /> */}
    </CardDashboard>
  );
};

export default PrivePage;
