import React from 'react';

import { CardDashboard } from '@/components/Container';
import TableExpense from '@/components/table/TableExpense';

const ExpensePage = () => {
  return (
    <CardDashboard>
      <TableExpense />
    </CardDashboard>
  );
};

export default ExpensePage;
