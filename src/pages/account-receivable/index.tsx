import Tippy from '@tippyjs/react';
import dayjs from 'dayjs';
import { NextPage } from 'next';
import React, { useState } from 'react';
import { CashCoin, Search } from 'react-bootstrap-icons';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { DateRangePicker, SelectSortBy, SelectSortType, TextField } from '@/components/Form';
import PayDebtForm from '@/components/form/PayDebt';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import Table from '@/components/Table';
import { DEBT_SORT_BY_OPTIONS, SORT_TYPE_OPTIONS } from '@/constants/options';
import { useFetchDebt } from '@/hooks/query/useFetchDebt';
import useWindowSize, { LG } from '@/hooks/useWindowSize';
import { Option } from '@/typings/common';
import { Datum } from '@/typings/debts';
import { useDebounceValue } from '@/utils/debounce';
import { formatDate, formatDateYYYYMMDDHHmmss, formatToIDR } from '@/utils/format';

const AccountReceivable: NextPage<unknown> = () => {
  const [paginationUrl, setPaginationUrl] = React.useState('');
  const [sortBy, setSortBy] = useState<Option<string[]> | null>(DEBT_SORT_BY_OPTIONS[0]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounceValue(search, 500);
  const [sortType, setSortType] = useState<Option | null>(SORT_TYPE_OPTIONS[1]);
  const [pageSize, setPageSize] = useState(10);
  const params = sortBy?.data?.reduce((previousValue, currentValue) => {
    return { ...previousValue, [currentValue]: sortType?.value };
  }, {});
  const windowSize = useWindowSize();
  const isLg = windowSize >= LG;

  const [toDate, setToDate] = useState(new Date());
  const [fromDate, setFromDate] = useState(dayjs().subtract(1, 'year').toDate());

  const { data: dataPrepaidSalary } = useFetchDebt({
    per_page: pageSize,
    order_by: params,
    paginated: true,
    search: debouncedSearch,
    forceUrl: paginationUrl || undefined,
    where: {
      type: 'receivable',
    },
    where_greater_equal: {
      created_at: formatDateYYYYMMDDHHmmss(dayjs(fromDate).startOf('day')),
    },
    where_lower_equal: {
      created_at: formatDateYYYYMMDDHHmmss(dayjs(toDate).endOf('day')),
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
  const data = dataRes.map(({ created_at, description, is_paid, paid_amount, amount, related_model, ...props }) => ({
    date: formatDate(created_at, { withHour: true }),
    description,
    status: <div className={is_paid ? 'text-blue-600 font-bold' : ''}>{is_paid ? 'lunas' : 'belum lunas'}</div>,
    paid: formatToIDR(+paid_amount),
    debtAmount: formatToIDR(+amount),
    sisapiutang: formatToIDR(+amount - +paid_amount),
    relatedModel: related_model.name,
    detail: (
      <div className="mt-2">
        <label className="block">Status:</label>
        <div className="text-base font-bold block mb-2">
          <div className={is_paid ? 'text-blue-600 font-bold' : ''}>{is_paid ? 'lunas' : 'belum lunas'}</div>
        </div>
        <label className="block">Keterangan:</label>
        <div className="text-base font-bold block mb-2">{description}</div>
        <label className="block">Atas Nama:</label>
        <div className="text-base font-bold block mb-2">{related_model.name}</div>
        <label className="block">Jatuh Tempo:</label>
        <div className="text-base font-bold block mb-2">{formatDate(props.due_date, { withHour: true })}</div>
      </div>
    ),
    action:
      +amount - +paid_amount > 0 ? (
        <PayDebt
          debt={{
            related_model,
            created_at,
            description,
            is_paid,
            paid_amount,
            amount,
            ...props,
          }}
        />
      ) : null,
  }));
  const columns = React.useMemo(
    () => [
      {
        Header: 'Tanggal',
        accessor: 'date', // accessor is the "key" in the data
      },
      ...(isLg
        ? [
            {
              Header: 'Keterangan',
              accessor: 'description',
            },
            {
              Header: 'Atas Nama',
              accessor: 'relatedModel',
            },
            {
              Header: 'Status',
              accessor: 'status',
            },
            {
              Header: 'Jatuh Tempo',
              accessor: 'dueDate',
              style: {
                textAlign: 'right',
                display: 'block',
              },
              bodyStyle: {
                textAlign: 'right',
              },
            },
          ]
        : [
            {
              Header: 'Detail',
              accessor: 'detail',
            },
          ]),
      {
        Header: 'Jumlah Piutang',
        accessor: 'debtAmount',
        style: {
          textAlign: 'right',
          display: 'block',
        },
        bodyStyle: {
          textAlign: 'right',
        },
      },
      {
        Header: 'Dibayarkan',
        accessor: 'paid',
        style: {
          textAlign: 'right',
          display: 'block',
        },
        bodyStyle: {
          textAlign: 'right',
        },
      },
      {
        Header: 'Sisa Piutang',
        accessor: 'sisapiutang',
        style: {
          textAlign: 'right',
          display: 'block',
        },
        bodyStyle: {
          textAlign: 'right',
        },
      },
      {
        Header: 'Aksi',
        accessor: 'action',
        width: '100px',
      },
    ],
    [isLg]
  );
  return (
    <CardDashboard>
      <Table
        columns={columns}
        data={data}
        search={() => (
          <div className="mt-2 mb-4 flex justify-between sm:flex-row flex-col">
            <h2 className="text-2xl font-bold mb-4">Daftar Piutang Perusahaan</h2>
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
                <div className="mr-4 mb-4">
                  <TextField
                    Icon={<Search />}
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                    }}
                    variant="contained"
                    placeholder="Cari..."
                  />
                </div>
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
          setPaginationUrl(`${(last_page_url as string)?.split('?')[0]}?page=${val}`);
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
      <Tippy content="Terima Piutang">
        <Button className="ml-3" onClick={handleOpen}>
          <CashCoin />
        </Button>
      </Tippy>

      <Modal isOpen={isOpen} onRequestClose={handleClose}>
        <PayDebtForm type="account-receivable" onSave={handleClose} onClose={handleClose} debt={debt} />
      </Modal>
    </>
  );
};

export default AccountReceivable;
