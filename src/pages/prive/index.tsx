import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { NextPage } from 'next';
import Link from 'next/link';
import React, { useState } from 'react';
import { PlusLg, Search } from 'react-bootstrap-icons';
import { object } from 'yup';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { DateRangePicker, SelectSortBy, SelectSortType, TextField, WithLabelAndError } from '@/components/Form';
import CreatePrepaidSalary from '@/components/form/CreatePrepaidSalary';
import CreatePrive from '@/components/form/CreatePrive';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import { SelectSender } from '@/components/Select';
import Table from '@/components/Table';
import { DetailSale } from '@/components/table/TableComponent';
import { SALE_SORT_BY_OPTIONS, SORT_TYPE_OPTIONS } from '@/constants/options';
import useFetchSales from '@/hooks/query/useFetchSale';
import { Option } from '@/typings/common';
import { formatDate, formatToIDR } from '@/utils/format';
import createSchema from '@/utils/validation/formik';

const PrivePage: NextPage<unknown> = () => {
  const [paginationUrl, setPaginationUrl] = React.useState('');
  const [sortBy, setSortBy] = useState<Option<string[]> | null>(SALE_SORT_BY_OPTIONS[0]);
  const [sortType, setSortType] = useState<Option | null>(SORT_TYPE_OPTIONS[1]);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const params = sortBy?.data?.reduce((previousValue, currentValue) => {
    return { ...previousValue, [currentValue]: sortType?.value };
  }, {});

  const [toDate, setToDate] = useState(new Date());
  const [fromDate, setFromDate] = useState(new Date());

  const dataPrepaidSalary = {
    data: {
      prepaid_salary: {
        data: [
          {
            date: '2022-06-28T13:31:13+0700',
            description: 'Untuk makan',
            amount: 2000000,
          },
        ],
      },
    } as any,
  };

  const {
    data: dataRes = [],
    from,
    to,
    total,
    links,
    next_page_url,
    prev_page_url,
    last_page_url,
  } = dataPrepaidSalary?.data.prepaid_salary ?? {};
  const data = dataRes.map(({ date, description, amount }: any) => ({
    date: formatDate(date),
    description,
    amount: formatToIDR(amount),
  }));
  const columns = React.useMemo(
    () => [
      {
        Header: 'Tanggal',
        accessor: 'date', // accessor is the "key" in the data
      },
      {
        Header: 'Description',
        accessor: 'description',
      },
      {
        Header: 'Jumlah penarikan',
        accessor: 'amount',
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
            <h2 className="text-2xl font-bold">Daftar Prive</h2>
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
                <AddPrive />
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
        links={links?.filter(({ label }: any) => !['&laquo; Previous', 'Next &raquo;'].includes(label)) ?? []}
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

const AddPrive = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Button className="ml-3" onClick={handleOpen} Icon={<PlusLg className="w-4" />}>
        Tambah
      </Button>
      <Modal isOpen={isOpen} onRequestClose={handleClose}>
        <CreatePrive />
      </Modal>
    </>
  );
};

export default PrivePage;
