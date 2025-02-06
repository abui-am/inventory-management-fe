import { Field, FieldProps } from 'formik';
import React from 'react';

import { CurrencyTextField } from '@/components/Form';
import { TrasactionItem } from '@/typings/stock-in';
import { formatToIDR } from '@/utils/format';

import useWindowSize, { XL } from '../useWindowSize';

export const useDetailStockInAdaptor = (items: TrasactionItem[], withSellPriceAdjustment: boolean) => {
  const initialValues: {
    data: { id: string; sell_price: number }[];
  } = {
    data: [],
  };

  const windowSize = useWindowSize();
  const isXl = windowSize >= XL;

  const getData = () => {
    if (!withSellPriceAdjustment) {
      return items.map(({ name, unit, pivot }) => ({
        col1: name,
        col15: unit,
        col2: pivot.quantity,
        col3: formatToIDR(pivot.purchase_price),
        col5: formatToIDR(pivot.total_price),
      }));
    }
    return items.map(({ name, unit, pivot, id }, index) => ({
      name,
      unit,
      ...(isXl
        ? {
            qty: pivot.quantity,
            purchasePrice: formatToIDR(pivot.purchase_price ?? 0),
            purchasePriceMedian: formatToIDR(pivot.median_purchase_price ?? 0),
          }
        : {
            detail: (
              <div>
                <label className="block">Quantity:</label>
                <div className="text-base font-bold block mb-2">{pivot.quantity}</div>
                <label className="block">Harga beli</label>
                <div className="text-base font-bold block mb-2">{formatToIDR(pivot.purchase_price ?? 0)}</div>
                <label className="block">Harga beli median</label>
                <div className="text-base font-bold block mb-2">{formatToIDR(pivot.median_purchase_price ?? 0)}</div>
              </div>
            ),
          }),
      sellPriceAdjustment: (
        <Field name={`data[${index}]`}>
          {(formik: FieldProps) => {
            return (
              <AdjustSellPrice
                id={id}
                value={formik.field.value?.sell_price}
                onChange={(newPrice) => {
                  formik.form.setFieldValue(formik.field.name, newPrice);
                }}
              />
            );
          }}
        </Field>
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
            width: '25%',
          },
          {
            Header: 'Unit',
            accessor: 'col15',
            width: '10%',
          },
          {
            Header: 'Jumlah',
            accessor: 'col2',
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
            Header: 'Harga',
            accessor: 'col3',
            width: '30%',
            style: {
              textAlign: 'right',
              display: 'block',
            },
            bodyStyle: {
              textAlign: 'right',
            },
          },

          {
            Header: 'Total Harga',
            accessor: 'col5',
            style: {
              display: 'block',
              textAlign: 'right',
            },
            bodyStyle: {
              textAlign: 'right',
            },
          },
        ];
      }

      return [
        {
          Header: 'Nama Barang',
          accessor: 'name', // accessor is the "key" in the data
          width: '20%',
        },
        {
          Header: 'Unit',
          accessor: 'unit',
          width: '10%',
        },
        ...(isXl
          ? [
              {
                Header: 'Jumlah',
                accessor: 'qty',
                width: '10%',
                style: {
                  textAlign: 'right',
                  display: 'block',
                },
                bodyStyle: {
                  textAlign: 'right',
                },
              },
              {
                Header: 'Harga beli',
                accessor: 'purchasePrice',
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
                Header: 'Harga beli median',
                accessor: 'purchasePriceMedian',
                width: '15%',
                style: {
                  textAlign: 'right',
                  display: 'block',
                },
                bodyStyle: {
                  textAlign: 'right',
                },
              },
            ]
          : [
              {
                Header: 'Detail',
                accessor: 'detail',
                width: '40%',
              },
            ]),
        {
          Header: 'Harga jual',
          accessor: 'sellPriceAdjustment',
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
  }, [isXl, withSellPriceAdjustment]);

  return { data, columns, initialValues };
};

export const AdjustSellPrice: React.FC<{
  value: number;
  id: string;
  onChange: (item: { sell_price: number | ''; id: string }) => void;
}> = ({ onChange, value, id }) => {
  return (
    <div>
      <CurrencyTextField value={value} onChange={(val) => onChange({ sell_price: val ?? '', id })} />
    </div>
  );
};
