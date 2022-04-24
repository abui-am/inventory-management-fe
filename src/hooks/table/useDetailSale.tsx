import React from 'react';

import { SaleItem } from '@/typings/sale';
import { formatToIDR } from '@/utils/format';

export const useDetailSaleAdaptor = (items: SaleItem[]) => {
  const getData = () => {
    return items.map(({ name, unit, pivot }) => ({
      name,
      unit,
      qty: pivot.quantity,
      sellPrice: formatToIDR(pivot.purchase_price ?? 0),
      total: formatToIDR(pivot.total_price),
    }));
  };

  const data = getData();
  const columns = React.useMemo(() => {
    const getColumn = () => {
      return [
        {
          Header: 'Nama Barang',
          accessor: 'name', // accessor is the "key" in the data
          width: '25%',
        },
        {
          Header: 'Unit',
          accessor: 'unit',
          width: '10%',
        },
        {
          Header: 'Jumlah',
          accessor: 'qty',
          width: '15%',
          style: {
            textAlign: 'right',
            display: 'block',
          },
          bodyStyle: {
            textAlign: 'right',
          },
        },
        {
          Header: 'Harga jual',
          accessor: 'sellPrice',
          style: {
            textAlign: 'right',
            display: 'block',
          },
          bodyStyle: {
            textAlign: 'right',
          },
        },
        {
          Header: 'Total harga',
          accessor: 'total',
          style: {
            textAlign: 'right',
            display: 'block',
          },
          bodyStyle: {
            textAlign: 'right',
          },
        },
      ];
    };

    return getColumn();
  }, []);

  return { data, columns };
};
