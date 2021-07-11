import { NextPage } from 'next';
import React from 'react';

import { CardDashboard } from '@/components/Container';
import DashboardLayout from '@/layouts/DashboardLayout';

const Home: NextPage<unknown> = () => {
  return (
    <DashboardLayout title="Karyawan">
      <CardDashboard title="Daftar Karyawan">Apa aja</CardDashboard>
    </DashboardLayout>
  );
};

export default Home;
