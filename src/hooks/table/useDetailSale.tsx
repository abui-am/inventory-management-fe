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
        },
        {
          Header: 'Unit',
          accessor: 'unit',
        },
        {
          Header: 'Jumlah',
          accessor: 'qty',
        },
        {
          Header: 'Harga jual',
          accessor: 'sellPrice',
        },
        {
          Header: 'Total harga',
          accessor: 'total',
        },
      ];
    };

    return getColumn();
  }, []);

  return { data, columns };
};
