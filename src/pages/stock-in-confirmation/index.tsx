import React, { PropsWithChildren } from 'react';

import { CardDashboard } from '@/components/Container';
import TableStockIn from '@/components/table/TableStockIn';

const ConfirmationPage: React.FC<PropsWithChildren<unknown>> = () => {
  return (
    <CardDashboard>
      <TableStockIn variant="pending" />
    </CardDashboard>
  );
};

export default ConfirmationPage;
