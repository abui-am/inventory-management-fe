import Tippy from '@tippyjs/react';
import { NextPage } from 'next';
import React, { useState } from 'react';
import { CashCoin } from 'react-bootstrap-icons';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { DateRangePicker, SelectSortBy, SelectSortType } from '@/components/Form';
import PayDebtForm from '@/components/form/PayDebt';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import Table from '@/components/Table';
import { DEBT_SORT_BY_OPTIONS, SORT_TYPE_OPTIONS } from '@/constants/options';
import { useFetchDebt } from '@/hooks/query/useFetchDebt';
import { Option } from '@/typings/common';
import { Datum } from '@/typings/debts';
import { formatDate, formatToIDR } from '@/utils/format';

const PrivePage: NextPage<unknown> = () => {
  const [paginationUrl, setPaginationUrl] = React.useState('');
  const [sortBy, setSortBy] = useState<Option<string[]> | null>(DEBT_SORT_BY_OPTIONS[0]);
  const [sortType, setSortType] = useState<Option | null>(SORT_TYPE_OPTIONS[1]);
  const [pageSize, setPageSize] = useState(10);
  const params = sortBy?.data?.reduce((previousValue, currentValue) => {
    return { ...previousValue, [currentValue]: sortType?.value };
  }, {});

  const [toDate, setToDate] = useState(new Date());
  const [fromDate, setFromDate] = useState(new Date());

  const { data: dataPrepaidSalary } = useFetchDebt({
    per_page: pageSize,
    order_by: params,
    paginated: true,
    forceUrl: paginationUrl || undefined,
    where: {
      type: 'current_account',
    },
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
  } = dataPrepaidSalary?.data.debts ?? {};
  const data = dataRes.map(({ created_at, description, is_paid, paid_amount, amount, ...props }) => ({
    date: formatDate(created_at, { withHour: true }),
    description,
    status: <div className={is_paid ? 'text-blue-600 font-bold' : ''}>{is_paid ? 'lunas' : 'belum lunas'}</div>,
    paid: formatToIDR(+paid_amount),
    debtAmount: formatToIDR(+amount),
    action: <PayDebt debt={{ created_at, description, is_paid, paid_amount, amount, ...props }} />,
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
      {
        Header: 'Aksi',
        accessor: 'action',
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
                  options={DEBT_SORT_BY_OPTIONS}
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
        onClickGoToPage={(val: any) => {
          setPaginationUrl(`${(last_page_url as string).split('?')[0]}?page=${val}`);
        }}
        onChangePerPage={(page: any) => {
          setPaginationUrl('');
          setPageSize(page?.value ?? 0);
        }}
        onClickPageButton={(url: any) => {
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

const PayDebt: React.FC<{ debt: Datum }> = ({ debt }) => {
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
        <PayDebtForm type="giro" onSave={handleClose} onClose={handleClose} debt={debt} />
      </Modal>
    </>
  );
};

export default PrivePage;