import { useFormik } from 'formik';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { Pencil, Trash } from 'react-bootstrap-icons';
import { Option } from 'react-select/src/filters';
import { object } from 'yup';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { DatePickerComponent, TextArea, TextField, ThemedSelect, WithLabelAndError } from '@/components/Form';
import Modal from '@/components/Modal';
import Table from '@/components/Table';
import { INVOICE_TYPE_OPTIONS } from '@/constants/options';
import createSchema from '@/utils/validation/formik';

export type AdjustStockTableValue = {
  item_name: string;
  qty: number;
  buyPrice: number;
  discount: number;
  unit: string;
  memo: string;
  paymentMethod: string;
  paymentDue: Date;
};

const AdjustStockPage: NextPage = () => {
  const { back } = useRouter();
  const initialValues = {
    invoiceNumber: '',
    invoiceType: INVOICE_TYPE_OPTIONS[0],
    dateIn: new Date(),
    stockAdjustment: [] as ButtonWithModalFormValues[],
    memo: '',
    paymentMethod: { label: 'Cash', value: 'cash' },
    paymentDue: new Date(),
  };
  const { values, handleChange, errors, isSubmitting, setFieldValue } = useFormik({
    validationSchema: object().shape(createSchema(initialValues)),
    initialValues,
    onSubmit: async () => {
      return '';
    },
  });

  const data = values.stockAdjustment.map(({ item, qty, buyPrice, discount, unit, memo }) => ({
    col1: item?.label ?? '',
    col2: qty,
    col3: buyPrice,
    col4: discount,
    col5: unit,
    col6: memo,
    action: (
      <div className="flex">
        <ButtonWithModal
          initialValues={{ item, qty, buyPrice, discount, unit, memo }}
          withEditButton
          onSave={(val) => {
            // replace data
            const newValues = values.stockAdjustment.map((stock) => {
              if (stock.item.value === item.value) {
                return val;
              }
              return stock;
            });

            setFieldValue('stockAdjustment', newValues);
          }}
        />
        <Button
          variant="secondary"
          onClick={() =>
            setFieldValue(
              'stockAdjustment',
              values.stockAdjustment.filter((stock) => stock.item.value !== item.value)
            )
          }
        >
          <Trash width={24} height={24} />
        </Button>
      </div>
    ),
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
      {
        Header: 'Aksi',
        accessor: 'action',
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
          <ButtonWithModal onSave={(data) => setFieldValue('stockAdjustment', [...values.stockAdjustment, data])} />
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <div className="mr-4">
          <label className="mb-1 block">Metode pembayaran</label>
          <div className="flex">
            <ThemedSelect
              className="mr-4"
              variant="contained"
              name="paymentMethod"
              value={values.paymentMethod}
              additionalStyle={{
                control: (provided) => ({ ...provided, minWidth: 240 }),
              }}
              options={[
                { label: 'Cash', value: 'cash' },
                {
                  label: 'Bond',
                  value: 'bond',
                },
              ]}
            />
            <DatePickerComponent
              name="paymentDue"
              selected={values.paymentDue}
              onChange={(date) => setFieldValue('paymentDue', date)}
            />
          </div>
        </div>

        <div className="flex items-end">
          <Button onClick={() => back()} variant="secondary" className="mr-4">
            Batalkan
          </Button>
          <Button type="submit">Tambah Barang</Button>
        </div>
      </div>
    </CardDashboard>
  );
};

type ButtonWithModalFormValues = Omit<
  AdjustStockTableValue,
  'paymentDue' | 'paymentMethod' | 'item_name' | 'buyPrice' | 'discount' | 'qty'
> & {
  buyPrice: number | string;
  discount: number | string;
  item: Partial<Option>;
  qty: number | string;
};

const ButtonWithModal: React.FC<{
  onSave: (values: ButtonWithModalFormValues) => void;
  initialValues?: ButtonWithModalFormValues;
  withEditButton?: boolean;
}> = ({ onSave, initialValues: initVal, withEditButton }) => {
  const [isOpen, setIsOpen] = useState(false);

  const initialValues: ButtonWithModalFormValues = initVal || {
    item: {},
    buyPrice: '',
    discount: '',
    qty: '',
    unit: '',
    memo: '',
  };

  const { values, handleChange, handleSubmit, setFieldValue, errors, touched } = useFormik({
    validationSchema: object().shape(createSchema(initialValues)),
    initialValues,
    enableReinitialize: !!initVal,
    onSubmit: async (values, { resetForm }) => {
      if (onSave) {
        onSave(values);
      }
      resetForm();
      setIsOpen(false);
    },
  });

  return (
    <>
      {withEditButton ? (
        <Button variant="secondary" onClick={() => setIsOpen(true)}>
          <Pencil width={24} height={24} />
        </Button>
      ) : (
        <Button fullWidth variant="outlined" onClick={() => setIsOpen(true)}>
          Tambah Penyesuaian
        </Button>
      )}
      <Modal isOpen={isOpen} onRequestClose={() => setIsOpen(false)}>
        <form onSubmit={handleSubmit}>
          <section className="max-w-4xl mr-auto ml-auto">
            <div>
              <h6 className="mb-4 mt-2 text-2xl font-bold">Informasi Umum</h6>
              <div className="flex -mx-2 flex-wrap mb-1">
                <div className="w-full mb-3 px-2">
                  <WithLabelAndError label="Nama barang" name="item" errors={errors} touched={touched}>
                    <ThemedSelect
                      variant="outlined"
                      options={[
                        { label: 'Minyak', value: 'minyak' },
                        { label: 'Telur', value: 'telur' },
                      ]}
                      value={values.item}
                      onChange={(value) => setFieldValue('item', value)}
                    />
                  </WithLabelAndError>
                </div>
                <div className="w-8/12 mb-3 px-2">
                  <WithLabelAndError label="Harga beli" name="buyPrice" errors={errors} touched={touched}>
                    <TextField name="buyPrice" value={values.buyPrice} onChange={handleChange} type="number" />
                  </WithLabelAndError>
                </div>
                <div className="w-4/12 mb-3 px-2">
                  <WithLabelAndError label="Diskon" name="discount" errors={errors} touched={touched}>
                    <TextField name="discount" value={values.discount} onChange={handleChange} type="number" />
                  </WithLabelAndError>
                </div>
                <div className="w-8/12 mb-3 px-2">
                  <WithLabelAndError label="Qty" name="qty" errors={errors} touched={touched}>
                    <TextField name="qty" value={values.qty} onChange={handleChange} type="number" />
                  </WithLabelAndError>
                </div>
                <div className="w-4/12 mb-3 px-2">
                  <WithLabelAndError label="Unit satuan" name="unit" errors={errors} touched={touched}>
                    <TextField name="unit" value={values.unit} onChange={handleChange} />
                  </WithLabelAndError>
                </div>
                <div className="w-full mb-3 px-2">
                  <WithLabelAndError label="Keterangan" name="memo" errors={errors} touched={touched}>
                    <TextArea name="memo" value={values.memo} onChange={handleChange} />
                  </WithLabelAndError>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="secondary" className="mr-3">
                  Batalkan
                </Button>
                <Button variant="primary" type="submit">
                  {withEditButton ? 'Tambah Penyesuaian' : 'Edit Penyesuaian'}
                </Button>
              </div>
            </div>
          </section>
        </form>
      </Modal>
    </>
  );
};

export default AdjustStockPage;
