import { NextPage } from 'next';
import React from 'react';
import { PlusLg, Search } from 'react-bootstrap-icons';

import { CardDashboard } from '@/components/Container';
import { Button, TextField } from '@/components/Form';

const Home: NextPage<unknown> = () => {
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
    />
  );
};

export default Home;
