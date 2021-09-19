/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/require-default-props */
/* eslint-disable react/jsx-key */
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'react-bootstrap-icons';
import { useMediaQuery } from 'react-responsive';
import {
  Row,
  TableInstance,
  TableOptions,
  TableState,
  useGlobalFilter,
  UseGlobalFiltersInstanceProps,
  useResizeColumns,
  useSortBy,
  UseSortByInstanceProps,
  useTable,
} from 'react-table';

type PropsReturn = TableInstance<Record<string, unknown>> &
  UseGlobalFiltersInstanceProps<Record<string, unknown>> &
  UseSortByInstanceProps<Record<string, unknown>>;

type TableProps<T extends Record<string, unknown>> = TableOptions<T> & {
  enableAutoSort?: boolean;
  search?: (arg: {
    state: TableState<Record<string, unknown>>;
    preGlobalFilteredRows: Row<Record<string, unknown>>[];
    setGlobalFilter: (filterValue: unknown) => void;
  }) => JSX.Element;
};

const ResponsiveTable: React.FC<TableProps<Record<string, unknown>>> = (props) => {
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
  } = useTable({ columns, data }, useGlobalFilter, useSortBy, useResizeColumns) as PropsReturn;

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
            <tr {...headerGroup.getHeaderGroupProps()} className="table-themed">
              {headerGroup.headers.map((column: any) => (
                <th
                  {...column.getHeaderProps(
                    enableAutoSort
                      ? {
                          className: clsx('py-6 px-4 text-left', column.collapse ? 'collapse' : ''),
                          ...column.getSortByToggleProps?.(),
                        }
                      : {
                          className: clsx('py-6 px-4 text-left', column.collapse ? 'collapse' : ''),
                        }
                  )}
                >
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
              <tr
                {...row.getRowProps()}
                className={clsx(index % 2 === 0 ? 'bg-blueGray-100' : '', 'rounded-lg', 'table-themed')}
              >
                {row.cells.map((cell) => {
                  return (
                    <td
                      {...cell.getCellProps({
                        className: (cell.column as any).collapse ? 'py-3 px-4 collapse' : 'py-3 px-4',
                      })}
                    >
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
  const { rows, prepareRow, state, setGlobalFilter, preGlobalFilteredRows } = useTable(
    { columns, data },
    useGlobalFilter
  ) as PropsReturn;

  return (
    <div>
      <div className="w-full">{search && search({ state, preGlobalFilteredRows, setGlobalFilter })}</div>
      {rows.map((row) => {
        prepareRow(row);
        return (
          <div className="px-6 py-2 border rounded-md border-gray-300 mb-6">
            {row.cells.map((cell, index) => {
              return (
                <div className="flex my-6">
                  <div className="flex-1 text-blueGray-600">{columns[index].Header}:</div>
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
