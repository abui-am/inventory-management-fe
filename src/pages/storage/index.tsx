import { NextPage } from 'next';
import Link from 'next/link';
import React from 'react';
import { Eye, Pencil, PlusLg, Search } from 'react-bootstrap-icons';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { TextField } from '@/components/Form';
import Table from '@/components/Table';

const StoragePage: NextPage<unknown> = () => {
  const dataRes = [
    {
      name: 'Minyak',
      type: 'Sembako',
      stock: 100,
      price: 1000,
      lastUpdate: '16 Nov 21, 16:45',
      id: '01',
      unit: 'KG',
    },
    {
      name: 'Beras',
      type: 'Sembako',
      stock: 1000,
      price: 500,
      lastUpdate: '16 Nov 21, 16:45',
      id: '01',
      unit: 'KG',
    },
    {
      name: 'Tepung',
      type: 'Sembako',
      stock: 50,
      price: 2000,
      lastUpdate: '16 Nov 21, 16:45',
      id: '01',
      unit: 'KG',
    },
    {
      name: 'Gas',
      type: 'Sembako',
      stock: 900,
      price: 10000,
      lastUpdate: '16 Nov 21, 16:45',
      id: '01',
      unit: 'KG',
    },
    {
      name: 'Roti',
      type: 'Sembako',
      stock: 500,
      price: 500,
      lastUpdate: '16 Nov 21, 16:45',
      id: '01',
      unit: 'KG',
    },
  ];
  const data = dataRes.map(({ name, type, stock, unit, price, lastUpdate, id }) => ({
    col1: name,
    col2: type,
    col3: stock,
    col4: unit,
    col5: price,
    col6: lastUpdate,
    col7: (
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
        Header: 'Nama barang',
        accessor: 'col1', // accessor is the "key" in the data
      },
      {
        Header: 'Jenis',
        accessor: 'col2',
      },
      {
        Header: 'Stock',
        accessor: 'col3',
      },
      {
        Header: 'Unit',
        accessor: 'col4',
      },
      {
        Header: 'Harga',
        accessor: 'col5',
      },

      {
        Header: 'Pembaharuan terakhir',
        accessor: 'col6',
      },
      {
        Header: 'Aksi',
        accessor: 'col7',
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
            <h2 className="text-2xl font-bold">Daftar Stock Gudang</h2>
            <div className="flex">
              <TextField
                Icon={<Search />}
                onChange={(e) => setGlobalFilter(e.target.value)}
                variant="contained"
                placeholder="Cari nama barang"
              />
              <Link href="/storage/add">
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

export default StoragePage;
