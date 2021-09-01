import { NextPage } from 'next';
import Link from 'next/link';
import React from 'react';
import { Calculator, Eye, Pencil, Search } from 'react-bootstrap-icons';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { TextField } from '@/components/Form';
import Table from '@/components/Table';
import Tag from '@/components/Tag';

const StoragePage: NextPage<unknown> = () => {
  const dataRes = [
    {
      name: 'Minyak',
      stock: 100,
      sellPrice: 1000,
      lastUpdate: '16 Nov 21, 16:45',
      id: '01',
      unit: 'KG',
      status: 'pending',
    },
    {
      name: 'Minyak',
      stock: 100,
      sellPrice: 1000,
      lastUpdate: '16 Nov 21, 16:45',
      id: '01',
      unit: 'KG',
      status: 'pending',
    },
    {
      name: 'Minyak',
      stock: 100,
      sellPrice: 1000,
      lastUpdate: '16 Nov 21, 16:45',
      id: '01',
      unit: 'KG',
      status: 'pending',
    },
  ];
  const data = dataRes.map(({ name, stock, unit, sellPrice, lastUpdate, id, status }) => ({
    col1: lastUpdate,
    col2: name,
    col3: stock,
    col4: unit,
    col5: sellPrice,
    col6: (
      <div>
        <Tag variant={status === 'pending' ? 'secondary' : 'primary'}>
          {status === 'pending' ? 'Menunggu' : 'Diterima'}
        </Tag>
      </div>
    ),
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
        Header: 'Tanggal',
        accessor: 'col1', // accessor is the "key" in the data
      },
      {
        Header: 'Nama barang',
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
        Header: 'Harga jual',
        accessor: 'col5',
      },

      {
        Header: 'Status',
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
              <Link href="/storage/adjust">
                <a>
                  <Button className="ml-3" Icon={<Calculator className="w-4" />}>
                    Sesuaikan
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
