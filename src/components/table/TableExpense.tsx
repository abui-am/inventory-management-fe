// import Link from 'next/link';
import React, { useState } from 'react';
import { Search } from 'react-bootstrap-icons';

import Table from '@/components/Table';
import { EXPENSES_SORT_BY_OPTIONS, LEDGER_TOP_UPS_SORT_BY_OPTIONS, SORT_TYPE_OPTIONS } from '@/constants/options';
import { useFetchExpense } from '@/hooks/query/useFetchExpense';
import { Option } from '@/typings/common';
import { formatDate, formatToIDR } from '@/utils/format';

import { Button } from '../Button';
// import { Button } from '../Button';
import { SelectSortBy, SelectSortType, TextField } from '../Form';
import CreateExpense from '../form/CreateExpense';
import Modal from '../Modal';
import Pagination from '../Pagination';

const getPaymentMethod = (paymentMethod: string): string => {
  if (paymentMethod === 'cash') return 'Kas';
  if (paymentMethod === 'current_account') return 'Giro';
  if (paymentMethod === 'bank') return 'Bank';
  if (paymentMethod === 'personal_money') return 'Uang Pribadi';

  return '-';
};
const TableExpense: React.FC = () => {
  const [paginationUrl, setPaginationUrl] = React.useState('');
  const [sortBy, setSortBy] = useState<Option<string[]> | null>(EXPENSES_SORT_BY_OPTIONS[0]);
  const [sortType, setSortType] = useState<Option | null>(SORT_TYPE_OPTIONS[1]);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [openModalTopUp, setOpenModalTopUp] = useState(false);
  const params = sortBy?.data?.reduce((previousValue, currentValue) => {
    return { ...previousValue, [currentValue]: sortType?.value };
  }, {});

  const { data: dataItems } = useFetchExpense({
    forceUrl: paginationUrl,
    order_by: params,
    search,
    per_page: pageSize,
  });

  const {
    data: dataRes = [],
    from,
    to,
    total,
    links,
    next_page_url,
    last_page_url,
    prev_page_url,
  } = dataItems?.data?.expenses ?? {};
  const data = dataRes.map(({ amount, date, description, name, payment_method }) => ({
    name,
    description,
    amount: formatToIDR(+amount),
    paymentMethod: getPaymentMethod(payment_method),
    date: formatDate(date, { withHour: true }),
    // action: formatToIDR(items.reduce((prev, next) => prev + next.pivot.total_price, 0)),
  }));

  const columns = React.useMemo(
    () => [
      {
        Header: 'Nama',
        accessor: 'name',
      },
      {
        Header: 'Deskripsi',
        accessor: 'description', // accessor is the "key" in the data
      },
      {
        Header: 'Jumlah',
        accessor: 'amount',
      },

      {
        Header: 'Metode Pembayaran',
        accessor: 'paymentMethod',
      },
      {
        Header: 'Tanggal',
        accessor: 'date',
      },
    ],
    []
  );

  return (
    <>
      <Modal
        onRequestClose={() => {
          setOpenModalTopUp(false);
        }}
        isOpen={openModalTopUp}
      >
        <CreateExpense
          onClose={() => {
            setOpenModalTopUp(false);
          }}
          onSave={() => {
            setOpenModalTopUp(false);
          }}
        />
      </Modal>
      <Table
        columns={columns}
        data={data}
        search={() => (
          <div className="mt-2 mb-6 flex justify-between">
            <h2 className="text-2xl font-bold">Riwayat Beban</h2>
            <div className="flex">
              <div className="flex flex-wrap">
                <SelectSortBy
                  value={sortBy}
                  onChange={(val) => {
                    setSortBy(val as Option<string[]>);
                  }}
                  options={LEDGER_TOP_UPS_SORT_BY_OPTIONS}
                />

                <SelectSortType
                  value={sortType}
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
                placeholder="Cari..."
              />

              <Button
                onClick={() => {
                  setOpenModalTopUp(true);
                }}
                className="ml-4"
              >
                Tambah Beban
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
      />
    </>
  );
};

export default TableExpense;
