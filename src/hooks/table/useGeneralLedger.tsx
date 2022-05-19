import React from 'react';

import { formatDate, formatToIDR } from '@/utils/format';

export const useGeneralLedger = () => {
  //   const { data: dataRes, ...props } = useFetchUnpaginatedAudits({
  //     where: {
  //       audit_date: date ?? formatDateYYYYMMDD(new Date()),
  //     },
  //     per_page: 10000,
  //   });

  const props = {};

  const dataRes = {
    data: {
      general_ledger: [
        {
          date: '2022-05-05T04:04:04Z',
          description: 'Persediaan',
          debit: 400000,
          kredit: 0,
        },
        {
          date: '2022-05-05T04:04:04Z',
          description: 'Kas/Giro/Bank/Utang',
          debit: 0,
          kredit: 400000,
        },
      ],
    },
  };

  const getData = () => {
    return dataRes?.data?.general_ledger?.map(({ date, description, debit, kredit }) => ({
      date: formatDate(date),
      description: <span className="font-bold text-blueGray-600">{description}</span>,
      debit: debit !== 0 ? formatToIDR(debit) : '-',
      kredit: kredit !== 0 ? formatToIDR(kredit) : '-',
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
