import React from 'react';

import { CardDashboard } from '@/components/Container';
import TableCapitalChangeList from '@/components/table/TableCapitalChangeList';

const IncomeReportPage = () => {
  return (
    <CardDashboard>
      <TableCapitalChangeList />
    </CardDashboard>
  );
};

export default IncomeReportPage;
