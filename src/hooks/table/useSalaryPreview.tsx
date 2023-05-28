import Link from 'next/link';
import React from 'react';

import { EmployeeDataWithSalary } from '@/typings/employee';
import { formatToIDR } from '@/utils/format';
const useSalaryPreview = (previewSalaries: EmployeeDataWithSalary[]) => {
  const data = previewSalaries.map(({ first_name, last_name, id, position, salary }) => ({
    name: (
      <Link href={`/employee/${id}`}>
        <a className="font-bold hover:text-blue-700">{`${first_name} ${last_name}`}</a>
      </Link>
    ),
    position,

    salary: formatToIDR(salary),
  }));
  const columns = React.useMemo(
    () => [
      {
        Header: 'Nama',
        accessor: 'name', // accessor is the "key" in the data
      },
      {
        Header: 'Jabatan',
        accessor: 'position',
      },

      {
        Header: 'Gaji',
        accessor: 'salary',
        style: {
          textAlign: 'right',
          display: 'block',
        },
        bodyStyle: {
          textAlign: 'right',
        },
      },
    ],
    []
  );
  return {
    data,
    columns,
  };
};

export default useSalaryPreview;
