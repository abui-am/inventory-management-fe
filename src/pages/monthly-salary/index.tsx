import Tippy from '@tippyjs/react';
import dayjs from 'dayjs';
import { NextPage } from 'next';
import React, { useState } from 'react';
import { CashCoin } from 'react-bootstrap-icons';

import { Button, ButtonWithModal } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { DatePickerComponent, SelectSortBy, SelectSortType } from '@/components/Form';
import PaySalaryForm from '@/components/form/PaySalary';
import Modal, { ModalActionWrapper } from '@/components/Modal';
import Pagination from '@/components/Pagination';
import Table from '@/components/Table';
import { PAYROLLS_SORT_BY_OPTIONS, SORT_TYPE_OPTIONS } from '@/constants/options';
import { useCreateSalary } from '@/hooks/mutation/useMutateSalary';
import { useFetchSalary } from '@/hooks/query/useFetchSalary';
import { Option } from '@/typings/common';
import { Datum } from '@/typings/salary';
import { formatDateYYYYMM, formatToIDR } from '@/utils/format';

const PrepaidSalaryPage: NextPage<unknown> = () => {
  const [paginationUrl, setPaginationUrl] = React.useState('');
  const [sortBy, setSortBy] = useState<Option<string[]> | null>(PAYROLLS_SORT_BY_OPTIONS[0]);
  const [sortType, setSortType] = useState<Option | null>(SORT_TYPE_OPTIONS[0]);
  const [pageSize, setPageSize] = useState(10);

  const [date, setDate] = useState(new Date());
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

  const data = dataRes.map(
    ({ employee, paid_in_advance, employee_position: position, status, paid_amount, employee_salary, ...props }) => ({
      name: <div className="font-bold">{`${employee?.first_name} ${employee?.last_name}`}</div>,
      position,
      status: (
        <div className={status === 'lunas' ? 'text-blue-600 font-bold' : ''}>
          {`${status} ${paid_in_advance ? ' (dibayar dimuka)' : ''}`}
        </div>
      ),
      paidAmount: formatToIDR(paid_amount),
      salary: formatToIDR(employee_salary),
      action: (
        <PaySalary
          payroll={{
            employee,
            paid_in_advance,
            employee_position: position,
            status,
            paid_amount,
            employee_salary,
            ...props,
          }}
        />
      ),
    })
  );
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

const PaySalary: React.FC<{ payroll: Datum }> = ({ payroll }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Tippy content="Bayar gaji">
        <Button className="ml-3" onClick={handleOpen}>
          <CashCoin />
        </Button>
      </Tippy>

      <Modal isOpen={isOpen} onRequestClose={handleClose}>
        <PaySalaryForm onSave={handleClose} onClose={handleClose} payroll={payroll} />
      </Modal>
    </>
  );
};

const CreateNewPayrollList = ({ date }: { date: Date }) => {
  const { mutateAsync } = useCreateSalary();

  return (
    <section className="h-96 flex items-center flex-col justify-center">
      <h3 className="text-xl block mb-4">
        Anda belum membuat daftar gaji yang harus dibayar bulan {dayjs(date).format('MMMM YYYY')}
      </h3>

      <ButtonWithModal text="Buat Daftar">
        {({ handleClose }) => {
          const handleClick = () => {
            mutateAsync({
              month: formatDateYYYYMM(date),
            });
            handleClose();
          };

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
