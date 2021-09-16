/* eslint-disable react/jsx-key */
import clsx from 'clsx';
import React from 'react';
import { ChevronDown, ChevronUp } from 'react-bootstrap-icons';
import { useMediaQuery } from 'react-responsive';
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
  // eslint-disable-next-line react/require-default-props
  search?: (arg: {
    state: TableState<Record<string, unknown>>;
    preGlobalFilteredRows: Row<Record<string, unknown>>[];
    setGlobalFilter: (filterValue: unknown) => void;
  }) => JSX.Element;
};

const ResponsiveTable: React.FC<TableProps<Record<string, unknown>>> = (props) => {
  const isMd = useMediaQuery({ query: '(min-width: 448px)' });
  return isMd ? <Table {...props} /> : <TableSmall {...props} />;
};

function Table<T extends UseGlobalFiltersInstanceProps<T>>({
  columns,
  data,
  search = () => <div />,
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
      <div className="w-full">{search && search({ state, preGlobalFilteredRows, setGlobalFilter })}</div>
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

const TableSmall: React.FC<TableProps<Record<string, unknown>>> = ({ columns, data, search = () => <div /> }) => {
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

  console.log(rows, headerGroups);
  return (
    <div>
      <div className="w-full">{search && search({ state, preGlobalFilteredRows, setGlobalFilter })}</div>
      {rows.map((row) => {
        prepareRow(row);
        const { headers } = headerGroups[0];

        return (
          <div className="p-6 border rounded-md border-gray-300 mb-6">
            {row.cells.map((cell, index) => {
              return (
                <div className="flex my-3">
                  <div className="flex-1 text-blueGray-600">{headers[index].render('Header')}:</div>
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
