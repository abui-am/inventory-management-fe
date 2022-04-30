import Tippy from '@tippyjs/react';
import Link from 'next/link';
import React, { useState } from 'react';
import { Calculator, Check, Eye, Pencil, Search } from 'react-bootstrap-icons';

import Table from '@/components/Table';
import Tag from '@/components/Tag';
import { SORT_TYPE_OPTIONS, STOCK_IN_SORT_BY_OPTIONS } from '@/constants/options';
import { useUpdateStockIn } from '@/hooks/mutation/useMutateStockIn';
import useFetchTransactions from '@/hooks/query/useFetchStockIn';
import { Option } from '@/typings/common';
import { TransactionData } from '@/typings/stock-in';
import { formatDate, formatToIDR } from '@/utils/format';

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
    ({ transaction_code, created_at, supplier, payment_method, pic, items, id, status, ...props }) => ({
      col1: transaction_code,
      col2: formatDate(created_at, { withHour: true }),
      col3: supplier?.name,
      col4: payment_method,
      col5: formatToIDR(items.reduce((prev, next) => prev + next.pivot.total_price, 0)),
      col6: `${pic.employee.first_name} ${pic.employee.last_name}`,
      col7: (
        <div>
          <Tag variant={status === 'accepted' ? 'primary' : 'secondary'}>{getTagValue(status)}</Tag>
        </div>
      ),
      col8: (
        <Action {...{ transaction_code, created_at, supplier, payment_method, pic, items, id, status, ...props }} />
      ),
    })
  );

  const columns = React.useMemo(
    () => [
      {
        Header: 'Kode Transaksi',
        accessor: 'col1', // accessor is the "key" in the data
      },
      {
        Header: 'Tanggal',
        accessor: 'col2',
      },
      {
        Header: 'Supplier',
        accessor: 'col3',
      },
      {
        Header: 'Metode Pembayaran',
        accessor: 'col4',
      },
      {
        Header: 'Kasir',
        accessor: 'col6',
      },

      {
        Header: 'Status',
        accessor: 'col7',
      },
      {
        Header: 'Pembayaran',
        accessor: 'col5',
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
        accessor: 'col8',
        width: '150px',
      },
    ],
    []
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
                    <a>
                      <Button className="ml-3" Icon={<Calculator className="w-4" />}>
                        Tambah
                      </Button>
                    </a>
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
