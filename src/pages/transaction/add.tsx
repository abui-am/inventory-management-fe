/* eslint-disable @typescript-eslint/no-unused-vars */
import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Trash } from 'react-bootstrap-icons';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { CurrencyTextField, DatePickerComponent, TextField, ThemedSelect, WithLabelAndError } from '@/components/Form';
import ItemToBuyForm, { ItemToBuyFormValues } from '@/components/form/ItemToBuyForm';
import Label from '@/components/Label';
import Modal, { ModalActionWrapper } from '@/components/Modal';
import { SelectCustomer, SelectSender } from '@/components/Select';
import Table from '@/components/Table';
import { PAYMENT_METHOD_OPTIONS } from '@/constants/options';
import { useCreateSale } from '@/hooks/mutation/useMutateSale';
import { Option } from '@/typings/common';
import { formatToIDR } from '@/utils/format';
import { validationSchemaTransaction } from '@/utils/validation/transaction';

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
  totalPrice: number;
};

export type Payment = {
  paymentMethod: Option;
  paymentDue: Date | string;
  payAmount: number | null;
};

export type AddStockValue = {
  dateIn: Date;
  stockAdjustment: ItemToBuyFormValues[];
  memo: string;
  payments: Payment[];
  discount: number | null;
  customer: Option<unknown> | null;
  sender: Option<unknown> | null;
  isNewSupplier: boolean;
  totalPrice: number;
};

const AddTransactionPage: NextPage = () => {
  const { mutateAsync } = useCreateSale();
  const initialValues = {
    dateIn: new Date(),
    stockAdjustment: [] as ItemToBuyFormValues[],
    memo: '',
    payments: [
      {
        payAmount: null,
        paymentMethod: PAYMENT_METHOD_OPTIONS[0],
        paymentDue: new Date(),
      },
    ] as Payment[],
    customer: null as Option<unknown> | null,
    sender: null as Option<unknown> | null,
    isNewSupplier: false,
    totalPrice: 0,
    discount: null as number | null,
  };
  const [editId, setEditId] = useState<string | null>(null);
  const [isOpenSummary, setIsOpenSummary] = useState(false);

  const { values, resetForm, handleChange, errors, isSubmitting, setFieldValue, touched, handleSubmit } = useFormik({
    validationSchema: validationSchemaTransaction,
    initialValues,
    validateOnChange: true,
    onSubmit: async (data, { setSubmitting }) => {
      try {
        setSubmitting(true);
        await mutateAsync({
          transactionable_type: 'customers',
          payments: data?.payments?.map((val) => ({
            payment_method: val?.paymentMethod.value,
            cash: +(val?.payAmount ?? '') ?? 0,
            change:
              val.paymentMethod.value === 'debt' || val?.paymentMethod.value === 'current_account'
                ? 0
                : +(val?.payAmount ?? '') - data.totalPrice,
            maturity_date:
              val?.paymentMethod.value !== 'cash'
                ? dayjs(val.paymentDue).format('YYYY-MM-DD HH:mm:ss')
                : dayjs().format('YYYY-MM-DD HH:mm:ss'),
          })),
          discount: data?.discount ?? 0,
          note: data.memo,
          sender_id: data.sender?.value ?? '',
          transactionable_id: data.customer?.value ?? '',
          purchase_date: dayjs(data.dateIn).format('YYYY-MM-DD HH:mm:ss'),
          invoice_number: '',
          items: data.stockAdjustment.map((value) => {
            return {
              id: value?.item?.value ?? '',
              purchase_price: value?.item?.data.sell_price ?? 0,
              quantity: +value.qty ?? 0,
              note: '',
            };
          }),
        });

        setSubmitting(false);

        setIsOpenSummary(true);
      } catch (e) {
        console.log(e);
      }
    },
  });

  const data = values?.stockAdjustment.map(({ item, qty, id }) => {
    return {
      col1: item?.label ?? '',
      col2: qty,
      price: (
        <div>
          <div>
            Harga beli: <b>{formatToIDR(+(item?.data?.sell_price ?? 0))}</b>
          </div>

          <div>
            Total: <b>{formatToIDR((item?.data?.sell_price ?? 0) * +qty)}</b>
          </div>
        </div>
      ),
      // col3: formatToIDR(+(item?.data?.sell_price ?? 0)),
      // col4: formatToIDR(+discount),
      // col5: formatToIDR(((item?.data?.sell_price ?? 0) - +discount) * +qty),
      action: (
        <div className="flex">
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setEditId(id);
            }}
            className="mr-4"
          >
            <Pencil width={24} height={24} />
          </Button>
          <Button
            variant="outlined"
            tabIndex={-1}
            onClick={() => {
              const newValue = values.stockAdjustment.filter((value) => value.id !== id);
              setFieldValue('stockAdjustment', newValue);
              setFieldValue(
                'totalPrice',
                newValue.reduce((prev, { item, qty }) => (item?.data?.sell_price ?? 0) * +qty + prev, 0)
              );
            }}
            size="small"
          >
            <Trash width={24} height={24} />
          </Button>
        </div>
      ),
    };
  });

  const columns = React.useMemo(
    () => [
      {
        Header: 'Nama barang',
        accessor: 'col1', // accessor is the "key" in the data
      },
      {
        Header: 'Qty',
        accessor: 'col2',
        width: '10%',
      },
      {
        Header: 'Harga',
        accessor: 'price',
        width: '40%',
      },
      {
        Header: 'Aksi',
        accessor: 'action',
      },
    ],
    []
  );
  return (
    <CardDashboard>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap -mx-2 mb-4">
          <div className="w-8/12 pr-8 flex flex-wrap mb-4">
            <div className="w-6/12 px-2 mb-3">
              <WithLabelAndError required touched={touched} errors={errors} name="customer" label="Nama Customer">
                <SelectCustomer
                  onChange={(val) => {
                    setFieldValue('customer', val);
                  }}
                  value={values.customer}
                />
              </WithLabelAndError>
            </div>

            <div className="w-6/12 px-2 mb-3">
              <label className="mb-1 inline-block">Tanggal penjualan</label>
              <DatePickerComponent
                id="dateIn"
                name="dateIn"
                selected={values.dateIn}
                disabled={isSubmitting}
                onChange={(date) => setFieldValue('dateIn', date)}
              />
              {errors.dateIn && <span className="text-xs text-red-500">{errors.dateIn}</span>}
            </div>

            <div className="w-full h-full mt-4 px-2 mb-3">
              <AddNewItem
                values={values.stockAdjustment}
                onSave={(data) => {
                  setFieldValue('stockAdjustment', data);
                  setFieldValue(
                    'totalPrice',
                    data.reduce((prev, { item, qty }) => (item?.data?.sell_price ?? 0) * +qty + prev, 0)
                  );
                }}
              />

              <div className="w-full px-2 mt-3">
                <Table columns={columns} data={data} />
              </div>
            </div>
          </div>

          <div className="w-4/12">
            <div className="border p-4 rounded-md shadow-md flex flex-wrap -mx-2 mb-4">
              <div className="w-full px-2 mb-3">
                <label className="mb-1 inline-block">Diskon</label>
                <CurrencyTextField
                  name="discount"
                  value={values.discount}
                  placeholder="Masukan diskon"
                  disabled={isSubmitting}
                  onChange={(val) => {
                    setFieldValue('discount', val);
                  }}
                />
                {errors.discount && touched.discount && <span className="text-xs text-red-500">{errors.discount}</span>}
              </div>

              <div className="w-full px-2 mb-3">
                <WithLabelAndError touched={touched} errors={errors} name="sender" label="Nama Pengirim" required>
                  <SelectSender
                    onChange={(val) => {
                      setFieldValue('sender', val);
                    }}
                    value={values.sender}
                  />
                </WithLabelAndError>
              </div>
              <div className="w-full px-2 mb-3">
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
                <label className="mb-1 inline-block">Harga total</label>
                <p className="text-2xl font-bold">{formatToIDR(values.totalPrice - (values?.discount ?? 0))}</p>
              </div>

              {values?.payments?.map((value, index) => {
                return (
                  <PaymentMethod
                    isSubmitting={isSubmitting}
                    setFieldValue={setFieldValue}
                    errors={errors}
                    touched={touched}
                    values={values}
                    index={index}
                    key={value.paymentMethod.value}
                  />
                );
              })}
              <Button
                Icon={<Plus width={24} height={24} />}
                onClick={() => {
                  setFieldValue('payments', [
                    ...values.payments,
                    {
                      paymentMethod: { value: 'cash', label: 'Cash' },
                      payAmount: 0,
                      paymentDue: null,
                    },
                  ]);
                }}
              >
                Tambah metode pembayaran
              </Button>

              <div className="w-full px-2 mb-3">
                <Button className="mt-4" fullWidth type="submit">
                  Simpan Transaksi
                </Button>
                <ModalSummary
                  onClose={() => {
                    setIsOpenSummary(false);
                    resetForm();
                  }}
                  isOpen={isOpenSummary}
                  values={values}
                />
                <ModalEditItem
                  onReset={() => {
                    setEditId(null);
                  }}
                  editId={editId ?? ''}
                  formikValues={values.stockAdjustment}
                  onClose={() => {
                    setEditId(null);
                  }}
                  onEdit={(editedData) => {
                    const editedValues = values?.stockAdjustment?.map((data) => {
                      if (data.id === editedData.id) {
                        return editedData;
                      }

                      return data;
                    });
                    setFieldValue('stockAdjustment', editedValues);

                    setFieldValue(
                      'totalPrice',
                      editedValues.reduce((prev, { item, qty }) => (item?.data?.sell_price ?? 0) * +qty + prev, 0)
                    );
                    setEditId(null);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </CardDashboard>
  );
};

const PaymentMethod: React.FC<{
  index: number;
  values: any;

  setFieldValue: (key: string, val: any) => void;
  isSubmitting: boolean;
  errors: Record<string, any>;
  touched: Record<string, any>;
}> = ({ index, values, setFieldValue, isSubmitting, errors, touched }) => {
  console.log(values);
  const value = values.payments[index];
  return (
    <>
      <div className="w-full px-2 mb-4 flex justify-between ">
        <div className="mr-4">
          <label className="mb-1 block">Metode pembayaran</label>
          <div className="flex">
            <ThemedSelect
              className="mr-4"
              variant="contained"
              name="paymentMethod"
              onChange={(val) => {
                setFieldValue(`payments.[${index}].paymentMethod`, val);
              }}
              value={value.paymentMethod}
              additionalStyle={{
                control: (provided) => ({ ...provided, minWidth: 240 }),
              }}
              options={PAYMENT_METHOD_OPTIONS}
            />
            {(value.paymentMethod === PAYMENT_METHOD_OPTIONS[1].value ||
              value.paymentMethod === PAYMENT_METHOD_OPTIONS[2].value) && (
              <DatePickerComponent
                name="paymentDue"
                selected={values.paymentDue}
                onChange={(date) => setFieldValue(`payments.[${index}].paymentDue`, date)}
              />
            )}
          </div>
        </div>
      </div>
      <div className="w-full px-2 mb-3">
        <Label required>Uang yang dibayarkan</Label>
        <CurrencyTextField
          id="payAmount"
          name="payAmount"
          value={value.payAmount}
          placeholder="Masukan jumlah bayaran"
          disabled={isSubmitting}
          onChange={(val) => {
            setFieldValue(`payments.[${index}].payAmount`, val);
          }}
        />
        {errors.payAmount && touched.payAmount && <span className="text-xs text-red-500">{errors.payAmount}</span>}
      </div>
    </>
  );
};
const AddNewItem: React.FC<{
  onSave: (values: ItemToBuyFormValues[]) => void;
  values: ItemToBuyFormValues[];
}> = ({ values = [], onSave }) => {
  return (
    <>
      <h6 className="mb-2 text-xl font-bold">Daftar barang dalam transaksi</h6>
      <div className="w-full">
        <div className="flex-1 flex-shrink-0 shadow-md p-4 rounded-md border">
          <ItemToBuyForm
            onSave={(val) => {
              onSave([...values, val]);
            }}
          />
        </div>
      </div>
    </>
  );
};

const ModalSummary: React.FC<{ isOpen: boolean; onClose: () => void; values: AddStockValue }> = ({
  isOpen,
  values,
  onClose,
}) => {
  const router = useRouter();
  const handleClick = () => {
    router.push('/transaction');
  };

  // const finalPrice = values.totalPrice - (values?.discount ?? 0);
  return (
    <Modal isOpen={isOpen} ariaHideApp={false}>
      <div className="justify-center flex flex-col">
        <h2 className="text-2xl font-bold mb-4">Berhasil Membuat Transaksi</h2>
        <label className="">Nama Customer</label>
        <p className="font-bold mb-4">{values.customer?.label}</p>
        <label className="">Discount</label>
        <p className="font-bold mb-4">{formatToIDR(values?.discount ?? 0)}</p>
        <label className="">Harga Total</label>
        <p className="font-bold mb-4">{formatToIDR(values.totalPrice - (values?.discount ?? 0))}</p>
        <label className="">Dibayarkan</label>
        {/* <p className="font-bold mb-4">{formatToIDR(+values.payAmount)}</p> */}
        {/* {values.paymentMethod.value === 'debt' || values.paymentMethod.value === 'current_account' ? (
          <>
            <label className="">Pelanggan berhutang</label>
            <p className="text-2xl font-bold mb-4">{formatToIDR(+finalPrice - +values.payAmount)}</p>
          </>
        ) : (
          <>
            <label className="">Kembalian</label>
            <p className="text-2xl font-bold mb-4">{formatToIDR(+values.payAmount - finalPrice)}</p>
          </>
        )} */}
        <ModalActionWrapper>
          <Button className="mr-2" variant="secondary" onClick={handleClick}>
            Ke Halaman Transaksi
          </Button>
          <Button onClick={onClose}>Tetap di halaman ini</Button>
        </ModalActionWrapper>
      </div>
    </Modal>
  );
};

const ModalEditItem: React.FC<{
  editId: string;
  onClose: (val: boolean) => void;
  onReset: () => void;
  onEdit: (values: ItemToBuyFormValues, action: 'create' | 'edit') => void;
  formikValues: ItemToBuyFormValues[];
}> = ({ editId, onClose, onEdit, formikValues, onReset }) => {
  const initValues = useMemo(() => formikValues.find((data) => data.id === editId), [formikValues, editId]);
  return (
    <Modal
      variant="screen"
      isOpen={!!editId}
      onRequestClose={() => {
        onClose(false);
      }}
    >
      <ItemToBuyForm onReset={onReset} onSave={onEdit} initValues={initValues} />
    </Modal>
  );
};

export default AddTransactionPage;
