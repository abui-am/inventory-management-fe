import React from 'react';

import { CardDashboard } from '@/components/Container';
import TableItems from '@/components/table/TableItems';

const ItemsPage: React.FC = () => {
  return (
    <CardDashboard>
      <TableItems />
    </CardDashboard>
  );
};

export default ItemsPage;
