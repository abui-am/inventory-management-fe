// import Link from 'next/link';
import React, { useState } from 'react';
import { Search } from 'react-bootstrap-icons';

import Table from '@/components/Table';
import { LEDGER_TOP_UPS_SORT_BY_OPTIONS, SORT_TYPE_OPTIONS } from '@/constants/options';
import { useFetchLedgerTopUps } from '@/hooks/query/useFetchLedgerTopUp';
import { Option } from '@/typings/common';
import { formatDate, formatToIDR } from '@/utils/format';

import { Button } from '../Button';
// import { Button } from '../Button';
import { SelectSortBy, SelectSortType, TextField } from '../Form';
import CreateTopUp from '../form/CreateTopUpForm';
import Modal from '../Modal';
import Pagination from '../Pagination';

const getPaymentMethod = (paymentMethod: string): string => {
  if (paymentMethod === 'cash') return 'Kas';
  if (paymentMethod === 'current_account') return 'Giro';
  if (paymentMethod === 'bank') return 'Bank';
  if (paymentMethod === 'personal_money') return 'Uang Pribadi';

  return '-';
};
const TableLedgerTopUps: React.FC = () => {
  const [paginationUrl, setPaginationUrl] = React.useState('');
  const [sortBy, setSortBy] = useState<Option<string[]> | null>(LEDGER_TOP_UPS_SORT_BY_OPTIONS[0]);
  const [sortType, setSortType] = useState<Option | null>(SORT_TYPE_OPTIONS[1]);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [openModalTopUp, setOpenModalTopUp] = useState(false);
  const params = sortBy?.data?.reduce((previousValue, currentValue) => {
    return { ...previousValue, [currentValue]: sortType?.value };
  }, {});

  const { data: dataItems } = useFetchLedgerTopUps({
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
  } = dataItems?.data?.ledger_top_ups ?? {};
  const data = dataRes.map(({ ledger_account, amount, updated_at, payment_method }) => ({
    name: ledger_account.name,
    amount: formatToIDR(+amount),
    paymentMethod: getPaymentMethod(payment_method),
    updated_at: formatDate(updated_at, { withHour: true }),
    // action: formatToIDR(items.reduce((prev, next) => prev + next.pivot.total_price, 0)),
  }));

  const columns = React.useMemo(
    () => [
      {
        Header: 'Dari',
        accessor: 'paymentMethod',
      },
      {
        Header: 'Kepada Akun',
        accessor: 'name', // accessor is the "key" in the data
      },
      {
        Header: 'Jumlah Saldo',
        accessor: 'amount',
      },

      {
        Header: 'Tanggal Tansaksi',
        accessor: 'updated_at',
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
        <CreateTopUp
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
            <h2 className="text-2xl font-bold">Riwayat Konversi</h2>
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
                Konversi Saldo
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

export default TableLedgerTopUps;
