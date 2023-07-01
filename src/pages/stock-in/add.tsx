import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Trash } from 'react-bootstrap-icons';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import {
  CurrencyTextField,
  DatePickerComponent,
  SelectItems,
  TextArea,
  TextField,
  ThemedSelect,
  WithLabelAndError,
} from '@/components/Form';
import Label from '@/components/Label';
import Modal from '@/components/Modal';
import { SelectSupplier } from '@/components/Select';
import Table from '@/components/Table';
import PaymentMethod, { Payment } from '@/components/transaction/PaymentMethod';
import { INVOICE_TYPE_OPTIONS, PAYMENT_METHOD_OPTIONS } from '@/constants/options';
import { useCreateItems } from '@/hooks/mutation/useMutateItems';
import { useCreateStockIn } from '@/hooks/mutation/useMutateStockIn';
import { useFetchItemById } from '@/hooks/query/useFetchItem';
import { Option } from '@/typings/common';
import { CreateStockInBody, Item } from '@/typings/stock-in';
import { formatToIDR } from '@/utils/format';
import promiseAll from '@/utils/promiseAll';
import { validationSchemaStockIn, validationSchemaStockInItem } from '@/utils/validation/stock-in';

export type AddStockInTableValue = {
  item_name: string;
  qty: number;
  buyPrice: number;
  discount: number;
  unit: string;
  memo: string;
  paymentMethod: string;
  paymentDue: Date;
  supplier: Option | null;
};

const AddStockPage: NextPage = () => {
  const { back } = useRouter();
  const { mutateAsync, isLoading } = useCreateStockIn();
  const { mutateAsync: createItem, isLoading: isLoadingItem } = useCreateItems();
  const { push } = useRouter();

  const initialValues = {
    invoiceNumber: '',
    invoiceType: INVOICE_TYPE_OPTIONS[0],
    dateIn: new Date(),
    stockAdjustment: [] as ButtonWithModalFormValues[],
    memo: '',
    payments: [
      {
        paymentMethod: PAYMENT_METHOD_OPTIONS[0],
        paymentDue: new Date(),
      },
    ] as Payment[],
    supplier: null as Option<unknown> | null,
    isNewSupplier: false,
    payFull: false,
  };
  const { values, handleChange, errors, isSubmitting, setFieldValue, touched, handleSubmit } = useFormik({
    validationSchema: validationSchemaStockIn,
    initialValues,
    onSubmit: async ({ dateIn, invoiceNumber, invoiceType, memo, payments, stockAdjustment, supplier }) => {
      const newItem = await promiseAll<Item>(
        stockAdjustment.map(async ({ isNew, unit, item, buyPrice, memo, qty, itemId }): Promise<Item> => {
          const baseData = {
            note: memo,
            purchase_price: +buyPrice ?? 0,
            quantity: +qty ?? 0,
            item_id: itemId,
          };
          if (!isNew) return { id: item?.value ?? '', ...baseData };
          const { data } = await createItem({ name: item?.label ?? '', unit, item_id: itemId });
          return {
            id: data.item.id,
            ...baseData,
          };
        })
      );

      const supplierId = supplier?.value ?? '';

      // If payFull is true, then we will use the first payment method (only one payment method allowed)
      const paymentsPayload = values.payFull
        ? [
            {
              payment_method: values.payments?.[0]?.paymentMethod?.value,
              maturity_date:
                values.payments?.[0]?.paymentMethod?.value !== 'cash' &&
                values.payments?.[0]?.paymentMethod?.value !== 'bank'
                  ? dayjs(values.payments?.[0]?.paymentDue).format('YYYY-MM-DD HH:mm:ss')
                  : undefined,
              cash: totalPrice,
              change: 0,
            },
          ]
        : payments.map(({ paymentMethod, paymentDue, payAmount }) => ({
            payment_method: paymentMethod.value,
            maturity_date:
              paymentMethod.value !== 'cash' && paymentMethod.value !== 'bank'
                ? dayjs(paymentDue).format('YYYY-MM-DD HH:mm:ss')
                : undefined,
            cash: +(payAmount ?? 0),
            change: 0,
          }));
      const jsonBody: CreateStockInBody = {
        transactionable_type: 'suppliers',
        purchase_date: dayjs(dateIn).format('YYYY-MM-DD HH:mm:ss'),
        invoice_number: invoiceType.value === 'automatic' ? null : invoiceNumber,
        note: memo,
        items: newItem.results,
        transactionable_id: supplierId,
        payments: paymentsPayload,
      };

      try {
        // find index where payment method is cash
        const cashIndex = values.payments.findIndex((val) => val.paymentMethod.value === 'cash');

        const totalPrice = values.stockAdjustment.reduce((acc, curr) => {
          const { qty, buyPrice } = curr;
          return acc + +qty * +buyPrice;
        }, 0);

        if (cashIndex !== -1) {
          jsonBody.payments[cashIndex].change =
            jsonBody.payments.reduce((acc, val) => acc + (val?.cash ?? 0), 0) - totalPrice;
        }
        await mutateAsync(jsonBody);
        push('/stock-in');
      } catch (e) {
        console.error(e);
      }
    },
  });

  const data = values.stockAdjustment.map(({ item, qty, buyPrice, unit, memo, isNew, itemId }) => ({
    col1: item?.label ?? '',
    col2: (
      <div>
        <b className="text-sm">Jumlah :</b>
        <p>
          {qty} ({unit})
        </p>
        <b className="text-sm">Harga per unit:</b>
        <span className="text-base block">{formatToIDR(+buyPrice)}</span>
      </div>
    ),
    col6: memo,
    action: (
      <div className="flex">
        <ButtonWithModal
          initialValues={{ item, qty, buyPrice, unit, memo, isNew, itemId }}
          withEditButton
          onSave={(val) => {
            // replace data
            const newValues = values.stockAdjustment.map((stock) => {
              if (stock?.item?.value === item?.value) {
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
              values.stockAdjustment.filter((stock) => stock?.item?.value !== item?.value)
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
        width: '20%',
      },
      {
        Header: 'Jumlah & Harga',
        accessor: 'col2',
        width: '40%',
      },

      {
        Header: 'Catatan',
        accessor: 'col6',
        width: '20%',
      },
      {
        Header: 'Aksi',
        accessor: 'action',
        width: '20%',
      },
    ],
    []
  );

  const totalPrice = useMemo(
    () =>
      values.stockAdjustment.reduce((acc, curr) => {
        const { qty, buyPrice } = curr;
        return acc + +qty * +buyPrice;
      }, 0),
    [values.stockAdjustment]
  );

  return (
    <CardDashboard title="Barang Masuk Baru">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap -mx-2 mb-8">
          <div className="w-8/12 pr-4 mb-4">
            <div className="flex flex-wrap ">
              <div className="w-6/12 px-2 mb-3">
                <Label required>Nomor faktur</Label>
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
                      value={values.invoiceType.value === INVOICE_TYPE_OPTIONS[1].value ? '' : values.invoiceNumber}
                      placeholder={
                        values.invoiceType.value === INVOICE_TYPE_OPTIONS[1].value
                          ? '(Generate otomatis)'
                          : 'Masukan nomor faktur'
                      }
                      autoComplete="invoiceNumber"
                      disabled={isSubmitting || values.invoiceType.value === INVOICE_TYPE_OPTIONS[1].value}
                      onChange={handleChange}
                      hasError={!!errors.invoiceNumber && touched.invoiceNumber}
                    />
                  </div>
                </div>
                {errors.invoiceType && touched.invoiceType && (
                  <span className="text-xs text-red-500">{errors.invoiceType}</span>
                )}

                {errors.invoiceNumber && touched.invoiceNumber && (
                  <span className="text-xs text-red-500">{errors.invoiceNumber}</span>
                )}
              </div>
              <div className="w-6/12 px-2 mb-3" />
              <div className="w-6/12 px-2 mb-3">
                <WithLabelAndError required touched={touched} errors={errors} name="supplier" label="Nama Supplier">
                  <SelectSupplier
                    onChange={(val, action) => {
                      setFieldValue('supplier', val);
                      setFieldValue('isNewSupplier', action.action === 'create-option');
                    }}
                    value={values.supplier}
                  />
                </WithLabelAndError>
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
                {errors.memo && touched.memo && <span className="text-xs text-red-500">{errors.memo}</span>}
              </div>

              <div className="w-full px-2 mb-3">
                <div className="mb-4">
                  <Table columns={columns} data={data} />
                </div>
                <ButtonWithModal
                  onSave={(data) => setFieldValue('stockAdjustment', [...values.stockAdjustment, data])}
                />
                {errors.stockAdjustment && touched.stockAdjustment && (
                  <span className="text-xs text-red-500">{errors.stockAdjustment}</span>
                )}
              </div>
            </div>
          </div>
          <div className="w-4/12">
            <div className="border p-4 rounded-md shadow-md flex flex-wrap mb-4">
              <div className="w-full px-2 mb-3">
                <label className="mb-1 inline-block">Harga total</label>
                <p className="text-2xl font-bold">{formatToIDR(totalPrice)}</p>
              </div>

              <div className="px-2 mb-2">
                <span className="text-lg font-bold">Pembayaran</span>
              </div>

              {values?.payments?.map((value, idx) => {
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <div className="pt-3 pb-3 flex flex-wrap" key={`${value.paymentMethod.value}-${idx}`}>
                    <PaymentMethod
                      errors={errors}
                      touched={touched}
                      isSubmitting={isSubmitting}
                      values={values}
                      setFieldValue={setFieldValue}
                      index={idx}
                      totalPrice={totalPrice}
                      withPayFull
                    />
                  </div>
                );
              })}
              {!values.payFull && values?.payments?.length < 2 && (
                <Button
                  variant="outlined"
                  className="w-full mt-2"
                  Icon={<Plus width={24} height={24} />}
                  onClick={() => {
                    setFieldValue('payments', [
                      ...values.payments,
                      {
                        paymentMethod: PAYMENT_METHOD_OPTIONS?.filter(
                          (val) => val.value !== values?.payments?.[0]?.paymentMethod?.value
                        )[0],
                        payAmount: values?.payments?.[0] ? totalPrice - +(values?.payments?.[0]?.payAmount ?? 0) : null,
                        paymentDue: null,
                      },
                    ]);
                  }}
                >
                  Tambah metode pembayaran
                </Button>
              )}

              <div className="flex items-end mt-8">
                <Button onClick={() => back()} variant="secondary" className="mr-4">
                  Batalkan
                </Button>
                <Button disabled={isLoading || isLoadingItem} type="submit">
                  Bayar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </CardDashboard>
  );
};

type ButtonWithModalFormValues = Omit<
  AddStockInTableValue,
  'paymentDue' | 'paymentMethod' | 'item_name' | 'discount' | 'buyPrice' | 'qty' | 'supplier'
> & {
  buyPrice: number | string;
  item: Partial<Option<Item>> | null;
  qty: number | string;
  isNew: boolean;
  itemId: string;
};

const ButtonWithModal: React.FC<{
  onSave: (values: ButtonWithModalFormValues) => void;
  initialValues?: ButtonWithModalFormValues;
  withEditButton?: boolean;
}> = ({ onSave, initialValues: initVal, withEditButton }) => {
  const [isOpen, setIsOpen] = useState(false);

  const initialValues: ButtonWithModalFormValues = initVal || {
    item: null,
    buyPrice: '',
    qty: '',
    unit: '',
    memo: '',
    isNew: false,
    itemId: '',
  };

  const { values, handleChange, handleSubmit, setFieldValue, errors, touched } = useFormik({
    validationSchema: validationSchemaStockInItem,
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

  const { data: itemData } = useFetchItemById(values?.item?.value ?? '');

  return (
    <>
      {withEditButton ? (
        <Button variant="secondary" onClick={() => setIsOpen(true)}>
          <Pencil width={24} height={24} />
        </Button>
      ) : (
        <Button fullWidth variant="outlined" onClick={() => setIsOpen(true)}>
          Tambah Barang
        </Button>
      )}
      <Modal isOpen={isOpen} onRequestClose={() => setIsOpen(false)} variant="big">
        <form onSubmit={handleSubmit}>
          <section className="max-w-4xl mr-auto ml-auto">
            <div>
              <h6 className="mb-4 mt-2 text-2xl font-bold">Informasi Barang</h6>
              <div className="flex -mx-2 flex-wrap mb-1">
                <div className="w-8/12 mb-3 px-2">
                  <WithLabelAndError required label="Nama barang" name="item" errors={errors} touched={touched}>
                    <SelectItems
                      onChange={(val, action) => {
                        setFieldValue('item', val);
                        setFieldValue('itemId', val?.data?.item_id);

                        setFieldValue('unit', val?.data?.unit ?? '');
                        setFieldValue('isNew', action.action === 'create-option');
                      }}
                      value={values.item}
                    />
                  </WithLabelAndError>
                </div>
                <div className="w-4/12 mb-3 px-2">
                  <WithLabelAndError label="ID Barang" name="itemId" errors={errors} touched={touched} required>
                    <TextField name="itemId" value={values.itemId} onChange={handleChange} />
                  </WithLabelAndError>
                </div>

                <div className="w-full mb-3 px-2">
                  <span className="block">Harga beli sebelumnya:</span>
                  <span className="text-xl font-bold">
                    {itemData?.data?.item?.buy_price ? formatToIDR(itemData?.data?.item?.buy_price ?? 0) : '-'}
                  </span>
                </div>
                <div className="w-8/12 mb-3 px-2">
                  <WithLabelAndError required label="Harga beli" name="buyPrice" errors={errors} touched={touched}>
                    <CurrencyTextField
                      name="buyPrice"
                      value={values.buyPrice}
                      onChange={(val) => {
                        setFieldValue('buyPrice', val);
                      }}
                    />
                  </WithLabelAndError>
                </div>
                <div className="w-8/12 mb-3 px-2">
                  <WithLabelAndError required label="Qty" name="qty" errors={errors} touched={touched}>
                    <TextField name="qty" value={values.qty} onChange={handleChange} type="number" />
                  </WithLabelAndError>
                </div>
                <div className="w-4/12 mb-3 px-2">
                  <WithLabelAndError required label="Unit satuan" name="unit" errors={errors} touched={touched}>
                    <TextField name="unit" value={values.unit} disabled={!values?.isNew} onChange={handleChange} />
                  </WithLabelAndError>
                </div>
                <div className="w-full mb-3 px-2">
                  <WithLabelAndError label="Keterangan" name="memo" errors={errors} touched={touched}>
                    <TextArea name="memo" value={values.memo} onChange={handleChange} />
                  </WithLabelAndError>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  className="mr-3"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                >
                  Batalkan
                </Button>
                <Button variant="primary" type="submit">
                  {withEditButton ? 'Edit Penyesuaian' : 'Simpan Penyesuaian'}
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
