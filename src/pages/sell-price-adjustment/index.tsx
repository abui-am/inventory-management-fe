import React from 'react';

import { CardDashboard } from '@/components/Container';
import TableStockIn from '@/components/table/TableStockIn';

const ConfirmationPage: React.FC = () => {
  return (
    <CardDashboard>
      <TableStockIn variant="on-review" />
    </CardDashboard>
  );
};

export default ConfirmationPage;
