// import Link from 'next/link';
import dayjs from 'dayjs';
import React from 'react';
import { ChevronDown, ChevronUp } from 'react-bootstrap-icons';

import { useFetchIncomeReport } from '@/hooks/query/useFetchIncomeReport';
import formatCurrency from '@/utils/formatCurrency';

import Divider from '../Divider';
import { DateRangePicker } from '../Form';

const TableIncomeReport: React.FC = () => {
  const [from, setFrom] = React.useState(dayjs().startOf('day').toDate());
  const [to, setTo] = React.useState(dayjs().endOf('day').toDate());
  const { data: dataItems } = useFetchIncomeReport({
    date_end: dayjs(to).format('YYYY-MM-DD HH:mm:ss'),
    date_start: dayjs(from).format('YYYY-MM-DD HH:mm:ss'),
  });

  const data = dataItems?.data?.income_report;

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
      <section className="flex justify-center">
        <div className="max-w-4xl w-full rounded-md border p-6">
          <div>
            <h1 className="text-lg text-gray-900 font-bold mb-2">Pendapatan</h1>
            <Divider />

            <div className="mb-4">
              <div className="flex justify-between w-full mb-2">
                <label>Penjualan: </label>
                <span>
                  <b>{formatCurrency({ value: data?.incomes?.sales ?? 0 })}</b>
                  {/* Sales per user collapse */}
                </span>
              </div>

              {data?.incomes?.sales_per_user ? (
                <CurrencyCollapse title="Penjualan per User" data={data?.incomes?.sales_per_user} />
              ) : null}

              <div className="flex justify-between w-full mb-2">
                <label>HPP:</label>
                <span>
                  <b>{formatCurrency({ value: data?.incomes?.hpp ?? 0 })}</b>
                </span>
              </div>
              <div className="flex justify-between w-full mb-2">
                <label>Diskon Penjualan: </label>
                <span>
                  <b>{formatCurrency({ value: data?.incomes?.discounts ?? 0 })}</b>
                </span>
              </div>
            </div>
            <div className="flex justify-between w-full mb-2 p-2  rounded-lg bg-gray-50 border">
              <label>Total Pendapatan: </label>
              <span>
                <b>{formatCurrency({ value: data?.total_income ?? 0 })}</b>
              </span>
            </div>
            <div>
              <h1 className="text-lg text-gray-900 font-bold mb-2">Beban</h1>
              <Divider />
              {data?.expenses?.length === 0 ? (
                <div className="text-center p-4">Tidak ada data</div>
              ) : (
                <div>
                  {data?.expenses?.map((item) => {
                    return (
                      <div key={item.id}>
                        <div className="flex justify-between w-full mb-2">
                          <label>{item.name}</label>
                          <span className="font-bold">
                            {formatCurrency({
                              value: item.amount,
                            })}
                          </span>
                        </div>
                        <CurrencyCollapse title={`${item.name} per user`} data={item.expenses_per_user} />
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex justify-between w-full mb-2 p-2  rounded-lg bg-gray-50-50 border">
                <label>Total Beban: </label>
                <span>
                  <b>{formatCurrency({ value: data?.total_expense ?? 0 })}</b>
                </span>
              </div>
            </div>
            <div className="mt-8">
              <div className="flex justify-between w-full mb-2">
                <label className="text-lg">
                  <b>Total Profit:</b>{' '}
                </label>
                <span className="text-lg">
                  <b>{formatCurrency({ value: data?.total_profit ?? 0 })}</b>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

const CurrencyCollapse: React.FC<{ data: Record<string, number>; title }> = ({ data, title }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-2 justify-between w-full mb-4">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        type="button"
        className="items-center text-blue-700 hover:text-blue-900 flex justify-between w-full border border-gray-200 rounded-md p-2"
      >
        <span>{title}</span>
        {isOpen ? <ChevronUp /> : <ChevronDown />}
      </button>
      {isOpen && (
        <div className="w-full p-4 border border-gray-200 rounded-md">
          {Object.entries(data ?? {}).map(([key, value]) => (
            <div className="flex justify-between w-full mb-2 rounded-md" key={key}>
              <label>{key}</label>
              <span className="font-bold">
                {formatCurrency({
                  value,
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default TableIncomeReport;
