import { NextPage } from 'next';
import Link from 'next/link';
import React from 'react';
import { Eye, Pencil, PlusLg, Search } from 'react-bootstrap-icons';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { TextField } from '@/components/Form';
import Table from '@/components/Table';
import useFetchEmployee from '@/hooks/query/useFetchEmployee';

const Home: NextPage<unknown> = () => {
  const { data: dataEmployee, isFetching } = useFetchEmployee();

  const dataRes = dataEmployee?.data?.employees?.data ?? [];
  const data = dataRes.map(({ firstName, lastName, position, id, hasDashboardAccount }) => ({
    col1: `${firstName} ${lastName}`,
    col2: position,
    col3: hasDashboardAccount ? (
      <span className="text-blue-600 bold">Aktif</span>
    ) : (
      <span className="bold">Tidak Aktif</span>
    ),
    col4: (
      <div className="flex">
        <Eye />
        <Pencil />
      </div>
    ),
  }));

  const columns = React.useMemo(
    () => [
      {
        Header: 'Nama Karyawan',
        accessor: 'col1', // accessor is the "key" in the data
      },
      {
        Header: 'Jabatan',
        accessor: 'col2',
      },
      {
        Header: 'Akun Dashboard',
        accessor: 'col3',
      },
      {
        Header: 'Aksi',
        accessor: 'col4',
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
          <div className="mt-2 mb-10 flex justify-between">
            <h2 className="text-2xl font-bold">Daftar Karyawan</h2>
            <div className="flex">
              <TextField
                Icon={<Search />}
                onChange={(e) => setGlobalFilter(e.target.value)}
                variant="contained"
                placeholder="Cari nama karyawan"
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

export default Home;
