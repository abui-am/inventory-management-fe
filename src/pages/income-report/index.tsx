import React from 'react';

import { CardDashboard } from '@/components/Container';
import TableIncomeReport from '@/components/table/TableIncomeReport';

function IncomeReportPage() {
  return (
    <CardDashboard>
      <TableIncomeReport />
    </CardDashboard>
  );
}

export default IncomeReportPage;
