// import Link from 'next/link';
import dayjs from 'dayjs';
import React from 'react';

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
                </span>
              </div>
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
              <div className="flex justify-between w-full mb-2">
                <label>Total:</label>
                <span>
                  <b>
                    {formatCurrency({
                      value: data?.incomes?.discounts ?? 0 + (data?.incomes?.sales ?? 0) + (data?.incomes?.hpp ?? 0),
                    })}
                  </b>
                </span>
              </div>
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
                      <div className="flex justify-between w-full mb-2" key={item.id}>
                        <label>{item.name}</label>
                        <span className="font-bold">
                          {formatCurrency({
                            value: item.amount,
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="mt-4">
              <h1 className="text-lg text-gray-900 font-bold mb-2">Total</h1>
              <Divider />

              <div className="flex justify-between w-full mb-2">
                <label>Total Beban: </label>
                <span>
                  <b>{formatCurrency({ value: data?.total_expense ?? 0 })}</b>
                </span>
              </div>
              <div className="flex justify-between w-full mb-2">
                <label>Total Pendapatan: </label>
                <span>
                  <b>{formatCurrency({ value: data?.total_income ?? 0 })}</b>
                </span>
              </div>
              <div className="flex justify-between w-full mb-2">
                <label>Total Profit: </label>
                <span>
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

export default TableIncomeReport;
