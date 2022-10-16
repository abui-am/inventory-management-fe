// import Link from 'next/link';
import dayjs from 'dayjs';
import React from 'react';

import { useFetchIncomeReport } from '@/hooks/query/useFetchIncomeReport';
import formatCurrency from '@/utils/formatCurrency';

const TableIncomeReport: React.FC = () => {
  const { data: dataItems } = useFetchIncomeReport({
    date_end: dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss'),
    date_start: dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss'),
  });

  const data = dataItems?.data?.income_report;

  return (
    <section className="flex justify-center">
      <div className="max-w-4xl w-full rounded-md border p-6">
        <div className="flex space-x-1 mb-4">
          <label>
            <span className="text-gray-900 font-bold">Tanggal:</span>
          </label>
          <span>{dayjs().format('DD MMMM YYYY')}</span>
        </div>
        <div>
          <h1 className="text-lg text-gray-900 font-bold mb-2">Pendapatan</h1>
          <div className="mb-4">
            <div className="space-x-1 mb-2">
              <label>Penjualan: </label>
              <span>{formatCurrency({ value: data?.income?.sales ?? 0 })}</span>
            </div>
            <div className="space-x-1 mb-2">
              <label>HPP:</label>
              <span>{formatCurrency({ value: data?.income?.hpp ?? 0 })}</span>
            </div>
            <div className="space-x-1 mb-2">
              <label>Diskon Penjualan: </label>
              <span>{formatCurrency({ value: data?.income?.discounts ?? 0 })}</span>
            </div>
            <div className="space-x-1 mb-2">
              <label>Total:</label>
              <span>
                {formatCurrency({
                  value: data?.income?.discounts ?? 0 + (data?.income?.sales ?? 0) + (data?.income?.hpp ?? 0),
                })}
              </span>
            </div>
          </div>
          <div>
            <h1 className="text-lg text-gray-900 font-bold mb-2">Beban</h1>
            <div>
              {data?.expenses?.map((item) => {
                return (
                  <div className="flex space-x-2" key={item.id}>
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
          </div>
          <div className="mt-4">
            <h1 className="text-lg text-gray-900 font-bold mb-2">Total</h1>
            <div className="space-x-1 mb-2">
              <label>Total Beban: </label>
              <span>{formatCurrency({ value: data?.total_expense ?? 0 })}</span>
            </div>
            <div className="space-x-1 mb-2">
              <label>Total Pendapatan: </label>
              <span>{formatCurrency({ value: data?.total_income ?? 0 })}</span>
            </div>
            <div className="space-x-1 mb-2">
              <label>Total Profit: </label>
              <span>{formatCurrency({ value: data?.total_profit ?? 0 })}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TableIncomeReport;
