import React from 'react';

import { formatDate, formatToIDR } from '@/utils/format';

export const useLedger = () => {
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
          description: 'Kas',
          debit: 400000,
          kredit: 0,
          saldo: 40000,
        },
        {
          date: '2022-05-05T04:04:04Z',
          description: 'Kas',
          debit: 0,
          kredit: 400000,
          saldo: 0,
        },
        {
          date: '2022-05-05T04:04:04Z',
          description: 'Kas',
          debit: 400000,
          kredit: 0,
          saldo: 400000,
        },
        {
          date: '2022-05-03T04:04:04Z',
          description: 'Kas',
          debit: 300000,
          kredit: 0,
          saldo: 700000,
        },
        {
          date: '2022-05-02T04:04:04Z',
          description: 'Kas',
          debit: 200000,
          kredit: 0,
          saldo: 900000,
        },
        {
          date: '2022-05-01T04:04:04Z',
          description: 'Kas',
          debit: 100000,
          kredit: 0,
          saldo: 1000000,
        },
      ],
    },
  };

  const getData = () => {
    return dataRes?.data?.general_ledger?.map(({ date, description, debit, kredit, saldo }) => ({
      date: formatDate(date),
      description: <span className="font-bold text-blueGray-600">{description}</span>,
      debit: debit !== 0 ? formatToIDR(debit) : '-',
      kredit: kredit !== 0 ? formatToIDR(kredit) : '-',
      saldo: formatToIDR(saldo),
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
