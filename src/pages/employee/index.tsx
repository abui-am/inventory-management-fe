import { NextPage } from 'next';
import React from 'react';
import { Search } from 'react-bootstrap-icons';

import { CardDashboard } from '@/components/Container';
import { Button, TextArea, TextField } from '@/components/Form';

const Home: NextPage<unknown> = () => {
  return (
    <CardDashboard
      title="Daftar Karyawan"
      Action={
        <div className="flex">
          <TextField Icon={<Search />} variant="contained" placeholder="Cari nama karyawan" />
          <Button>Tambah</Button>
        </div>
      }
    />
  );
};

export default Home;
