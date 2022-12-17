import { useRouter } from 'next/router';
import React from 'react';

import { CardDashboard } from '@/components/Container';
import TableCapitalChange from '@/components/table/TableCapitalChange';

const IncomeReportPage = () => {
  const { query } = useRouter();
  return (
    <CardDashboard>
      <TableCapitalChange isView reportDate={query.id as string} />
    </CardDashboard>
  );
};

export default IncomeReportPage;
