import dayjs from 'dayjs';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { DatePickerComponent, SelectSortBy, SelectSortType } from '@/components/Form';
import Pagination from '@/components/Pagination';
import Table from '@/components/Table';
import { PAYROLLS_SORT_BY_OPTIONS, SORT_TYPE_OPTIONS } from '@/constants/options';
import { useFetchSalary } from '@/hooks/query/useFetchSalary';
import useSalary from '@/hooks/table/useSalary';
import { Option } from '@/typings/common';
import { formatDateYYYYMM } from '@/utils/format';

const PrepaidSalaryPage: NextPage<unknown> = () => {
  const [paginationUrl, setPaginationUrl] = React.useState('');

  const [sortBy, setSortBy] = useState<Option<string[]> | null>(PAYROLLS_SORT_BY_OPTIONS[0]);
  const [sortType, setSortType] = useState<Option | null>(SORT_TYPE_OPTIONS[0]);
  const [pageSize, setPageSize] = useState(10);
  const router = useRouter();
  const [date, setDate] = useState(router.query.date ? new Date(router.query.date as string) : new Date());
  const { data: datasource } = useFetchSalary({
    per_page: pageSize,
    where_payroll_month: formatDateYYYYMM(date),
    order_by: sortBy?.data?.reduce((previousValue, currentValue) => {
      return { ...previousValue, [currentValue]: sortType?.value };
    }, {}),
    paginated: true,
    forceUrl: paginationUrl || undefined,
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
  } = datasource?.data.payrolls ?? {};

  const isCreateNew = dataRes.length === 0;

  const { columns, data } = useSalary(dataRes);

  return (
    <CardDashboard>
      <div className="mt-2 mb-4 flex justify-between">
        <h2 className="text-2xl font-bold">Daftar Gaji Bulanan Karyawan</h2>
        <div className="flex flex-col items-end">
          <div className="flex flex-wrap mb-4">
            <DatePickerComponent
              dateFormat="MMMM yyyy"
              showMonthYearPicker
              selected={date}
              onChange={(date: Date) => {
                setDate(date);
              }}
            />
          </div>

          <div className="flex flex-wrap justify-end -mr-4 -mb-4">
            <SelectSortBy
              value={sortBy}
              onChange={(val) => {
                setSortBy(val as Option<string[]>);
              }}
              options={PAYROLLS_SORT_BY_OPTIONS}
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
      {isCreateNew ? (
        <section className="h-96 flex items-center flex-col justify-center">
          <h3 className="text-xl block mb-4">
            Anda belum membuat daftar gaji yang harus dibayar bulan {dayjs(date).format('MMMM YYYY')}
          </h3>
          <Button
            onClick={() => {
              router.push({
                pathname: '/monthly-salary/preview',
                query: {
                  date: date?.toISOString(),
                },
              });
            }}
            className="mr-2"
          >
            Buat Daftar
          </Button>
        </section>
      ) : (
        <>
          <Table columns={columns} data={data} />
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
            links={links?.filter(({ label }: any) => !['&laquo; Previous', 'Next &raquo;'].includes(label)) ?? []}
            onClickNext={() => {
              setPaginationUrl((next_page_url as string) ?? '');
            }}
            onClickPrevious={() => {
              setPaginationUrl((prev_page_url as string) ?? '');
            }}
          />
        </>
      )}
    </CardDashboard>
  );
};

export default PrepaidSalaryPage;
