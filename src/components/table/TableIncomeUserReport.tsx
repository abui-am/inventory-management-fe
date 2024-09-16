// import Link from 'next/link';
import { Column, createColumnHelper, flexRender, getCoreRowModel, Table, useReactTable } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import React, { CSSProperties } from 'react';

import { useFetchIncomeUserReport } from '@/hooks/query/useFetchIncomeUserReport';
import { IncomeUserReport, IncomeUserReportChild } from '@/typings/income-report';
import formatCurrency from '@/utils/formatCurrency';

import Divider from '../Divider';
import { DateRangePicker } from '../Form';
import Tabs from '../Tabs';
const getCommonPinningStyles = (
  column: Column<{
    title: string;
    [key: string]: string;
  }>
): CSSProperties => {
  const isPinned = column.id === 'title' ? 'left' : '';
  return {
    backgroundColor: 'white',
    borderRight: isPinned === 'left' ? '1px solid rgba(37, 99, 235, var(--tw-border-opacity))' : '',
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    opacity: isPinned ? 0.95 : 1,
    position: isPinned ? 'sticky' : 'relative',
    // width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
    width: isPinned ? '200px' : 'auto',
    minWidth: '200px',
  };
};

type ColumnData = {
  title: string;
  [key: string]: string;
};
const TableIncomeUserReport: React.FC = () => {
  const [from, setFrom] = React.useState(dayjs().startOf('day').toDate());
  const [to, setTo] = React.useState(dayjs().endOf('day').toDate());

  const { data: dataIncomeUserReport } = useFetchIncomeUserReport({
    date_end: dayjs(to).format('YYYY-MM-DD HH:mm:ss'),
    date_start: dayjs(from).format('YYYY-MM-DD HH:mm:ss'),
  });

  const router = useRouter();

  const handleChangeTabIndex = (index: number) => {
    router.push({
      pathname: '/income-user-report',
      query: {
        tabIndex: index,
      },
    });
  };

  const activeTabIndex = router.query.tabIndex ? +router.query.tabIndex : 0;

  return (
    <>
      <section className="flex justify-center">
        <div className="max-w-4xl w-full">
          <label className="mb-4 block">
            <span className="text-gray-900 font-bold">Tanggal:</span>
          </label>
          <DateRangePicker
            showTimeSelect
            values={[from, to]}
            onChangeFrom={(date) => {
              setFrom(date);
            }}
            onChangeTo={(date) => {
              setTo(date);
            }}
          />
        </div>
      </section>
      <Divider />
      <div className="mb-4">
        <Tabs
          menus={['Laporan Pendapatan', 'Laporan Pembelian', 'Laporan Beban']}
          activeIndex={activeTabIndex}
          onClickTab={handleChangeTabIndex}
        />
      </div>
      {activeTabIndex === 0 ? (
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-4">Laporan Pendapatan</h2>
          <div className="grid rounded-lg border border-gray-300 p-4">
            {(dataIncomeUserReport?.data?.income_report?.length || 0) > 0 &&
            dataIncomeUserReport?.data?.income_report ? (
              <IncomeUserReportSection incomeUserReport={dataIncomeUserReport.data} />
            ) : (
              <div className="flex justify-center items-center">
                <div className="text-center">
                  <div className="text-blueGray-600 mb-1 block">Tidak ada data</div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {activeTabIndex === 1 ? (
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-4">Laporan Pembelian</h2>
          <div className="grid rounded-lg border border-gray-300 p-4">
            {(dataIncomeUserReport?.data?.income_report?.length || 0) > 0 &&
            dataIncomeUserReport?.data?.income_report ? (
              <StockInUserReportSection stockInUserReport={dataIncomeUserReport.data} />
            ) : (
              <div className="flex justify-center items-center">
                <div className="text-center">
                  <div className="text-blueGray-600 mb-1 block">Tidak ada data</div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
      {activeTabIndex === 2 ? (
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-4">Laporan Beban</h2>
          <div className="grid rounded-lg border border-gray-300 p-4">
            {(dataIncomeUserReport?.data?.income_report?.length || 0) > 0 &&
            dataIncomeUserReport?.data?.income_report ? (
              <ExpenseUserReportSection expenseUserReport={dataIncomeUserReport.data} />
            ) : (
              <div className="flex justify-center items-center">
                <div className="text-center">
                  <div className="text-blueGray-600 mb-1 block">Tidak ada data</div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
};

const IncomeUserReportSection = ({ incomeUserReport: _i }: { incomeUserReport: IncomeUserReport }) => {
  const columnHelper = createColumnHelper<ColumnData>();

  const incomeUserReport = {
    income_report: [..._i.income_report],
  };

  const columns = React.useMemo(
    () => [
      columnHelper.accessor('title', {
        header: () => 'Judul',
        cell: ({ getValue }) => {
          return (
            <div className="flex justify-between w-full mb-2">
              <label className="text-lg">{getValue()}</label>
            </div>
          );
        },
      }),
      // Perkasir
      ...(incomeUserReport
        ? incomeUserReport?.income_report?.map(({ name }) =>
            columnHelper.accessor(name, {
              header: () => name,
              cell: ({ getValue }) => getValue() || '',
              minSize: 200,
            })
          )
        : []),
    ],
    [columnHelper, incomeUserReport]
  );

  const getData = () => {
    const nameToDataMap = new Map(
      incomeUserReport?.income_report?.map(({ name, income, stock_in, expense, balance }) => {
        return [
          name,
          {
            title: name,
            income,
            stock_in,
            expense,
            balance,
          },
        ];
      })
    );

    const keys = Array.from(nameToDataMap.keys());

    const extractData = (dataName: keyof Omit<IncomeUserReportChild['income'], 'payment_methods'>) => {
      return keys?.reduce((acc, key) => {
        const value = nameToDataMap.get(key)?.income?.[dataName];

        return {
          ...acc,
          [key]: value
            ? formatCurrency({
                value,
              })
            : '-',
        };
      }, {}) as {
        [k: string]: string;
      };
    };

    const extractDataPaymentMethods = (dataName: keyof IncomeUserReportChild['income']['payment_methods']) => {
      return keys?.reduce((acc, key) => {
        const value = nameToDataMap.get(key)?.income?.payment_methods?.[dataName];
        return {
          ...acc,
          [key]: value
            ? formatCurrency({
                value,
              })
            : '-',
        };
      }, {}) as {
        [k: string]: string;
      };
    };

    const data: ColumnData[] = [
      {
        title: 'Penjualan',
        ...extractData('sales'),
      },
      {
        title: 'Diskon',
        ...extractData('discount'),
      },
      {
        title: 'Ongkir',
        ...extractData('shipping_cost'),
      },
      {
        title: 'Total',
        ...extractData('total_income'),
      },
      {
        title: 'Metode Pembayaran',
      },
      {
        title: 'Kas',
        ...extractDataPaymentMethods('cash'),
      },
      {
        title: 'Bank',
        ...extractDataPaymentMethods('bank'),
      },
      {
        title: 'Debet',
        ...extractDataPaymentMethods('debt'),
      },
      {
        title: 'Giro',
        ...extractDataPaymentMethods('current_account'),
      },
    ];

    return data;
  };

  const data = getData();
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    debugTable: true,
    debugHeaders: true,
    debugColumns: true,
    columnResizeMode: 'onChange',
  });
  return <CustomTable table={table} />;
  // return <div />;
};

const StockInUserReportSection = ({ stockInUserReport }: { stockInUserReport: IncomeUserReport }) => {
  const columnHelper = createColumnHelper<ColumnData>();

  const columns = React.useMemo(
    () => [
      columnHelper.accessor('title', {
        header: () => 'Judul',
        cell: ({ getValue }) => {
          return (
            <div className="flex justify-between w-full mb-2">
              <label className="text-lg">{getValue()}</label>
            </div>
          );
        },
      }),
      // Perkasir
      ...(stockInUserReport
        ? stockInUserReport?.income_report?.map(({ name }) =>
            columnHelper.accessor(name, {
              header: () => name,
              cell: ({ getValue }) => getValue() || '',
              minSize: 200,
            })
          )
        : []),
    ],
    [columnHelper, stockInUserReport]
  );

  const getData = () => {
    const nameToDataMap = new Map(
      stockInUserReport?.income_report?.map(({ name, stock_in, expense, balance }) => {
        return [
          name,
          {
            title: name,
            stock_in,
            expense,
            balance,
          },
        ];
      })
    );

    const keys = Array.from(nameToDataMap.keys());

    const extractData = (dataName: keyof Omit<IncomeUserReportChild['stock_in'], 'payment_methods'>) => {
      return keys?.reduce((acc, key) => {
        const value = nameToDataMap.get(key)?.stock_in?.[dataName];

        return {
          ...acc,
          [key]: value
            ? formatCurrency({
                value,
              })
            : '-',
        };
      }, {}) as {
        [k: string]: string;
      };
    };

    const extractDataPaymentMethods = (dataName: keyof IncomeUserReportChild['stock_in']['payment_methods']) => {
      return keys?.reduce((acc, key) => {
        const value = nameToDataMap.get(key)?.stock_in?.payment_methods?.[dataName];
        return {
          ...acc,
          [key]: value
            ? formatCurrency({
                value,
              })
            : '-',
        };
      }, {}) as {
        [k: string]: string;
      };
    };

    const data: ColumnData[] = [
      {
        title: 'Pembelian',
        ...extractData('purchases'),
      },
      {
        title: 'Ongkir',
        ...extractData('shipping_cost'),
      },
      {
        title: 'Total Pembayaran',
        ...extractData('total_purchase'),
      },

      {
        title: 'Metode Pembayaran',
      },
      {
        title: 'Kas',
        ...extractDataPaymentMethods('cash'),
      },
      {
        title: 'Bank',
        ...extractDataPaymentMethods('bank'),
      },
      {
        title: 'Debet',
        ...extractDataPaymentMethods('debt'),
      },
      {
        title: 'Giro',
        ...extractDataPaymentMethods('current_account'),
      },
    ];

    return data;
  };

  const data = getData();
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    debugTable: true,
    debugHeaders: true,
    debugColumns: true,
    columnResizeMode: 'onChange',
  });
  return <CustomTable table={table} />;
};

const ExpenseUserReportSection = ({ expenseUserReport }: { expenseUserReport: IncomeUserReport }) => {
  const columnHelper = createColumnHelper<ColumnData>();

  const columns = React.useMemo(
    () => [
      columnHelper.accessor('title', {
        header: () => 'Judul',
        cell: ({ getValue }) => {
          return (
            <div className="flex justify-between w-full mb-2">
              <label className="text-lg">{getValue()}</label>
            </div>
          );
        },
      }),
      // Perkasir
      ...(expenseUserReport
        ? expenseUserReport?.income_report?.map(({ name }) =>
            columnHelper.accessor(name, {
              header: () => name,
              cell: ({ getValue }) => getValue() || '',
              minSize: 200,
            })
          )
        : []),
    ],
    [columnHelper, expenseUserReport]
  );

  const getData = () => {
    const nameToDataMap = new Map(
      expenseUserReport?.income_report?.map(({ name, expense, balance }) => {
        return [
          name,
          {
            title: name,
            expense,
            balance,
          },
        ];
      })
    );

    const keys = Array.from(nameToDataMap.keys());

    const extractData = (dataName: keyof Omit<IncomeUserReportChild['expense'], 'payment_methods' | 'expenses'>) => {
      return keys?.reduce((acc, key) => {
        const value = nameToDataMap.get(key)?.expense?.[dataName];

        return {
          ...acc,
          [key]: value
            ? formatCurrency({
                value,
              })
            : '-',
        };
      }, {}) as {
        [k: string]: string;
      };
    };

    const extractDataExpense = (dataName: string) => {
      return keys?.reduce((acc, key) => {
        const value = nameToDataMap.get(key)?.expense?.expenses?.find((val) => val.name === dataName)?.amount;

        return {
          ...acc,
          [key]: value
            ? formatCurrency({
                value,
              })
            : '-',
        };
      }, {}) as {
        [k: string]: string;
      };
    };

    const extractDataPaymentMethods = (dataName: keyof IncomeUserReportChild['expense']['payment_methods']) => {
      return keys?.reduce((acc, key) => {
        const value = nameToDataMap.get(key)?.expense?.payment_methods?.[dataName];
        return {
          ...acc,
          [key]: value
            ? formatCurrency({
                value,
              })
            : '-',
        };
      }, {}) as {
        [k: string]: string;
      };
    };

    // Avaiable expenses is the string name of expense in expenses
    const uniqueExpenses = Array.from(
      new Set(
        expenseUserReport?.income_report?.flatMap(({ expense }) => {
          return expense?.expenses?.map(({ name }) => name);
        })
      )
    );
    const data = [
      {
        title: 'Pembayaran',
      },
      ...(uniqueExpenses
        ? uniqueExpenses.map((name) => ({
            title: name,
            ...extractDataExpense(name),
          }))
        : []),
      {
        title: 'Total',
        ...extractData('total_expense'),
      },
      {
        title: 'Metode Pembayaran',
      },
      {
        title: 'Kas',
        ...extractDataPaymentMethods('cash'),
      },
      {
        title: 'Bank',
        ...extractDataPaymentMethods('bank'),
      },
      {
        title: 'Debet',
        ...extractDataPaymentMethods('debt'),
      },
      {
        title: 'Giro',
        ...extractDataPaymentMethods('current_account'),
      },
    ];

    return data as ColumnData[];
  };

  const data = getData();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    debugTable: true,
    debugHeaders: true,
    debugColumns: true,
    columnResizeMode: 'onChange',
  });
  return <CustomTable table={table} />;
};

const CustomTable = ({
  table,
}: {
  table: Table<{
    title: string;
  }>;
}) => {
  return (
    <div className="overflow-x-scroll">
      <table
        style={{
          width: '100%',
        }}
      >
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const { column } = header;

                return (
                  <th
                    className="py-6 px-4 break-words text-left border-b border-solid border-blue-600"
                    key={header.id}
                    colSpan={header.colSpan}
                    // IMPORTANT: This is where the magic happens!
                    style={{ ...getCommonPinningStyles(column) }}
                  >
                    <div className="whitespace-nowrap text-left">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}{' '}
                    </div>

                    <div
                      {...{
                        onDoubleClick: () => header.column.resetSize(),
                        onMouseDown: header.getResizeHandler(),
                        onTouchStart: header.getResizeHandler(),
                        className: `resizer ${header.column.getIsResizing() ? 'isResizing' : ''}`,
                      }}
                    />
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => {
                const { column } = cell;
                return (
                  <td
                    key={cell.id}
                    className="py-3 px-4"
                    // IMPORTANT: This is where the magic happens!
                    style={{
                      ...getCommonPinningStyles(column),
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableIncomeUserReport;
