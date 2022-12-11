// import Link from 'next/link';
import dayjs from 'dayjs';
import React, { useState } from 'react';

import formatCurrency from '@/utils/formatCurrency';

import { Button } from '../Button';
import Divider from '../Divider';
import { TextField } from '../Form';

const TableIncomeReport: React.FC = () => {
  const [takeProfit, setTakeProfit] = useState(0);

  return (
    <>
      <section className="flex justify-center">
        <div className="max-w-4xl w-full">
          <label className="mb-4 block">
            <span className="text-gray-900 font-bold">Periode:</span>
          </label>
          <h2>6 November 2022 12:15:23 - {dayjs().format('DD MMMM YYYY HH:mm:ss')}</h2>
        </div>
      </section>
      <Divider />
      <section className="flex justify-center">
        <div className="max-w-4xl w-full rounded-md border p-6">
          <div>
            <div className="flex justify-between w-full mb-2">
              <h1 className="text-lg text-gray-900 font-bold mb-2">Modal Awal</h1>
              <span>
                <b>{formatCurrency({ value: 129950000 })}</b>
              </span>
            </div>
            <Divider />

            <div className="mb-4">
              <div className="flex justify-between w-full mb-2">
                <label>Laba disetor: </label>
                <span>
                  <b>{formatCurrency({ value: 1000_000 ?? 0 })}</b>
                </span>
              </div>
              <div className="flex justify-between w-full mb-2">
                <label>Laba ditahan:</label>
                <span>
                  <b>{formatCurrency({ value: 6000_000 ?? 0 })}</b>
                </span>
              </div>
              <div className="flex justify-between w-full mb-2">
                <label>Prive: </label>
                <span>
                  <b>-{formatCurrency({ value: 4000_000 ?? 0 })}</b>
                </span>
              </div>
            </div>
            <div className="flex justify-between w-full mb-2 p-2 rounded-lg items-center bg-gray-50 border">
              <label>Laba diambil owner: </label>
              <TextField placeholder="Masukan laba diambil" onChange={(e) => setTakeProfit(+e.target.value)} />
            </div>

            <div className="mt-8">
              <div className="flex justify-between w-full mb-2">
                <label className="text-lg">
                  <b>Modal Akhir:</b>{' '}
                </label>
                <span className="text-lg">
                  <b>{formatCurrency({ value: 129950000 + 1000_000 + 6000_000 - 4000_000 - takeProfit ?? 0 })}</b>
                </span>
              </div>
            </div>
            <div className="mt-8">
              <Button fullWidth>Buat Laporan Perubahan Modal</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default TableIncomeReport;
