import Tippy from '@tippyjs/react';
import Link from 'next/link';
import React, { useState } from 'react';
import { Calculator, Check, Pencil, Search, X } from 'react-bootstrap-icons';

import Table from '@/components/Table';
import Tag from '@/components/Tag';
import { SORT_TYPE_OPTIONS, STOCK_IN_SORT_BY_OPTIONS } from '@/constants/options';
import { useUpdateStockIn } from '@/hooks/mutation/useMutateStockIn';
import useFetchTransactions from '@/hooks/query/useFetchStockIn';
import { Option } from '@/typings/common';
import { TransactionData } from '@/typings/stock-in';
import { formatDate, formatToIDR } from '@/utils/format';

import { Button } from '../Button';
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
  const params = sortBy?.data?.reduce((previousValue, currentValue) => {
    return { ...previousValue, [currentValue]: sortType?.value };
  }, {});

  const getAction = (transaction: TransactionData) => {
    switch (variant) {
      case 'all':
        return (
          <div className="flex">
            <Tippy content="Lihat detail barang masuk">
              <DetailStockIn transactions={transaction} />
            </Tippy>
          </div>
        );
      case 'pending':
        return (
          <div className="flex">
            <Tippy content="Lihat detail barang masuk">
              <DetailStockIn transactions={transaction} />
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
            <Tippy content="Batalkan barang masuk">
              <Button size="small" variant="outlined" className="ml-2">
                <X
                  onClick={() => {
                    updateStockIn({
                      transactionId: transaction.id,
                      data: {
                        status: 'declined',
                      },
                    });
                  }}
                  width={24}
                  height={24}
                />
              </Button>
            </Tippy>
          </div>
        );
      case 'on-review':
        return (
          <div className="flex">
            <Tippy content="Lihat detail barang masuk">
              <div>
                <DetailStockIn transactions={transaction} />
              </div>
            </Tippy>
            <div className="ml-2">
              <Tippy content="Tentukan harga jual barang">
                <div>
                  <SellPriceAdjustment transactionId={transaction.id} />
                </div>
              </Tippy>
            </div>
            <Tippy content="Batalkan barang masuk">
              <Button size="small" variant="outlined" className="ml-2">
                <X
                  onClick={() => {
                    updateStockIn({
                      transactionId: transaction.id,
                      data: {
                        status: 'declined',
                      },
                    });
                  }}
                  width={24}
                  height={24}
                />
              </Button>
            </Tippy>
          </div>
        );
      default:
        return (
          <div className="flex">
            <Button size="small" variant="secondary" className="mr-2">
              <Pencil width={24} height={24} />
            </Button>
            <DetailStockIn transactions={transaction} />
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
  } = dataTrasaction?.data.transactions ?? {};
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
      col8: getAction({ transaction_code, created_at, supplier, payment_method, pic, items, id, status, ...props }),
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
        Header: 'Pembayaran',
        accessor: 'col5',
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
        Header: 'Aksi',
        accessor: 'col8',
      },
    ],
    []
  );

  return (
    <>
      <Table
        columns={columns}
        data={data}
        search={() => (
          <div className="mt-2 mb-6 flex justify-between">
            <h2 className="text-2xl font-bold">
              {variant === 'pending' ? 'Konfirmasi Barang Masuk' : 'Riwayat Barang Masuk'}
            </h2>

            {withCreateButton && (
              <>
                <div className="flex">
                  <div className="flex flex-wrap">
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
                  <Link href="/stock-in/add">
                    <a>
                      <Button className="ml-3" Icon={<Calculator className="w-4" />}>
                        Tambah
                      </Button>
                    </a>
                  </Link>
                </div>
              </>
            )}
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
