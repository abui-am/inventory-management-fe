import React from 'react';

import { CardDashboard } from '@/components/Container';
import TableItems from '@/components/table/TableItems';

const ConfirmationPage: React.FC = () => {
  return (
    <CardDashboard>
      <TableItems />
    </CardDashboard>
  );
};

export default ConfirmationPage;
