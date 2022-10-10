import React from 'react';

import { CardDashboard } from '@/components/Container';
import TableIncomeReport from '@/components/table/TableIncomeReport';

const IncomeReportPage = () => {
  return (
    <CardDashboard>
      <TableIncomeReport />
    </CardDashboard>
  );
};

export default IncomeReportPage;
