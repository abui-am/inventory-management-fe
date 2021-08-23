import React from 'react';

import { CardDashboard } from '@/components/Container';
import SimpleList from '@/components/List';
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

  const topSales = [
    { label: 'Minyak', value: formatToIDR(25000) },
    { label: 'Minyak', value: formatToIDR(25000) },
    { label: 'Minyak', value: formatToIDR(25000) },
    { label: 'Minyak', value: formatToIDR(25000) },
    { label: 'Minyak', value: formatToIDR(25000) },
    { label: 'Minyak', value: formatToIDR(25000) },
    { label: 'Minyak', value: formatToIDR(25000) },
  ];
  return (
    <div>
      <section id="head" className="flex">
        <div className="flex-1 text-2xl font-bold mb-8">Overview</div>
        <div className="flex-1 max-w-sm" />
      </section>
      <section id="body" className="flex -m-3">
        <div className="w-8/12">
          <div className="w-full flex">
            {cardValues.map(({ label, value }) => {
              return (
                <div className="h-32 flex-1 p-3" key={label}>
                  <Card label={label} value={value} />
                </div>
              );
            })}
          </div>
          <div className="w-full p-3">
            <CardDashboard title="Laporan penjualan" />
          </div>
        </div>
        <div className="w-4/12  p-3">
          <CardDashboard title="Penjualan terbanyak">
            {topSales.map(({ label, value }, index) => {
              // eslint-disable-next-line react/no-array-index-key
              return <SimpleList key={`${label}-${index}`} label={label} value={value} withTopDivider />;
            })}
          </CardDashboard>
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
