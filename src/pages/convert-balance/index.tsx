import React, { PropsWithChildren } from 'react';

import { CardDashboard } from '@/components/Container';
import TableTopUps from '@/components/table/TableLedgerTopUps';

const ConvertBalancePage: React.FC<PropsWithChildren<unknown>> = () => {
  return (
    <CardDashboard>
      <TableTopUps />
    </CardDashboard>
  );
};

export default ConvertBalancePage;
