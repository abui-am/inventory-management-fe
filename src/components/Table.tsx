/* eslint-disable react/jsx-key */
import clsx from 'clsx';
import React from 'react';
import { ChevronDown, ChevronUp } from 'react-bootstrap-icons';
import {
  HeaderGroup,
  Row,
  TableInstance,
  TableOptions,
  TableState,
  useGlobalFilter,
  UseGlobalFiltersInstanceProps,
  useSortBy,
  UseSortByColumnProps,
  useTable,
} from 'react-table';

type PropsColumn<
  T extends Record<string, unknown> = Record<string, unknown>,
  TSort extends Record<string, unknown> = Record<string, unknown>
> = HeaderGroup<T> & Partial<UseSortByColumnProps<TSort>>;
type PropsReturn = TableInstance<Record<string, unknown>> & UseGlobalFiltersInstanceProps<Record<string, unknown>>;

type TableProps<T extends Record<string, unknown>> = TableOptions<T> & {
  search: (arg: {
    state: TableState<Record<string, unknown>>;
    preGlobalFilteredRows: Row<Record<string, unknown>>[];
    setGlobalFilter: (filterValue: unknown) => void;
  }) => JSX.Element;
};

function Table<T extends UseGlobalFiltersInstanceProps<T>>({
  columns,
  data,
  search,
}: TableProps<Record<string, unknown>>): JSX.Element {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state,
    preGlobalFilteredRows,
    setGlobalFilter,
  } = useTable({ columns, data }, useGlobalFilter, useSortBy) as PropsReturn;

  const renderHead = (column: { isSorted?: boolean; isSortedDesc?: boolean }) => {
    if (column.isSortedDesc) return <ChevronUp />;
    if (column.isSorted) return <ChevronDown />;
    return '';
  };

  return (
    <>
      <div className="w-full">{search({ state, preGlobalFilteredRows, setGlobalFilter })}</div>
      <table {...getTableProps()} className="table-fixed w-full w-sm">
        <thead className="border-b border-solid border-blue-600">
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column: PropsColumn) => (
                <th {...column.getHeaderProps(column.getSortByToggleProps?.())} className="py-6 px-4 text-left">
                  <span className="flex">
                    {column.render('Header')}
                    <span style={{ marginLeft: 8 }}>{renderHead(column)}</span>
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, index) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()} className={clsx(index % 2 === 0 ? 'bg-blueGray-100' : '', 'rounded-lg')}>
                {row.cells.map((cell) => {
                  return (
                    <td {...cell.getCellProps()} className="py-3 px-4">
                      {cell.render('Cell')}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

export default Table;
