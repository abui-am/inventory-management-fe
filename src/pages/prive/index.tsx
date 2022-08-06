import dayjs from 'dayjs';
import { NextPage } from 'next';
import React, { useState } from 'react';
import { PlusLg } from 'react-bootstrap-icons';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { DateRangePicker, SelectSortBy, SelectSortType } from '@/components/Form';
import CreatePrive from '@/components/form/CreatePrive';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
// import Pagination from '@/components/Pagination';
import Table from '@/components/Table';
import { PRIVES_SORT_BY_OPTIONS, SORT_TYPE_OPTIONS } from '@/constants/options';
import { useFetchPrives } from '@/hooks/query/useFetchPrives';
import { Option } from '@/typings/common';
import { formatDate, formatDateYYYYMMDDHHmmss, formatToIDR } from '@/utils/format';

const PrivePage: NextPage<unknown> = () => {
  const [paginationUrl, setPaginationUrl] = React.useState('');
  const [sortBy, setSortBy] = useState<Option<string[]> | null>(PRIVES_SORT_BY_OPTIONS[0]);
  const [sortType, setSortType] = useState<Option | null>(SORT_TYPE_OPTIONS[1]);
  const [pageSize, setPageSize] = useState(10);

  const [fromDate, setFromDate] = useState(dayjs().subtract(1, 'year').toDate());
  const [toDate, setToDate] = useState(new Date());
  const params = sortBy?.data?.reduce((previousValue, currentValue) => {
    return { ...previousValue, [currentValue]: sortType?.value };
  }, {});

  const { data: dataPrives } = useFetchPrives({
    order_by: params,
    forceUrl: paginationUrl,
    per_page: pageSize,
    where_greater_equal: {
      created_at: formatDateYYYYMMDDHHmmss(dayjs(fromDate).startOf('day')) ?? '',
    },
    where_lower_equal: {
      created_at: formatDateYYYYMMDDHHmmss(dayjs(toDate).endOf('day')) ?? '',
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
  } = dataPrives?.data?.prives ?? {};
  const data = dataRes.map(({ prive_date, description, amount, transaction_method }) => ({
    date: formatDate(prive_date),
    description,
    transactionMethod: transaction_method,
    amount: formatToIDR(+amount),
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
        Header: 'Metode Transaksi',
        accessor: 'transactionMethod',
      },
      {
        Header: 'Jumlah penarikan',
        accessor: 'amount',
        style: {
          textAlign: 'right',
          display: 'block',
        },
        bodyStyle: {
          textAlign: 'right',
        },
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
                  options={PRIVES_SORT_BY_OPTIONS}
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
        <CreatePrive onClose={handleClose} onSave={handleClose} />
      </Modal>
    </>
  );
};

export default PrivePage;
