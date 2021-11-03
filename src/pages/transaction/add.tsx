import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { Pencil, Trash } from 'react-bootstrap-icons';
import { object } from 'yup';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import {
  DatePickerComponent,
  SelectItems,
  SelectSupplier,
  TextArea,
  TextField,
  ThemedSelect,
  WithLabelAndError,
} from '@/components/Form';
import Modal from '@/components/Modal';
import Table from '@/components/Table';
import { INVOICE_TYPE_OPTIONS, PAYMENT_METHOD_OPTIONS } from '@/constants/options';
import { Option } from '@/typings/common';
import createSchema from '@/utils/validation/formik';

export type AddStockInTableValue = {
  item_name: string;
  qty: number;
  buyPrice: number;
  discount: number;
  unit: string;
  memo: string;
  paymentMethod: string;
  paymentDue: Date;
  supplier: Option;
};

const AddStockPage: NextPage = () => {
  const { back } = useRouter();
  const initialValues = {
    payAmount: 0,
    dateIn: new Date(),
    stockAdjustment: [] as ButtonWithModalFormValues[],
    memo: '',
    paymentMethod: PAYMENT_METHOD_OPTIONS[0],
    paymentDue: new Date(),
    customer: {} as Option<unknown>,
    sender: {} as Option<unknown>,
    isNewSupplier: false,
  };
  const { values, handleChange, errors, isSubmitting, setFieldValue, touched, handleSubmit } = useFormik({
    validationSchema: object().shape(createSchema(initialValues)),
    initialValues,
    onSubmit: async ({}) => {
      const jsonBody = {};
    },
  });

  const data = values.stockAdjustment.map(({ item, qty, buyPrice, discount, unit, memo, isNew }) => ({
    col1: item?.label ?? '',
    col2: qty,
    col3: buyPrice,
    col4: discount,
    col5: unit,
    col6: memo,
    action: (
      <div className="flex">
        <ButtonWithModal
          initialValues={{ item, qty, buyPrice, discount, unit, memo, isNew }}
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
    <CardDashboard title="Tambah Transaksi Penjualan">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap -mx-2 mb-8">
          <div className="w-6/12 px-2 mb-3">
            <WithLabelAndError touched={touched} errors={errors} name="customer" label="Nama Customer">
              <SelectSupplier
                onChange={(val, action) => {
                  setFieldValue('customer', val);
                  setFieldValue('isNewSupplier', action.action === 'create-option');
                }}
                value={values.customer}
              />
            </WithLabelAndError>
          </div>

          <div className="w-6/12 px-2 mb-3">
            <WithLabelAndError touched={touched} errors={errors} name="sender" label="Nama Pengirim">
              <SelectSupplier
                onChange={(val, action) => {
                  setFieldValue('sender', val);
                }}
                value={values.sender}
              />
            </WithLabelAndError>
          </div>

          <div className="w-4/12 px-2 mb-3">
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
          <div className="w-4/12 px-2 mb-3">
            <label className="mb-1 inline-block">Uang yang dibayarkan</label>
            <TextField
              id="payAmount"
              name="payAmount"
              value={values.payAmount}
              placeholder="Masukan catatan"
              disabled={isSubmitting}
              onChange={handleChange}
              hasError={!!errors.memo}
            />
            {errors.memo && touched.memo && <span className="text-xs text-red-500">{errors.payAmount}</span>}
          </div>

          <div className="w-4/12 px-2 mb-3">
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
            {errors.memo && touched.memo && <span className="text-xs text-red-500">{errors.memo}</span>}
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
                onChange={(val) => {
                  setFieldValue('paymentMethod', val);
                }}
                value={values.paymentMethod}
                additionalStyle={{
                  control: (provided) => ({ ...provided, minWidth: 240 }),
                }}
                options={PAYMENT_METHOD_OPTIONS}
              />
              {values.paymentMethod.value === PAYMENT_METHOD_OPTIONS[1].value && (
                <DatePickerComponent
                  name="paymentDue"
                  selected={values.paymentDue}
                  onChange={(date) => setFieldValue('paymentDue', date)}
                />
              )}
            </div>
          </div>

          <div className="flex items-end">
            <Button onClick={() => back()} variant="secondary" className="mr-4">
              Batalkan
            </Button>
            <Button type="submit">Simpan Transaksi</Button>
          </div>
        </div>
      </form>
    </CardDashboard>
  );
};

type ButtonWithModalFormValues = {
  item: Record<string, unknown>;
  discount: number;
  qty: number;
  sellPrice: number;
  stock: number;
  isNew: boolean;
};

const ButtonWithModal: React.FC<{
  onSave: (values: ButtonWithModalFormValues) => void;
  initialValues?: ButtonWithModalFormValues;
  withEditButton?: boolean;
}> = ({ onSave, initialValues: initVal, withEditButton }) => {
  const [isOpen, setIsOpen] = useState(false);

  const items = [
    {
      item: { label: 'Roti' },
      discount: 0,
      qty: 0,
      sellPrice: 0,
      stock: 0,
      isNew: false,
    },
  ];

  const initialValues: ButtonWithModalFormValues = initVal || {
    item: {},
    discount: 0,
    qty: 0,
    sellPrice: 0,
    stock: 0,
    isNew: false,
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

  const data = items.map(({ item, qty, sellPrice, discount }) => ({
    col1: item?.label ?? '',
    col2: qty,
    col3: sellPrice,
    col4: discount,
    col5: sellPrice * qty,
    action: (
      <div className="flex">
        <Button variant="secondary">
          <Pencil width={24} height={24} />
        </Button>
        <Button variant="secondary">
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
        Header: 'Harga jual',
        accessor: 'col3',
      },
      {
        Header: 'Diskon',
        accessor: 'col4',
      },
      {
        Header: 'Total harga',
        accessor: 'col5',
      },
      {
        Header: 'Aksi',
        accessor: 'action',
      },
    ],
    []
  );

  return (
    <>
      <Button fullWidth variant="outlined" onClick={() => setIsOpen(true)}>
        Tambah Barang
      </Button>

      <Modal isOpen={isOpen} onRequestClose={() => setIsOpen(false)} variant="large">
        <form onSubmit={handleSubmit}>
          <section className="max-w-4xl mr-auto ml-auto">
            <div>
              <h6 className="mb-4 mt-2 text-2xl font-bold">Informasi Umum</h6>
              <div className="flex -mx-2 flex-wrap mb-1">
                <div className="w-full mb-3 px-2">
                  <WithLabelAndError label="Nama barang" name="item" errors={errors} touched={touched}>
                    <SelectItems
                      onChange={(val) => {
                        setFieldValue('item', val);
                        setFieldValue('sell ice', val?.data?.sellPrice ?? 0);
                        setFieldValue('stock', val?.data?.qty ?? 0);
                      }}
                      value={values.item}
                    />
                  </WithLabelAndError>
                </div>
                <div className="w-8/12 mb-3 px-2">
                  <WithLabelAndError label="Harga jual" name="sellPrice" errors={errors} touched={touched}>
                    <TextField
                      disabled
                      name="sellPrice"
                      value={values.sellPrice}
                      onChange={handleChange}
                      type="number"
                    />
                  </WithLabelAndError>
                </div>
                <div className="w-4/12 mb-3 px-2">
                  <WithLabelAndError label="Stock" name="stock" errors={errors} touched={touched}>
                    <TextField disabled name="stock" value={values.stock} onChange={handleChange} type="number" />
                  </WithLabelAndError>
                </div>
                <div className="w-8/12 mb-3 px-2">
                  <WithLabelAndError label="Qty" name="qty" errors={errors} touched={touched}>
                    <TextField name="qty" value={values.qty} onChange={handleChange} type="number" />
                  </WithLabelAndError>
                </div>
                <div className="w-4/12 mb-3 px-2">
                  <WithLabelAndError label="Diskon" name="discount" errors={errors} touched={touched}>
                    <TextField name="discount" value={values.discount} onChange={handleChange} />
                  </WithLabelAndError>
                </div>
              </div>
              <Button variant="outlined" fullWidth className="mb-4">
                Tambah Barang
              </Button>

              <div className="mb-4">
                <Table columns={columns} data={data} />
              </div>

              <div className="flex justify-end">
                <Button variant="secondary" className="mr-3">
                  Batalkan
                </Button>
                <Button variant="primary" type="submit">
                  Simpan
                </Button>
              </div>
            </div>
          </section>
        </form>
      </Modal>
    </>
  );
};

export default AddStockPage;
