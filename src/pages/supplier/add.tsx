import { NextPage } from 'next';
import React from 'react';

import { CardDashboard } from '@/components/Container';
import CreateSupplierForm from '@/components/form/CreateSupplierForm';

const AddSupplierPage: NextPage = () => {
  return (
    <CardDashboard title="Tambah Supplier">
      <CreateSupplierForm />
    </CardDashboard>
  );
};

export default AddSupplierPage;
