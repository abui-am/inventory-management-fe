import { NextPage } from 'next';
import Link from 'next/link';
import React from 'react';
import { Eye, Pencil, PlusLg, Search } from 'react-bootstrap-icons';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { TextField } from '@/components/Form';
import Table from '@/components/Table';

const TransactionPage: NextPage<unknown> = () => {
  const dataRes = [
    {
      tanggal: '16 Nov 21, 16:45',
      name: 'Sembako',
      customer: 'Abui',
      quantity: 10,
      amount: 2000,
      discount: '0',
      amountTotal: 20000,
      id: '01',
    },
    {
      tanggal: '16 Nov 21, 16:45',
      name: 'Sembako',
      customer: 'Abui',
      quantity: 10,
      amount: 2000,
      discount: '0',
      amountTotal: 20000,
      id: '01',
    },
    {
      tanggal: '16 Nov 21, 16:45',
      name: 'Sembako',
      customer: 'Abui',
      quantity: 10,
      amount: 2000,
      discount: '0',
      amountTotal: 20000,
      id: '01',
    },
    {
      tanggal: '16 Nov 21, 16:45',
      name: 'Sembako',
      customer: 'Abui',
      quantity: 10,
      amount: 2000,
      discount: '0',
      amountTotal: 20000,
      id: '01',
    },
    {
      tanggal: '16 Nov 21, 16:45',
      name: 'Sembako',
      customer: 'Abui',
      quantity: 10,
      amount: 2000,
      discount: '0',
      amountTotal: 20000,
      id: '01',
    },
    {
      tanggal: '16 Nov 21, 16:45',
      name: 'Sembako',
      customer: 'Abui',
      quantity: 10,
      amount: 2000,
      discount: '0',
      amountTotal: 20000,
      id: '01',
    },
  ];
  const data = dataRes.map(({ amount, amountTotal, customer, discount, id, name, quantity, tanggal }) => ({
    col1: tanggal,
    col2: name,
    col3: customer,
    col4: quantity,
    col5: amount,
    col6: discount,
    col7: amountTotal,
    col8: (
      <div className="flex">
        <Link href={`/employee/${id}`}>
          <a>
            <Button>
              <Eye width={24} height={24} />
            </Button>
          </a>
        </Link>
        <Button variant="secondary">
          <Pencil width={24} height={24} />
        </Button>
      </div>
    ),
  }));

  const columns = React.useMemo(
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
        Header: 'Nama pembeli',
        accessor: 'col3',
      },
      {
        Header: 'Jumlah',
        accessor: 'col4',
      },
      {
        Header: 'Harga',
        accessor: 'col5',
      },

      {
        Header: 'Diskon',
        accessor: 'col6',
      },
      {
        Header: 'Total harga',
        accessor: 'col7',
      },
      {
        Header: 'Aksi',
        accessor: 'col8',
      },
    ],
    []
  );
  return (
    <CardDashboard>
      <Table
        columns={columns}
        data={data}
        search={({ setGlobalFilter }) => (
          <div className="mt-2 mb-6 flex justify-between">
            <h2 className="text-2xl font-bold">Daftar Transaksi</h2>
            <div className="flex">
              <TextField
                Icon={<Search />}
                onChange={(e) => setGlobalFilter(e.target.value)}
                variant="contained"
                placeholder="Cari nama transaksi"
              />
              <Link href="/employee/add">
                <a>
                  <Button className="ml-3" Icon={<PlusLg className="w-4" />}>
                    Tambah
                  </Button>
                </a>
              </Link>
            </div>
          </div>
        )}
      />
    </CardDashboard>
  );
};

export default TransactionPage;
