import React from 'react';

import { TextField } from '@/components/Form';
import { TrasactionItem } from '@/typings/stock-in';
import { formatToIDR } from '@/utils/format';

export const useDetailStockInAdaptor = (items: TrasactionItem[], withSellPriceAdjustment: boolean) => {
  const [dataSellPrice, setDataSellPrice] = React.useState<{ id: string; sell_price: number }[]>(
    items.map(({ id }) => ({ id, sell_price: 0 }))
  );
  const getData = () => {
    if (!withSellPriceAdjustment) {
      return items.map(({ name, unit, pivot }) => ({
        col1: name,
        col15: unit,
        col2: pivot.quantity,
        col3: formatToIDR(pivot.purchase_price),
        col4: formatToIDR(pivot.discount as number),
        col5: formatToIDR(pivot.total_price),
      }));
    }
    return items.map(({ name, unit, pivot, id }) => ({
      name,
      unit,
      qty: pivot.quantity,
      purchasePrice: formatToIDR(pivot.purchase_price ?? 0),
      purchasePriceMedian: formatToIDR(pivot.median_purchase_price ?? 0),
      sellPriceAdjustment: (
        <AdjustSellPrice
          itemId={id}
          onChange={(newPrice) => {
            setDataSellPrice((prices) => prices.map((value) => (value?.id === newPrice.id ? newPrice : value)));
          }}
        />
      ),
    }));
  };

  const data = getData();
  const columns = React.useMemo(() => {
    const getColumn = () => {
      if (!withSellPriceAdjustment) {
        return [
          {
            Header: 'Nama Barang',
            accessor: 'col1', // accessor is the "key" in the data
          },
          {
            Header: 'Unit',
            accessor: 'col15',
          },
          {
            Header: 'Jumlah',
            accessor: 'col2',
          },
          {
            Header: 'Harga',
            accessor: 'col3',
          },
          {
            Header: 'Diskon',
            accessor: 'col4',
          },
          {
            Header: 'Total Harga',
            accessor: 'col5',
          },
        ];
      }

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
          Header: 'Harga beli',
          accessor: 'purchasePrice',
        },
        {
          Header: 'Harga beli median',
          accessor: 'purchasePriceMedian',
        },
        {
          Header: 'Harga jual',
          accessor: 'sellPriceAdjustment',
        },
      ];
    };

    return getColumn();
  }, [withSellPriceAdjustment]);

  return { data, columns, dataSellPrice };
};

export const AdjustSellPrice: React.FC<{
  itemId: string;
  onChange: (item: { id: string; sell_price: number }) => void;
}> = ({ itemId, onChange }) => {
  return (
    <div>
      <TextField type="number" onChange={(e) => onChange({ sell_price: +e.target.value, id: itemId })} />
    </div>
  );
};
