import { useFormik } from 'formik';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React from 'react';
import { object } from 'yup';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { DatePickerComponent, TextField, ThemedSelect } from '@/components/Form';
import Table from '@/components/Table';
import { INVOICE_TYPE_OPTIONS } from '@/constants/options';
import createSchema from '@/utils/validation/formik';

export type AdjustStockTableValue = {
  name: string;
  qty: number;
  buyPrice: number;
  discount: number;
  unit: string;
  memo: string;
};

const AdjustStockPage: NextPage = () => {
  const { back } = useRouter();
  const initialValues = {
    invoiceNumber: '',
    invoiceType: INVOICE_TYPE_OPTIONS[0],
    dateIn: new Date(),
    memo: '',
  };
  const { values, handleChange, errors, isSubmitting, setFieldValue } = useFormik({
    validationSchema: object().shape(createSchema(initialValues)),
    initialValues,
    onSubmit: async () => {
      return '';
    },
  });

  const dataRes: AdjustStockTableValue[] = [
    {
      name: 'Minyak',
      qty: 100,
      buyPrice: 100,
      discount: 0,
      unit: 'Dus',
      memo: '',
    },
  ];
  const data = dataRes.map(({ name, qty, buyPrice, discount, unit, memo }) => ({
    col1: name,
    col2: qty,
    col3: buyPrice,
    col4: discount,
    col5: unit,
    col6: memo,
  }));

  const columns = React.useMemo(
    () => [
      {
        Header: 'Nama barang',
        accessor: 'col1', // accessor is the "key" in the data
      },
      {
        Header: 'Qty',
        accessor: 'col2',
      },
      {
        Header: 'Harga beli',
        accessor: 'col3',
      },
      {
        Header: 'Diskon',
        accessor: 'col4',
      },
      {
        Header: 'Kemasan',
        accessor: 'col5',
      },
      {
        Header: 'Catatan',
        accessor: 'col6',
      },
    ],
    []
  );
  return (
    <CardDashboard title="Penyesuaian Stock Gudang">
      <div className="flex flex-wrap -mx-2 mb-8">
        <div className="w-6/12 px-2 mb-3">
          <label className="mb-1 inline-block">Nomor faktur</label>
          <div className="flex w-full">
            <ThemedSelect
              variant="contained"
              value={values.invoiceType}
              additionalStyle={{
                control: () => ({
                  width: 160,
                }),
              }}
              onChange={(e) => {
                setFieldValue('invoiceType', e);
              }}
              className="mr-2"
              options={INVOICE_TYPE_OPTIONS}
            />
            <div className="flex-1">
              <TextField
                id="invoiceNumber"
                name="invoiceNumber"
                value={values.invoiceNumber}
                placeholder="Masukan nomor faktur"
                autoComplete="invoiceNumber"
                disabled={isSubmitting}
                onChange={handleChange}
                hasError={!!errors.invoiceNumber}
              />
            </div>
          </div>

          {errors.invoiceNumber && <span className="text-xs text-red-500">{errors.invoiceNumber}</span>}
        </div>

        <div className="w-3/12 px-2 mb-3">
          <label className="mb-1 inline-block">Tanggal masuk</label>
          <DatePickerComponent
            id="dateIn"
            name="dateIn"
            selected={values.dateIn}
            disabled={isSubmitting}
            onChange={handleChange}
          />
          {errors.dateIn && <span className="text-xs text-red-500">{errors.dateIn}</span>}
        </div>
        <div className="w-3/12 px-2 mb-3">
          <label className="mb-1 inline-block">Catatan</label>
          <TextField
            id="memo"
            name="memo"
            value={values.memo}
            placeholder="Masukan catatan"
            disabled={isSubmitting}
            onChange={handleChange}
            hasError={!!errors.memo}
          />
          {errors.memo && <span className="text-xs text-red-500">{errors.memo}</span>}
        </div>

        <div className="w-full px-2 mb-3">
          <div className="mb-4">
            <Table columns={columns} data={data} />
          </div>
          <Button fullWidth variant="outlined">
            Tambah Penyesuaian
          </Button>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <div className="flex">
          <Button onClick={() => back()} variant="secondary" className="mr-4">
            Batalkan
          </Button>
          <Button type="submit">Tambah Barang</Button>
        </div>
      </div>
    </CardDashboard>
  );
};

export default AdjustStockPage;
