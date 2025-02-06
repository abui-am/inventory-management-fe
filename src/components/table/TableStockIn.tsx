import Tippy from '@tippyjs/react';
import Link from 'next/link';
import React, { useState } from 'react';
import { Calculator, Check, Eye, Pencil, Search } from 'react-bootstrap-icons';

import Table from '@/components/Table';
import Tag from '@/components/Tag';
import { SORT_TYPE_OPTIONS, STOCK_IN_SORT_BY_OPTIONS } from '@/constants/options';
import { useUpdateStockIn } from '@/hooks/mutation/useMutateStockIn';
import { useFetchMyself } from '@/hooks/query/useFetchEmployee';
import useFetchTransactions from '@/hooks/query/useFetchStockIn';
import useWindowSize, { XL } from '@/hooks/useWindowSize';
import { Option } from '@/typings/common';
import { TransactionData } from '@/typings/stock-in';
import { formatDate, formatPaymentMethod, formatToIDR } from '@/utils/format';

import { Button, ButtonCancelTransaction } from '../Button';
import { SelectSortBy, SelectSortType, TextField } from '../Form';
import Pagination from '../Pagination';
import { DetailStockIn, getTagValue, SellPriceAdjustment } from './TableComponent';

const TableStockIn: React.FC<{ variant: 'pending' | 'all' | 'on-review'; withCreateButton?: boolean }> = ({
  variant = 'all',
  withCreateButton,
}) => {
  const [paginationUrl, setPaginationUrl] = React.useState('');
  const { mutateAsync: updateStockIn } = useUpdateStockIn();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<Option<string[]> | null>(STOCK_IN_SORT_BY_OPTIONS[0]);
  const [sortType, setSortType] = useState<Option | null>(SORT_TYPE_OPTIONS[1]);
  const [pageSize, setPageSize] = useState(10);
  const [transactionId, setTransactionid] = useState('');
  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const params = sortBy?.data?.reduce((previousValue, currentValue) => {
    return { ...previousValue, [currentValue]: sortType?.value };
  }, {});

  const windowSize = useWindowSize();

  const isXl = windowSize >= XL;

  const Action = (transaction: TransactionData) => {
    switch (variant) {
      case 'all':
        return (
          <div className="flex">
            <Tippy content="Lihat detail barang masuk">
              <div>
                <Button size="small" onClick={() => setTransaction(transaction)}>
                  <Eye width={24} height={24} />
                </Button>
              </div>
            </Tippy>
          </div>
        );
      case 'pending':
        return (
          <div className="flex">
            <Tippy content="Lihat detail barang masuk">
              <div className="mr-2">
                <Button size="small" onClick={() => setTransaction(transaction)}>
                  <Eye width={24} height={24} />
                </Button>
              </div>
            </Tippy>
            <Tippy content="Konfirmasi barang masuk">
              <Button
                size="small"
                className="mr-2"
                onClick={() =>
                  updateStockIn({
                    transactionId: transaction.id,
                    data: {
                      status: 'on-review',
                    },
                  })
                }
              >
                <Check width={24} height={24} />
              </Button>
            </Tippy>
            <ButtonCancelTransaction transactionId={transaction.id} />
          </div>
        );
      case 'on-review':
        return (
          <div className="flex">
            <Tippy content="Lihat detail barang masuk">
              <div className="mr-2">
                <Button size="small" onClick={() => setTransaction(transaction)}>
                  <Eye width={24} height={24} />
                </Button>
              </div>
            </Tippy>

            <Tippy content="Tentukan harga jual barang">
              <div className="mr-2">
                <Button size="small" onClick={() => setTransactionid(transaction.id)}>
                  <Calculator width={24} height={24} />
                </Button>
              </div>
            </Tippy>
            <ButtonCancelTransaction transactionId={transaction.id} />
          </div>
        );
      default:
        return (
          <div className="flex">
            <Button size="small" variant="secondary" className="mr-2">
              <Pencil width={24} height={24} />
            </Button>
            <Button size="small" onClick={() => setTransaction(transaction)}>
              <Eye width={24} height={24} />
            </Button>
          </div>
        );
    }
  };
  const queryVariant =
    variant !== 'all'
      ? {
          where: {
            status: variant === 'pending' ? 'pending' : 'on-review',
          },
        }
      : {};
  const { data: dataTrasaction } = useFetchTransactions({
    order_by: params,
    forceUrl: paginationUrl,
    search,
    per_page: pageSize,
    ...queryVariant,
  });
  const { data: dataMyself } = useFetchMyself();

  const isAdmin = dataMyself?.data.user.roles.map((role) => role.id).includes(1);

  const {
    data: dataRes = [],
    from,
    to,
    total,
    links,
    next_page_url,
    prev_page_url,
    last_page_url,
  } = dataTrasaction?.data?.transactions ?? {};
  const data = dataRes.map(
    ({ transaction_code, created_at, supplier, payment_method, pic, items, id, status, payments, ...props }) => ({
      col1: transaction_code,
      col2: formatDate(created_at, { withHour: true }),
      detail: (
        <div>
          <label className="block">Supplier:</label>
          <span className="text-base font-bold block mb-2">{supplier?.name}</span>
          <label className="block">Pembayaran (metode):</label>
          {payments?.map((payment) => (
            <span className="text-base font-bold block mb-2" key={payment.payment_method + payment.payment_price}>
              {formatToIDR(payment.payment_price)} ({formatPaymentMethod(payment.payment_method)})
            </span>
          ))}
          {!isXl && (
            <div className="mt-2">
              <label className="block">Tanggal:</label>
              <span className="text-base font-bold block mb-2">{formatDate(created_at, { withHour: true })}</span>
              <label className="block">Kasir:</label>
              <span className="text-base font-bold block mb-2">{`${pic.employee.first_name} ${pic.employee.last_name}`}</span>
              <label className="block">Status:</label>
              <Tag variant={status === 'accepted' ? 'primary' : 'secondary'}>{getTagValue(status)}</Tag>
            </div>
          )}
        </div>
      ),
      col6: isAdmin ? (
        <div>
          <a
            href={`/employee/${pic.id}`}
            className="block font-bold hover:text-blue-600"
          >{`${pic.employee.first_name} ${pic.employee.last_name}`}</a>
        </div>
      ) : (
        <div>
          <span className="block">{`${pic?.employee?.first_name} ${pic?.employee?.last_name}`}</span>
        </div>
      ),

      col7: (
        <div>
          <Tag variant={status === 'accepted' ? 'primary' : 'secondary'}>{getTagValue(status)}</Tag>
        </div>
      ),
      col8: (
        <Action
          {...{ transaction_code, payments, created_at, supplier, payment_method, pic, items, id, status, ...props }}
        />
      ),
    })
  );

  const columns = React.useMemo(
    () => [
      {
        Header: 'Kode Transaksi',
        accessor: 'col1', // accessor is the "key" in the data
      },
      ...(isXl
        ? [
            {
              Header: 'Tanggal',
              accessor: 'col2',
            },
          ]
        : []),
      {
        Header: 'Detail Barang Masuk',
        accessor: 'detail',
        width: '40%',
      },
      ...(isXl
        ? [
            { Header: 'Kasir', accessor: 'col6' },
            {
              Header: 'Status',
              accessor: 'col7',
              width: '150px',
            },
          ]
        : []),
      {
        Header: 'Aksi',
        accessor: 'col8',
        width: variant === 'all' ? '100px' : '180px',
      },
    ],
    [isXl, variant]
  );

  return (
    <>
      <SellPriceAdjustment
        transactionId={transactionId}
        onClose={() => {
          setTransactionid('');
        }}
      />
      <DetailStockIn
        transactions={transaction}
        onClose={() => {
          setTransaction(null);
        }}
      />

      <Table
        columns={columns}
        data={data}
        search={() => (
          <div className="mt-2 mb-4 flex justify-between">
            <h2 className="text-2xl font-bold">
              {variant === 'pending' ? 'Konfirmasi Barang Masuk' : 'Riwayat Barang Masuk'}
            </h2>

            <div className="flex flex-col items-end">
              <div className="flex mb-4">
                <TextField
                  Icon={<Search />}
                  value={search}
                  onChange={(e) => {
                    setPaginationUrl('');
                    setSearch(e.target.value);
                  }}
                  variant="contained"
                  placeholder="Cari nama barang"
                />
                {withCreateButton && (
                  <Link href="/stock-in/add">
                    <Button className="ml-3" Icon={<Calculator className="w-4" />}>
                      Tambah
                    </Button>
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap justify-end -mr-4 -mb-4">
                <SelectSortBy
                  value={sortBy}
                  onChange={(val) => {
                    setSortBy(val as Option<string[]>);
                  }}
                  options={STOCK_IN_SORT_BY_OPTIONS}
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
        onChangePerPage={(val) => {
          setPaginationUrl('');
          setPageSize(val?.value ?? 0);
        }}
        onClickGoToPage={(val) => {
          setPaginationUrl(`${(last_page_url as string).split('?')[0]}?page=${val}`);
        }}
      />
    </>
  );
};

export default TableStockIn;
