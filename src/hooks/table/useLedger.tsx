import React from 'react';

import { Datum } from '@/typings/ledgers';
import { formatDate, formatToIDR } from '@/utils/format';

export const useLedger = (dataRes: Datum[]) => {
  const props = {};

  const getData = () => {
    return dataRes?.map(({ created_at, description, type, amount }) => ({
      date: formatDate(created_at),
      description: <span className="font-bold text-blueGray-600">{description}</span>,
      debit: type === 'debit' ? formatToIDR(amount) : '-',
      kredit: type === 'credit' ? formatToIDR(amount) : '-',
      saldo: '-',
    }));
  };

  const data = getData();
  const columns = React.useMemo(() => {
    const getColumn = () => {
      return [
        {
          Header: 'Tanggal',
          accessor: 'date', // accessor is the "key" in the data
        },
        {
          Header: 'Keterangan / Akun',
          accessor: 'description',
        },
        {
          Header: 'Debit',
          accessor: 'debit',
        },
        {
          Header: 'Kredit',
          accessor: 'kredit',
        },
        {
          Header: 'Saldo',
          accessor: 'saldo',
        },
      ];
    };

    return getColumn();
  }, []);

  return { data, columns, ...props };
};
