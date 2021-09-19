import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React from 'react';

import { CardDashboard } from '@/components/Container';
import CreateSupplierForm from '@/components/form/CreateSupplierForm';

const EditSupplierPage: NextPage = () => {
  const { query } = useRouter();
  return (
    <CardDashboard title="Edit Supplier">
      <CreateSupplierForm editId={query.id as string} isEdit />
    </CardDashboard>
  );
};

export default EditSupplierPage;
