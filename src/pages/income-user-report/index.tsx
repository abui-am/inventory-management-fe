import React from 'react';

import { CardDashboard } from '@/components/Container';
import TableIncomeUserReport from '@/components/table/TableIncomeUserReport';

const IncomeUserReportPage = () => {
  return (
    <CardDashboard>
      <TableIncomeUserReport />
    </CardDashboard>
  );
};

export default IncomeUserReportPage;
