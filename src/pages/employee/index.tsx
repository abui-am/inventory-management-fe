import { NextPage } from 'next';
import React from 'react';
import { PlusLg, Search } from 'react-bootstrap-icons';

import { CardDashboard } from '@/components/Container';
import { Button, TextField } from '@/components/Form';
import Table from '@/components/Table';

const Home: NextPage<unknown> = () => {
  const data = React.useMemo(
    () => [
      {
        col1: 'Hello',
        col2: 'World',
      },
      {
        col1: 'react-table',
        col2: 'rocks',
      },
      {
        col1: 'whatever',
        col2: 'you want',
      },
    ],
    []
  );

  const columns = React.useMemo(
    () => [
      {
        Header: 'Column 1',
        accessor: 'col1', // accessor is the "key" in the data
      },
      {
        Header: 'Column 2',
        accessor: 'col2',
      },
    ],
    []
  );
  return (
    <CardDashboard
      title="Daftar Karyawan"
      Action={
        <div className="flex">
          <TextField Icon={<Search />} variant="contained" placeholder="Cari nama karyawan" />
          <Button className="ml-3" Icon={<PlusLg className="w-4" />}>
            Tambah
          </Button>
        </div>
      }
    >
      <Table columns={columns} data={data} search={() => <div />} />
    </CardDashboard>
  );
};

export default Home;
