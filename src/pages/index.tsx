/* eslint-disable react/no-array-index-key */
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { useMemo } from 'react';
import { BagX as FileX } from 'react-bootstrap-icons';
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { CardDashboard } from '@/components/Container';
import { DatePickerComponent } from '@/components/Form';
import SimpleList from '@/components/List';
import Table from '@/components/Table';
import { HomeProvider, useHome } from '@/context/home-context';
import { usePermission } from '@/context/permission-context';
import useFetchSales from '@/hooks/query/useFetchSale';
import { SalesResponseUnpaginated } from '@/typings/sale';
import { formatDate, formatDateYYYYMMDD, formatToIDR } from '@/utils/format';
type CardProps = {
  label: string;
  value: string | number;
};

const HomeWithWrapper: React.FC = () => {
  const permiss = usePermission();
  const isHavingPermission = permiss.state.permission.includes('view:home');
  const router = useRouter();
  if (!isHavingPermission) {
    const roleIds = permiss.state.roles.map(({ id }) => id);
    if (roleIds.includes(4)) {
      router.push('/stock-in-confirmation');
    }

    if (roleIds.includes(2)) {
      router.push('/transaction');
    }
  }
  return (
    <HomeProvider>
      <Home />
    </HomeProvider>
  );
};

const Home: NextPage = () => {
  const cardValues = [
    { label: 'Pengeluaran', value: formatToIDR(98000) },
    { label: 'pemasukan', value: formatToIDR(120000) },
    { label: 'Jumlah transaksi', value: 20 },
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

  const dataPie = [
    { name: 'Group A', value: 400 },
    { name: 'Group B', value: 300 },
    { name: 'Group C', value: 300 },
    { name: 'Group D', value: 200 },
  ];

  const { state, dispatch } = useHome();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div>
      <section id="head" className="mb-6 sm:flex sm:mb-0">
        <div className="flex-1 text-2xl font-bold mb-8 sm:mx-0 mx-6">Overview</div>
        <div className="flex-1 max-w-sm">
          <div className="flex items-center">
            <DatePickerComponent
              selected={state.startDate}
              onChange={(val) => {
                dispatch({ type: 'setStartDate', payload: val as Date });
              }}
            />
            <span className="ml-2 mr-2">to</span>
            <DatePickerComponent
              selected={state.endDate}
              onChange={(val) => {
                dispatch({ type: 'setEndDate', payload: val as Date });
              }}
            />
          </div>
        </div>
      </section>
      <section id="body" className="flex flex-wrap -m-3">
        <div className="w-full sm:w-8/12">
          <div className="w-full flex-col flex sm:flex-row">
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
        <div className="w-full sm:w-4/12 p-3">
          <TopSale />
        </div>
        <div className="w-full sm:w-8/12 p-3">
          <LastTransaction />
        </div>
        <div className="w-full sm:w-4/12 p-3">
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

const getTopSaleFromSales = (data: SalesResponseUnpaginated) => {
  let topSaleItems: { id: string; name: string; quantity: number }[] = [];
  data?.transactions?.forEach?.(({ items }) => {
    items.forEach(({ pivot }) => {
      let exist = false;
      const tempTopSale = [...topSaleItems];
      topSaleItems.forEach((value, index) => {
        if (value.id === pivot.item_id) {
          tempTopSale[index].quantity += +pivot.quantity;
          exist = true;
        }
      });

      if (!exist) {
        tempTopSale.push({
          id: pivot.item_id,
          name: pivot.item_name,
          quantity: pivot.quantity,
        });
      }
      topSaleItems = tempTopSale;
    });
  });

  return topSaleItems.sort(({ quantity: qty }, { quantity }) => quantity - qty).slice(0, 9);
};

const TopSale = () => {
  const { state } = useHome();
  const { data, isFetching } = useFetchSales<SalesResponseUnpaginated>({
    start_date: state.startDate,
    end_date: state.endDate,
    paginated: false,
  });

  const topSaleItems = useMemo(
    () => getTopSaleFromSales(data?.data as SalesResponseUnpaginated),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isFetching]
  );

  return (
    <CardDashboard title="Penjualan terbanyak" className="h-full">
      {topSaleItems.length === 0 && (
        <div className="w-full h-full flex items-center justify-center flex-col mb-8">
          <FileX className="h-24 w-24 mb-16 opacity-50" />
          <span className="max-w-xs text-center">
            Tidak ada penjualan dari tanggal {formatDateYYYYMMDD(state.startDate)} sampai{' '}
            {formatDateYYYYMMDD(state.endDate)}
          </span>
        </div>
      )}
      {(topSaleItems || []).map(({ name, id, quantity }) => {
        // eslint-disable-next-line react/no-array-index-key
        return <SimpleList key={`${name}-${id}`} label={name} value={quantity} withTopDivider />;
      })}
    </CardDashboard>
  );
};

const LastTransaction = () => {
  const { data } = useFetchSales({
    per_page: 6,
    order_by: {
      created_at: 'desc',
    },
  });
  const dataTable =
    data?.data.transactions.data.map(({ transaction_code, created_at, payment_method, items, customer }) => ({
      id: transaction_code,
      date: formatDate(created_at, { withHour: true }),
      purchaseMethod: payment_method,
      payAmount: formatToIDR(items.reduce((prev, next) => prev + next.pivot.total_price, 0)),
      customer: customer.full_name,
    })) ?? [];
  const columns = useMemo(
    () => [
      {
        Header: 'Kode Transaksi',
        accessor: 'id', // accessor is the "key" in the data
      },
      {
        Header: 'Tanggal',
        accessor: 'date',
      },
      {
        Header: 'Pembeli',
        accessor: 'customer',
      },
      {
        Header: 'Metode Pembayaran',
        accessor: 'purchaseMethod',
      },
      {
        Header: 'Pembayaran',
        accessor: 'payAmount',
      },
    ],
    []
  );

  return (
    <CardDashboard title="Transaksi terakhir">
      <Table columns={columns} data={dataTable} />
    </CardDashboard>
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

export default HomeWithWrapper;
