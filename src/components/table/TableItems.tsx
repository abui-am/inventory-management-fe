// import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { Calculator, Search } from 'react-bootstrap-icons';

import Table from '@/components/Table';
import { ITEMS_SORT_BY_OPTIONS, SORT_TYPE_OPTIONS } from '@/constants/options';
import { useFetchMyself } from '@/hooks/query/useFetchEmployee';
import { useFetchItems } from '@/hooks/query/useFetchItem';
import { Option } from '@/typings/common';
import { formatDate } from '@/utils/format';
import formatCurrency from '@/utils/formatCurrency';

import { Button } from '../Button';
// import { Button } from '../Button';
import { SelectSortBy, SelectSortType, TextField } from '../Form';
import Pagination from '../Pagination';
import { SellPriceAdjustmentItem } from './TableComponent';
const TableItems: React.FC = () => {
  const [paginationUrl, setPaginationUrl] = React.useState('');
  const [itemId, setItemId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<Option<string[]> | null>(ITEMS_SORT_BY_OPTIONS[0]);
  const [sortType, setSortType] = useState<Option | null>(SORT_TYPE_OPTIONS[0]);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const params = sortBy?.data?.reduce((previousValue, currentValue) => {
    return { ...previousValue, [currentValue]: sortType?.value };
  }, {});

  const { data: dataItems } = useFetchItems({
    forceUrl: paginationUrl,
    order_by: params,
    search,
    per_page: pageSize,
  });
  const { data: dataSelf } = useFetchMyself();
  const isSuperAdmin = useMemo(() => {
    return dataSelf?.data.user.roles.map(({ name }) => name).includes('superadmin');
  }, [dataSelf]);

  const {
    data: dataRes = [],
    from,
    to,
    total,
    links,
    next_page_url,
    last_page_url,
    prev_page_url,
  } = dataItems?.data?.items ?? {};
  const data = dataRes.map(({ id, name, quantity, unit, item_id, updated_at, sell_price, buy_price }) => ({
    name,
    quantity,
    item_id: item_id ?? '-',
    sell_price: sell_price ? formatCurrency({ value: sell_price }) : formatCurrency({ value: 0 }),
    hpp: buy_price ? formatCurrency({ value: buy_price }) : '-',
    unit,
    updated_at: formatDate(updated_at, { withHour: true }),
    ...(isSuperAdmin
      ? [
          {
            action: (
              <Button
                size="small"
                onClick={() => {
                  setItemId(id);
                }}
              >
                <Calculator width={24} height={24} />
              </Button>
            ),
          },
        ]
      : []),
  }));

  const columns = React.useMemo(
    () => [
      {
        Header: 'Nama',
        accessor: 'name', // accessor is the "key" in the data
      },
      {
        Header: 'Jumlah Stock',
        accessor: 'quantity',
      },
      {
        Header: 'Kemasan',
        accessor: 'unit',
      },
      {
        Header: 'HPP',
        accessor: 'hpp',
      },
      {
        Header: 'Item Id',
        accessor: 'item_id',
      },
      {
        Header: 'Harga Jual',
        accessor: 'sell_price',
      },
      {
        Header: 'Tanggal masuk terakhir',
        accessor: 'updated_at',
      },
      ...(isSuperAdmin
        ? [
            {
              Header: 'Aksi',
              accessor: 'action',
            },
          ]
        : []),
    ],
    [isSuperAdmin]
  );

  return (
    <>
      <SellPriceAdjustmentItem
        itemId={itemId ?? ''}
        onClose={() => {
          setItemId(null);
        }}
      />
      <Table
        columns={columns}
        data={data}
        search={() => (
          <div className="mt-2 mb-6 flex justify-between">
            <h2 className="text-2xl font-bold">Daftar Barang</h2>
            <div className="flex">
              <div className="flex flex-wrap">
                <SelectSortBy
                  value={sortBy}
                  onChange={(val) => {
                    setSortBy(val as Option<string[]>);
                  }}
                  options={ITEMS_SORT_BY_OPTIONS}
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

export default TableItems;
