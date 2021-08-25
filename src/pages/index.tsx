import { NextPage } from 'next';
import React, { useMemo } from 'react';
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { CardDashboard } from '@/components/Container';
import SimpleList from '@/components/List';
import Table from '@/components/Table';
import { formatToIDR } from '@/utils/format';
type CardProps = {
  label: string;
  value: string | number;
};

const Home: NextPage = () => {
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

  const data = [
    {
      name: 'Page A',
      uv: 4000,
      pv: 2400,
      amt: 2400,
    },
    {
      name: 'Page B',
      uv: 3000,
      pv: 1398,
      amt: 2210,
    },
    {
      name: 'Page C',
      uv: 2000,
      pv: 9800,
      amt: 2290,
    },
    {
      name: 'Page D',
      uv: 2780,
      pv: 3908,
      amt: 2000,
    },
    {
      name: 'Page E',
      uv: 1890,
      pv: 4800,
      amt: 2181,
    },
    {
      name: 'Page F',
      uv: 2390,
      pv: 3800,
      amt: 2500,
    },
    {
      name: 'Page G',
      uv: 3490,
      pv: 4300,
      amt: 2100,
    },
  ];

  const dataTable = [
    { col1: '16 Nov 21, 16:45', col2: 'Korek Api', col3: 12, col4: 'Rp12000' },
    { col1: '16 Nov 21, 16:45', col2: 'Korek Api', col3: 12, col4: 'Rp12000' },
    { col1: '16 Nov 21, 16:45', col2: 'Korek Api', col3: 12, col4: 'Rp12000' },
    { col1: '16 Nov 21, 16:45', col2: 'Korek Api', col3: 12, col4: 'Rp12000' },
    { col1: '16 Nov 21, 16:45', col2: 'Korek Api', col3: 12, col4: 'Rp12000' },
    { col1: '16 Nov 21, 16:45', col2: 'Korek Api', col3: 12, col4: 'Rp12000' },
  ];

  const columns = useMemo(
    () => [
      {
        Header: 'Tanggal',
        accessor: 'col1', // accessor is the "key" in the data
      },
      {
        Header: 'Nama barang',
        accessor: 'col2',
      },
      {
        Header: 'Jumlah',
        accessor: 'col3',
      },
      {
        Header: 'Total harga',
        accessor: 'col4',
      },
    ],
    []
  );

  const dataPie = [
    { name: 'Group A', value: 400 },
    { name: 'Group B', value: 300 },
    { name: 'Group C', value: 300 },
    { name: 'Group D', value: 200 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div>
      <section id="head" className="flex">
        <div className="flex-1 text-2xl font-bold mb-8">Overview</div>
        <div className="flex-1 max-w-sm" />
      </section>
      <section id="body" className="flex flex-wrap -m-3">
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
            <CardDashboard title="Laporan penjualan">
              <ResponsiveContainer width="100%" height={308}>
                <LineChart data={data}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Line type="monotone" dataKey="uv" stroke="#8884d8" />
                  <Line type="monotone" dataKey="pv" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </CardDashboard>
          </div>
        </div>
        <div className="w-4/12 p-3">
          <CardDashboard title="Penjualan terbanyak">
            {topSales.map(({ label, value }, index) => {
              // eslint-disable-next-line react/no-array-index-key
              return <SimpleList key={`${label}-${index}`} label={label} value={value} withTopDivider />;
            })}
          </CardDashboard>
        </div>
        <div className="w-8/12 p-3">
          <CardDashboard title="Transaksi terakhir">
            <Table columns={columns} data={dataTable} />
          </CardDashboard>
        </div>
        <div className="w-4/12 p-3">
          <CardDashboard title="Kategori terpopuler" style={{ height: 489 }}>
            <ResponsiveContainer width="100%" height={308}>
              <PieChart className="mx-auto">
                <Pie data={dataPie} innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Pie
                  data={data}
                  startAngle={180}
                  endAngle={0}
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
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

export default Home;
