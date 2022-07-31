import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { Pencil, Trash } from 'react-bootstrap-icons';

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
  const { mutateAsync } = useCreateStockIn();
  const { mutateAsync: createItem } = useCreateItems();
  const { push } = useRouter();

  const initialValues = {
    invoiceNumber: '',
    invoiceType: INVOICE_TYPE_OPTIONS[0],
    dateIn: new Date(),
    stockAdjustment: [] as ButtonWithModalFormValues[],
    memo: '',
    paymentMethod: PAYMENT_METHOD_OPTIONS[0],
    paymentDue: new Date(),
    supplier: null as Option<unknown> | null,
    isNewSupplier: false,
  };
  const { values, handleChange, errors, isSubmitting, setFieldValue, touched, handleSubmit } = useFormik({
    validationSchema: validationSchemaStockIn,
    initialValues,
    onSubmit: async ({
      dateIn,
      invoiceNumber,
      invoiceType,
      memo,
      paymentMethod,
      paymentDue,
      stockAdjustment,
      supplier,
    }) => {
      const newItem = await promiseAll<Item>(
        stockAdjustment.map(async ({ isNew, unit, item, buyPrice, memo, qty, discount, itemId }): Promise<Item> => {
          const baseData = {
            note: memo,
            purchase_price: +buyPrice ?? 0,
            quantity: +qty ?? 0,
            discount: +discount,
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
      const jsonBody: CreateStockInBody = {
        transactionable_type: 'suppliers',
        purchase_date: dayjs(dateIn).format('YYYY-MM-DD HH:mm:ss'),
        invoice_number: invoiceType.value === 'automatic' ? null : invoiceNumber,
        note: memo,
        payment_method: paymentMethod.value,
        items: newItem.results,
        transactionable_id: supplierId,

        payment: {
          maturity_date:
            paymentMethod.value !== 'cash'
              ? dayjs(paymentDue).format('YYYY-MM-DD HH:mm:ss')
              : dayjs().format('YYYY-MM-DD HH:mm:ss'),
        },
      };

      try {
        await mutateAsync(jsonBody);
        push('/stock-in');
      } catch (e) {
        console.error(e);
      }
    },
  });

  const data = values.stockAdjustment.map(({ item, qty, buyPrice, discount, unit, memo, isNew, itemId }) => ({
    col1: item?.label ?? '',
    col2: qty,
    col3: buyPrice,
    col4: discount,
    col5: unit,
    col6: memo,
    action: (
      <div className="flex">
        <ButtonWithModal
          initialValues={{ item, qty, buyPrice, discount, unit, memo, isNew, itemId }}
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
    <CardDashboard title="Barang Masuk Baru">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap -mx-2 mb-8">
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
            <ButtonWithModal onSave={(data) => setFieldValue('stockAdjustment', [...values.stockAdjustment, data])} />
            {errors.stockAdjustment && touched.stockAdjustment && (
              <span className="text-xs text-red-500">{errors.stockAdjustment}</span>
            )}
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
              {(values.paymentMethod.value === PAYMENT_METHOD_OPTIONS[1].value ||
                values.paymentMethod.value === PAYMENT_METHOD_OPTIONS[2].value) && (
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
            <Button type="submit">Tambah Barang</Button>
          </div>
        </div>
      </form>
    </CardDashboard>
  );
};

type ButtonWithModalFormValues = Omit<
  AddStockInTableValue,
  'paymentDue' | 'paymentMethod' | 'item_name' | 'buyPrice' | 'discount' | 'qty' | 'supplier'
> & {
  buyPrice: number | string;
  discount: number | string;
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
    discount: '',
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
                  <WithLabelAndError label="ID Barang" name="itemId" errors={errors} touched={touched}>
                    <TextField name="itemId" value={values.itemId} disabled={!values?.isNew} onChange={handleChange} />
                  </WithLabelAndError>
                </div>

                <div className="w-full mb-3 px-2">
                  <span className="block">Harga jual sebelumnya:</span>
                  <span className="text-xl font-bold">
                    {itemData?.data?.item?.sell_price ? formatToIDR(itemData?.data?.item?.sell_price ?? 0) : '-'}
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
                <div className="w-4/12 mb-3 px-2">
                  <WithLabelAndError label="Diskon" name="discount" errors={errors} touched={touched}>
                    <CurrencyTextField
                      name="discount"
                      value={values.discount}
                      onChange={(val) => {
                        setFieldValue('discount', val);
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

export default AddStockPage;
