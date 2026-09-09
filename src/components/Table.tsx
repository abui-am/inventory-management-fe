/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/require-default-props */
/* eslint-disable react/jsx-key */
import clsx from 'clsx';
import React, { PropsWithChildren, ReactNode, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'react-bootstrap-icons';
import { useMediaQuery } from 'react-responsive';
import {
  Row,
  TableInstance,
  TableOptions,
  TableState,
  useGlobalFilter,
  UseGlobalFiltersInstanceProps,
  usePagination,
  UsePaginationInstanceProps,
  useResizeColumns,
  useSortBy,
  UseSortByInstanceProps,
  useTable,
  UseTableInstanceProps,
} from 'react-table';

import Pagination from './Pagination';

type PropsReturn = TableInstance<any> &
  UseTableInstanceProps<any> &
  UseGlobalFiltersInstanceProps<Record<string, unknown>> &
  UseSortByInstanceProps<any> &
  UsePaginationInstanceProps<any>;

type TableProps<T extends Record<string, unknown>> = TableOptions<T> & {
  enableAutoSort?: boolean;
  search?: (arg: {
    state: TableState<Record<string, unknown>>;
    preGlobalFilteredRows: Row<Record<string, unknown>>[];
    setGlobalFilter: (filterValue: unknown) => void;
  }) => JSX.Element;
  filter?: () => JSX.Element;
};

// Header tabel: 24px padding vertikal yang lama membuat satu baris judul setinggi tiga
// baris data. Uppercase kecil memisahkan header dari isi tanpa perlu garis tambahan.
const HEADER_CELL =
  'px-3 py-2.5 text-left text-xs font-bold uppercase tracking-[0.07em] text-foreground-subtle break-words';

const ResponsiveTable: React.FC<
  PropsWithChildren<TableProps<Record<string, unknown>> & { withPagination?: boolean; withoutStripe?: boolean }>
> = (props) => {
  const [isMd, setIsMd] = useState(false);

  const query = useMediaQuery({ query: '(min-width: 768px)' });
  useEffect(() => {
    setIsMd(query);
  }, [query]);

  if (!isMd) return <TableSmall {...props} />;
  return <Table {...props} />;
};

function Table<T extends UseGlobalFiltersInstanceProps<T>>({
  columns,
  data,
  search = () => <div />,
  enableAutoSort = false,
  withPagination = false,
  filter = () => <div />,
  withoutStripe,
}: TableProps<Record<string, unknown>> & { withPagination?: boolean; withoutStripe?: boolean }): JSX.Element {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    state,
    preGlobalFilteredRows,
    setGlobalFilter,
    setPageSize,

    // Test
    gotoPage,
    nextPage,
    previousPage,
  } = useTable(
    {
      columns,
      data,
    },
    useGlobalFilter,
    useSortBy,
    useResizeColumns,
    usePagination
  ) as PropsReturn;

  const renderHead = (column: { isSorted?: boolean; isSortedDesc?: boolean }) => {
    if (column.isSortedDesc) return <ChevronUp style={{ marginLeft: 8 }} />;
    if (column.isSorted) return <ChevronDown style={{ marginLeft: 8 }} />;
    return '';
  };

  useEffect(() => {
    setPageSize(data?.length || 10);
  }, [data, setPageSize]);

  return (
    <>
      <div className="w-full mb-4">
        {search && search({ state, preGlobalFilteredRows, setGlobalFilter })}
        {filter && filter()}
      </div>
      <table {...getTableProps()} className="table-fixed w-full w-sm">
        <thead className="border-b border-border bg-surface-raised">
          {headerGroups.map((headerGroup, i) => {
            // react-table v7 menaruh `key` di dalam objek props. Sejak React 18, key yang
            // ikut ter-spread memicu warning — key harus diteruskan langsung ke JSX.
            const { key: headerGroupKey, ...headerGroupProps } = headerGroup.getHeaderGroupProps();
            return (
              <tr {...headerGroupProps} key={headerGroupKey} className="table-themed break-words">
                {headerGroup.headers.map((column: any) => {
                  const { key: thKey, ...thProps } = column.getHeaderProps(
                    enableAutoSort
                      ? {
                          className: clsx(HEADER_CELL, column.collapse ? 'collapse' : ''),
                          ...column.getSortByToggleProps?.(),
                        }
                      : {
                          className: clsx(HEADER_CELL, column.collapse ? 'collapse' : ''),
                        }
                  );
                  return (
                    <th
                      {...thProps}
                      key={thKey}
                      style={{
                        width: column.width,
                        wordBreak: 'break-word',
                      }}
                    >
                      <span
                        className={clsx('flex', (columns?.[i] as any)?.flexEnd ? 'justify-end' : '', column.className)}
                        style={column.style}
                      >
                        {column.render('Header')}
                        <span>{renderHead(column)}</span>
                      </span>
                    </th>
                  );
                })}
              </tr>
            );
          })}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row, index) => {
            prepareRow(row);
            const { key: rowKey, ...rowProps } = row.getRowProps();
            return (
              <tr
                {...rowProps}
                key={rowKey}
                className={clsx(
                  !withoutStripe && index % 2 === 0 ? 'bg-surface-raised' : '',
                  'rounded-lg',
                  'table-themed',
                  'break-words',
                  withoutStripe && 'border-b border-border-subtle'
                )}
              >
                {row.cells.map((cell) => {
                  // Sebelumnya `key: Math.random()`: key baru tiap render memaksa React
                  // melepas dan memasang ulang setiap sel, bukan memperbaruinya.
                  const { key: cellKey, ...cellProps } = cell.getCellProps({
                    className: (cell.column as any).collapse ? 'px-3 py-2.5 collapse' : 'px-3 py-2.5',
                    style: (cell.column as any).bodyStyle,
                  });
                  return (
                    <td {...cellProps} key={cellKey}>
                      {cell.render('Cell')}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {withPagination && (
        <Pagination
          onClickGoToPage={(e) => {
            gotoPage(e - 1);
          }}
          onChangePerPage={(val) => {
            setPageSize(val?.value ?? 0);
          }}
          stats={{
            from: `${(state as any).pageIndex * (state as any).pageSize + 1}`,
            to: `${(state as any).pageIndex * (state as any).pageSize + page.length}`,
            total: `${data.length}`,
          }}
          onClickPageButton={(num) => {
            gotoPage(+num);
          }}
          links={[]}
          onClickNext={() => {
            nextPage();
            //   setPaginationUrl(next_page_url ?? '');
          }}
          onClickPrevious={() => {
            previousPage();
            //   setPaginationUrl(prev_page_url ?? '');
          }}
        />
      )}
    </>
  );
}

const TableSmall: React.FC<PropsWithChildren<TableProps<Record<string, unknown>>>> = ({
  columns,
  data,
  search = () => <div />,
  filter,
}) => {
  const { rows, prepareRow, state, setGlobalFilter, preGlobalFilteredRows } = useTable(
    { columns, data },
    useGlobalFilter
  ) as PropsReturn;

  return (
    <div>
      <div className="w-full mb-4">
        {search && search({ state, preGlobalFilteredRows, setGlobalFilter })}
        {filter && filter()}
      </div>
      {rows.map((row) => {
        prepareRow(row);
        return (
          <div className="mb-3 rounded-lg border border-border bg-surface px-4 py-2" key={row.id}>
            {row.cells.map((cell, index) => {
              return (
                <div className="my-3 flex gap-3" key={columns[index].id ?? index}>
                  {/* react-table v7 mengetik `Header` jauh lebih longgar daripada ReactNode;
                      di React 18 tipe ReactNode tidak lagi memuat `{}`, jadi dipersempit di sini. */}
                  <div className="flex-1 text-foreground-muted">{columns[index].Header as ReactNode}:</div>
                  <div className="flex-1">{cell.render('Cell')}</div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default ResponsiveTable;
