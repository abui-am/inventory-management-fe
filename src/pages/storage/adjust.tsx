import { useFormik } from 'formik';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { Option } from 'react-select/src/filters';
import { object } from 'yup';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { DatePickerComponent, TextArea, TextField, ThemedSelect } from '@/components/Form';
import Modal from '@/components/Modal';
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
            onChange={(date) => setFieldValue('dateIn', date)}
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
          <ButtonWithModal />
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

const ButtonWithModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  const initialValues: Omit<AdjustStockTableValue, 'name' | 'buyPrice' | 'discount' | 'qty'> & {
    buyPrice: number | string;
    discount: number | string;
    name: Partial<Option>;
    qty: number | string;
  } = {
    name: {},
    buyPrice: '',
    discount: '',
    qty: '',
    unit: '',
    memo: '',
  };

  const { values, handleChange, setSubmitting, handleSubmit, setFieldValue } = useFormik({
    validationSchema: object().shape(createSchema(initialValues)),
    initialValues,
    onSubmit: async (values) => {},
  });

  return (
    <>
      <Button fullWidth variant="outlined" onClick={() => setIsOpen(true)}>
        Tambah Penyesuaian
      </Button>
      <Modal isOpen={isOpen} onRequestClose={() => setIsOpen(false)}>
        <form onSubmit={handleSubmit}>
          <section className="max-w-4xl mr-auto ml-auto">
            <div className="mb-4">
              <h6 className="mb-3 text-lg font-bold">Informasi Umum</h6>
              <div className="flex -mx-2 flex-wrap mb-1">
                <div className="w-full mb-3 px-2">
                  <label className="mb-1 inline-block">Nomor faktur</label>
                  <ThemedSelect
                    variant="outlined"
                    options={[{ label: 'Minyak', value: 'minyak' }]}
                    value={values.name}
                  />
                </div>
                <div className="w-8/12 mb-3 px-2">
                  <label className="mb-1 inline-block">Harga beli</label>
                  <TextField name="buyPrice" value={values.buyPrice} onChange={handleChange} />
                </div>
                <div className="w-4/12 mb-3 px-2">
                  <label className="mb-1 inline-block">Diskon</label>
                  <TextField name="discount" value={values.discount} onChange={handleChange} />
                </div>
                <div className="w-8/12 mb-3 px-2">
                  <label className="mb-1 inline-block">Qty</label>
                  <TextField name="qty" value={values.qty} onChange={handleChange} />
                </div>
                <div className="w-4/12 mb-3 px-2">
                  <label className="mb-1 inline-block">Unit satuan</label>
                  <TextField name="unit" value={values.unit} onChange={handleChange} />
                </div>
                <div className="w-full mb-3 px-2">
                  <label className="mb-1 inline-block">Keterangan</label>
                  <TextArea name="memo" value={values.memo} onChange={handleChange} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="secondary" className="mr-3">
                  Batalkan
                </Button>
                <Button variant="primary">Tambah Penyesuaian</Button>
              </div>
            </div>
          </section>
        </form>
      </Modal>
    </>
  );
};

export default AdjustStockPage;
