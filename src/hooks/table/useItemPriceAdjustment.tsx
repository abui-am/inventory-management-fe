import { Field, FieldProps } from 'formik';
import React from 'react';

import { Item } from '@/typings/item';
import { formatToIDR } from '@/utils/format';

import { AdjustSellPrice } from './useDetailStockin';

const useItemPriceAdjustment = ({ item }: { item?: Item }) => {
  const columns = React.useMemo(() => {
    return [
      {
        Header: 'Nama Barang',
        accessor: 'name',
      },
      {
        Header: 'Harga Beli',
        accessor: 'buy_price',
      },
      {
        Header: 'Harga Jual',
        accessor: 'sell_price',
      },
      {
        Header: 'Kuantitas',
        accessor: 'quantity',
      },
      {
        Header: 'Harga Jual Baru',
        accessor: 'action',
      },
    ];
  }, []);
  const data = [
    {
      name: item?.name,
      buy_price: formatToIDR(item?.buy_price || 0),
      sell_price: formatToIDR(item?.sell_price || 0),
      quantity: item?.quantity,
      action: (
        <Field name="sellPrice">
          {(formik: FieldProps) => {
            return (
              <AdjustSellPrice
                id={item?.id ?? ''}
                value={formik.field.value}
                onChange={(newPrice) => {
                  formik.form.setFieldValue(formik.field.name, newPrice.sell_price);
                }}
              />
            );
          }}
        </Field>
      ),
    },
  ];
  return {
    columns,
    data,
  };
};

export default useItemPriceAdjustment;
