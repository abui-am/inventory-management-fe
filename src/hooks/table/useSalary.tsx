import Tippy from '@tippyjs/react';
import Link from 'next/link';
import React, { useState } from 'react';
import { CashCoin } from 'react-bootstrap-icons';

import { Button } from '@/components/Button';
import PaySalaryForm from '@/components/form/PaySalary';
import Modal from '@/components/Modal';
import { Datum } from '@/typings/salary';
import { formatToIDR } from '@/utils/format';

const useSalary = (salaries: Datum[]) => {
  const data = salaries.map(
    ({ employee, paid_in_advance, employee_position: position, status, paid_amount, employee_salary, ...props }) => ({
      name: (
        <Link href={`/employee/${employee.id}`}>
          <a className="font-bold hover:text-blue-700">{`${employee?.first_name} ${employee?.last_name}`}</a>
        </Link>
      ),
      position,
      status: (
        <div className={status === 'lunas' ? 'text-blue-600 font-bold' : ''}>
          {`${status} ${paid_in_advance ? ' (dibayar dimuka)' : ''}`}
        </div>
      ),
      salary: formatToIDR(employee_salary),
      paidAmount: formatToIDR(paid_amount),
      action:
        // Hide if zero

        +employee_salary - +paid_amount > 0 && (
          <PaySalary
            payroll={{
              employee,
              paid_in_advance,
              employee_position: position,
              status,
              paid_amount,
              employee_salary,
              ...props,
            }}
          />
        ),
    })
  );
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
        Header: 'Status',
        accessor: 'status',
      },
      {
        Header: 'Dibayarkan',
        accessor: 'paidAmount',
        style: {
          textAlign: 'right',
          display: 'block',
        },
        bodyStyle: {
          textAlign: 'right',
        },
      },
      {
        Header: 'Jumlah Gaji Bulanan',
        accessor: 'salary',
        style: {
          textAlign: 'right',
          display: 'block',
        },
        bodyStyle: {
          textAlign: 'right',
        },
      },
      {
        Header: 'Aksi',
        accessor: 'action',
        width: '100px',
      },
    ],
    []
  );
  return {
    data,
    columns,
  };
};

const PaySalary: React.FC<{ payroll: Datum }> = ({ payroll }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Tippy content="Bayar gaji">
        <Button className="ml-3" onClick={handleOpen}>
          <CashCoin />
        </Button>
      </Tippy>

      <Modal isOpen={isOpen} onRequestClose={handleClose}>
        <PaySalaryForm onSave={handleClose} onClose={handleClose} payroll={payroll} />
      </Modal>
    </>
  );
};
export default useSalary;
