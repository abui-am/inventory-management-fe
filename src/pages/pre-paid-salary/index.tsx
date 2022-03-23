import dayjs from 'dayjs';
import { NextPage } from 'next';
import React, { useState } from 'react';
import { PlusLg } from 'react-bootstrap-icons';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { DateRangePicker, SelectSortBy, SelectSortType } from '@/components/Form';
import CreatePrepaidSalary from '@/components/form/CreatePrepaidSalary';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import Table from '@/components/Table';
import { ADVANCE_PAYROLLS_SORT_BY_OPTIONS, SORT_TYPE_OPTIONS } from '@/constants/options';
import { useFetchAdvancePayrolls } from '@/hooks/query/useFetchAdvancePayrolls';
import { Option } from '@/typings/common';
import { formatDate, formatToIDR } from '@/utils/format';

const PrepaidSalaryPage: NextPage<unknown> = () => {
  const [paginationUrl, setPaginationUrl] = React.useState('');
  const [sortBy, setSortBy] = useState<Option<string[]> | null>(ADVANCE_PAYROLLS_SORT_BY_OPTIONS[0]);
  const [sortType, setSortType] = useState<Option | null>(SORT_TYPE_OPTIONS[1]);
  const [pageSize, setPageSize] = useState(10);

  const [toDate, setToDate] = useState(new Date());
  const [fromDate, setFromDate] = useState(new Date());

  const { data: dataPrepaidSalary } = useFetchAdvancePayrolls({
    per_page: pageSize,
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
  } = dataPrepaidSalary?.data.advance_payrolls ?? {};
  const data = dataRes.map(({ employee, employee_position, payroll_month, created_at, amount }) => ({
    name: `${employee.first_name} ${employee.last_name}`,
    position: employee_position,
    paidDate: formatDate(created_at),
    salaryDate: dayjs(payroll_month).format('MMM YYYY'),
    amount: formatToIDR(amount),
  }));
  const columns = React.useMemo(
    () => [
      {
        Header: 'Nama',
        accessor: 'name', // accessor is the "key" in the data
      },
      {
        Header: 'Jabatan',
        accessor: 'position',
      },
      {
        Header: 'Tanggal Dibayar',
        accessor: 'paidDate',
      },
      {
        Header: 'Bulan Gajian',
        accessor: 'salaryDate',
      },
      {
        Header: 'Pembayaran',
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
            <h2 className="text-2xl font-bold">Daftar Gaji dibayar di Muka</h2>
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
                <AddPrepaidSalary />
              </div>

              <div className="flex flex-wrap justify-end -mr-4 -mb-4">
                <SelectSortBy
                  value={sortBy}
                  onChange={(val) => {
                    setSortBy(val as Option<string[]>);
                  }}
                  options={ADVANCE_PAYROLLS_SORT_BY_OPTIONS}
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

const AddPrepaidSalary = () => {
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
        <CreatePrepaidSalary onSave={handleClose} onClose={handleClose} />
      </Modal>
    </>
  );
};

export default PrepaidSalaryPage;
