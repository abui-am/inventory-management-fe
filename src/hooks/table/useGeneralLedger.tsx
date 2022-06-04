import React from 'react';

import { formatDate, formatToIDR } from '@/utils/format';

import { useFetchLedgers } from '../query/useFetchLedgers';

export const useGeneralLedger = () => {
  const { data: dataRes, ...props } = useFetchLedgers({
    order_by: {
      created_at: 'desc',
      type: 'desc',
    },
    per_page: 10000,
  });

  const getData = () => {
    return dataRes?.data?.ledgers?.data?.map(({ created_at, amount, description, type }) => ({
      date: formatDate(created_at),
      description: <span className="font-bold text-blueGray-600">{description}</span>,
      debit: type === 'debit' ? formatToIDR(amount) : '-',
      kredit: type === 'credit' ? formatToIDR(amount) : '-',
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
      ];
    };

    return getColumn();
  }, []);

  return { data, columns, ...props };
};
