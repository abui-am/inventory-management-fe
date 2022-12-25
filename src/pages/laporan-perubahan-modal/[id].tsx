import { useRouter } from 'next/router';
import React from 'react';

import { CardDashboard } from '@/components/Container';
import TableCapitalChange from '@/components/table/TableCapitalChange';

const IncomeReportPage = () => {
  const { query } = useRouter();

  return (
    <CardDashboard>
      <TableCapitalChange isView endDate={query.id as string} startDate={query.start_date as string} />
    </CardDashboard>
  );
};

export default IncomeReportPage;
