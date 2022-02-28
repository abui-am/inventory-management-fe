import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { NextPage } from 'next';
import Link from 'next/link';
import React, { useState } from 'react';
import { CashCoin, PlusLg, Search } from 'react-bootstrap-icons';
import { object } from 'yup';

import { Button, ButtonWithModal } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import {
  DatePickerComponent,
  DateRangePicker,
  SelectSortBy,
  SelectSortType,
  TextField,
  WithLabelAndError,
} from '@/components/Form';
import CreatePrepaidSalary from '@/components/form/CreatePrepaidSalary';
import PaySalaryForm from '@/components/form/PaySalary';
import Modal, { ModalActionWrapper } from '@/components/Modal';
import Pagination from '@/components/Pagination';
import { SelectSender } from '@/components/Select';
import Table from '@/components/Table';
import { DetailSale } from '@/components/table/TableComponent';
import { SALE_SORT_BY_OPTIONS, SORT_TYPE_OPTIONS } from '@/constants/options';
import useFetchSales from '@/hooks/query/useFetchSale';
import { Option } from '@/typings/common';
import { formatDate, formatToIDR } from '@/utils/format';
import createSchema from '@/utils/validation/formik';

const PrepaidSalaryPage: NextPage<unknown> = () => {
  const [paginationUrl, setPaginationUrl] = React.useState('');
  const [sortBy, setSortBy] = useState<Option<string[]> | null>(SALE_SORT_BY_OPTIONS[0]);
  const [sortType, setSortType] = useState<Option | null>(SORT_TYPE_OPTIONS[1]);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const params = sortBy?.data?.reduce((previousValue, currentValue) => {
    return { ...previousValue, [currentValue]: sortType?.value };
  }, {});

  const [date, setDate] = useState(new Date());

  const dataSalary = {
    data: {
      prepaid_salary: {
        data: [
          {
            name: 'Dani Fadli Irmawan',
            position: 'Teknisi',
            status: 'paid',
            paid_amount: 4000000,
            salary: 4000000,
          },
        ],
      },
    } as any,
  };

  const isCreateNew = true;
  const {
    data: dataRes = [],
    from,
    to,
    total,
    links,
    next_page_url,
    prev_page_url,
    last_page_url,
  } = dataSalary?.data.prepaid_salary ?? {};
  const data = dataRes.map(({ name, position, status, paid_amount, salary }: any) => ({
    name,
    position,
    status,
    paidAmount: formatToIDR(paid_amount),
    salary: formatToIDR(salary),
    action: <PaySalary />,
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
        Header: 'Status',
        accessor: 'status',
      },
      {
        Header: 'Dibayarkan',
        accessor: 'paidAmount',
      },
      {
        Header: 'Jumlah Gaji Bulanan',
        accessor: 'salary',
      },
      {
        Header: 'Aksi',
        accessor: 'action',
      },
    ],
    []
  );
  return (
    <CardDashboard>
      <div className="mt-2 mb-4 flex justify-between">
        <h2 className="text-2xl font-bold">Daftar Gaji Bulanan Karyawan</h2>
        <div className="flex flex-col items-end">
          <div className="flex flex-wrap mb-4">
            <DatePickerComponent
              dateFormat="MMMM yyyy"
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
      {isCreateNew ? (
        <CreateNewPayrollList date={date} />
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

const PaySalary = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Button className="ml-3" onClick={handleOpen}>
        <CashCoin />
      </Button>
      <Modal isOpen={isOpen} onRequestClose={handleClose}>
        <PaySalaryForm />
      </Modal>
    </>
  );
};

const CreateNewPayrollList = ({ date }: { date: Date }) => {
  const handleClick = () => {
    return null;
  };
  return (
    <section className="h-96 flex items-center flex-col justify-center">
      <h3 className="text-xl block mb-4">
        Anda belum membuat daftar gaji yang harus dibayar bulan {dayjs(date).format('MMMM YYYY')}
      </h3>

      <ButtonWithModal text="Buat Daftar">
        {({ handleClose }) => {
          return (
            <>
              <h2 className="text-xl font-bold mb-4">Konfirmasi</h2>
              <ModalActionWrapper>
                <Button variant="secondary" onClick={handleClose} className="mr-2">
                  Batalkan
                </Button>
                <Button onClick={handleClick}>Buat Daftar</Button>
              </ModalActionWrapper>
            </>
          );
        }}
      </ButtonWithModal>
    </section>
  );
};

export default PrepaidSalaryPage;
