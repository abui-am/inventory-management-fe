import { NextPage } from 'next';
import React from 'react';

import { CardDashboard } from '@/components/Container';
import TableStockIn from '@/components/table/TableStockIn';

const StoragePage: NextPage<unknown> = () => {
  return (
    <CardDashboard>
      <TableStockIn variant="all" withCreateButton />
    </CardDashboard>
  );
};

export default StoragePage;
