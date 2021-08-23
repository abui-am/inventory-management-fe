import React from 'react';

import { CardDashboard } from '@/components/Container';
import { formatToIDR } from '@/utils/format';
type CardProps = {
  label: string;
  value: string | number;
};

const index = () => {
  const cardValues = [
    { label: 'Pengeluaran', value: formatToIDR(98000) },
    { label: 'pemasukan', value: formatToIDR(120000) },
    { label: 'Jumlah transaksi', value: 20 },
  ];
  return (
    <div>
      <section id="head" className="flex">
        <div className="flex-1 mb-8">Overview</div>
        <div className="flex-1 max-w-sm" />
      </section>
      <section id="body" className="grid grid-flow-col grid-cols-3 gap-6">
        <div className="col-span-2 grid grid-cols-3 gap-6">
          {cardValues.map(({ label, value }) => {
            return <Card key={label} label={label} value={value} />;
          })}
          <div className="col-span-3">
            <CardDashboard title="Penjualan terbanyLaporan penjualan" />
          </div>
        </div>
        <div>
          <CardDashboard title="Penjualan terbanyak" />
        </div>
      </section>
    </div>
  );
};

const Card = ({ label, value }: CardProps) => {
  return (
    <CardDashboard>
      <label className="text-sm mb-1 block">{label}</label>
      <span className="text-2xl font-bold">{value}</span>
    </CardDashboard>
  );
};

export default index;
