/* eslint-disable @typescript-eslint/no-unused-vars */
import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { Pencil, PlusLg, Trash } from 'react-bootstrap-icons';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { DatePickerComponent, TextField, ThemedSelect, WithLabelAndError } from '@/components/Form';
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

export type AddStockValue = {
  payAmount: string;
  dateIn: Date;
  stockAdjustment: ItemToBuyFormValues[];
  memo: string;
  paymentMethod: Option;
  paymentDue: Date;
  customer: Option<unknown> | null;
  sender: Option<unknown> | null;
  isNewSupplier: boolean;
  totalPrice: number;
};

const AddTransactionPage: NextPage = () => {
  const { mutateAsync } = useCreateSale();
  const initialValues = {
    payAmount: '',
    dateIn: new Date(),
    stockAdjustment: [] as ItemToBuyFormValues[],
    memo: '',
    paymentMethod: PAYMENT_METHOD_OPTIONS[0],
    paymentDue: new Date(),
    customer: null as Option<unknown> | null,
    sender: null as Option<unknown> | null,
    isNewSupplier: false,
    totalPrice: 0,
  };
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenSummary, setIsOpenSummary] = useState(false);

  const [editValue, setEditvalue] = useState<ItemToBuyFormValues>({
    discount: '',
    id: '',
    item: undefined as never,
    qty: '',
  });

  const { values, handleChange, errors, isSubmitting, setFieldValue, touched, handleSubmit } = useFormik({
    validationSchema: validationSchemaTransaction,
    initialValues,
    validateOnChange: true,
    onSubmit: async (data) => {
      try {
        await mutateAsync({
          transactionable_type: 'customers',
          payment: {
            cash: +data.payAmount ?? 0,
            change:
              values.paymentMethod.value === 'debt' || values?.paymentMethod.value === 'current_account'
                ? 0
                : +data.payAmount - data.totalPrice,
            maturity_date:
              data.paymentMethod.value !== 'cash'
                ? dayjs(data.paymentDue).format('YYYY-MM-DD HH:mm:ss')
                : dayjs().format('YYYY-MM-DD HH:mm:ss'),
          },
          note: data.memo,
          sender_id: data.sender?.value ?? '',
          transactionable_id: data.customer?.value ?? '',
          payment_method: data.paymentMethod.value,
          purchase_date: dayjs(data.dateIn).format('YYYY-MM-DD HH:mm:ss'),
          invoice_number: '',
          items: data.stockAdjustment.map((value) => {
            return {
              id: value.item.value,
              purchase_price: value.item.data.sell_price ?? 0,
              discount: value.discount ?? 0,
              quantity: +value.qty ?? 0,
              note: '',
            };
          }),
        });

        setIsOpenSummary(true);
      } catch (e) {
        console.log(e);
      }
    },
  });

  const data = values?.stockAdjustment.map(({ item, qty, discount, id }) => {
    return {
      col1: item?.label ?? '',
      col2: qty,
      col3: formatToIDR(+(item?.data?.sell_price ?? 0)),
      col4: formatToIDR(+discount),
      col5: formatToIDR(((item?.data?.sell_price ?? 0) - +discount) * +qty),
      action: (
        <div className="flex">
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setIsOpen(true);
              setEditvalue({ item, qty, discount, id });
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
                newValue.reduce(
                  (prev, { item, qty, discount }) => ((item?.data?.sell_price ?? 0) - +discount) * +qty + prev,
                  0
                )
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
              <ButtonWithModal
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                initValues={editValue}
                onClickEdit={(val) => setEditvalue(val)}
                values={values.stockAdjustment}
                onSave={(data) => {
                  setFieldValue('stockAdjustment', data);
                  setFieldValue(
                    'totalPrice',
                    data.reduce(
                      (prev, { item, qty, discount }) => ((item?.data?.sell_price ?? 0) - +discount) * +qty + prev,
                      0
                    )
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
              <div className="w-full mt-4 px-2 mb-3">
                <label className="mb-1 inline-block">Harga total</label>
                <p className="text-2xl font-bold">{formatToIDR(values.totalPrice)}</p>
              </div>
              <div className="w-full px-2 mb-3">
                <Label required>Uang yang dibayarkan</Label>
                <TextField
                  id="payAmount"
                  name="payAmount"
                  value={values.payAmount}
                  type="number"
                  placeholder="Masukan jumlah bayaran"
                  disabled={isSubmitting}
                  onChange={handleChange}
                  hasError={!!errors.memo}
                />
                {errors.payAmount && touched.payAmount && (
                  <span className="text-xs text-red-500">{errors.payAmount}</span>
                )}
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
              <div className="w-full px-2 mb-4 flex justify-between ">
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
              </div>
              <div className="w-full px-2 mb-3">
                <Button className="mt-4" fullWidth type="submit">
                  Simpan Transaksi
                </Button>
                <ModalSummary isOpen={isOpenSummary} values={values} />
              </div>
            </div>
          </div>
        </div>
      </form>
    </CardDashboard>
  );
};

const ButtonWithModal: React.FC<{
  onSave: (values: ItemToBuyFormValues[]) => void;
  values: ItemToBuyFormValues[];
  initValues: ItemToBuyFormValues;
  onClickEdit: (val: ItemToBuyFormValues) => void;
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}> = ({ values = [], onSave, isOpen, setIsOpen, onClickEdit, initValues }) => {
  const columns = useBoughtList();
  const data = values?.map(({ item, qty, discount, id }) => ({
    col1: item?.label ?? '',
    col2: qty,
    col3: formatToIDR(+(item?.data?.sell_price ?? 0)),
    col4: formatToIDR(+discount),
    col5: formatToIDR(((item?.data?.sell_price ?? 0) - +discount) * +qty),
    action: (
      <div className="flex">
        <Button
          variant="outlined"
          size="small"
          onClick={() => onClickEdit({ item, qty, discount, id })}
          className="mr-4"
          tabIndex={-1}
        >
          <Pencil width={24} height={24} />
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            onSave(values.filter((value) => value.id !== id));
            if (onClickEdit) {
              onClickEdit({} as never);
            }
          }}
          tabIndex={-1}
          size="small"
        >
          <Trash width={24} height={24} />
        </Button>
      </div>
    ),
  }));

  return (
    <>
      <Button onClick={() => setIsOpen(true)} Icon={<PlusLg />}>
        Tambah Barang
      </Button>

      <Modal isOpen={isOpen} onRequestClose={() => setIsOpen(false)} variant="screen">
        <h6 className="mb-2 text-xl font-bold">Daftar barang dalam transaksi</h6>
        <div className="w-full">
          <div className="flex-1 flex-shrink-0 shadow-md p-4 rounded-md border">
            <ItemToBuyForm
              initValues={initValues}
              onSave={(val, action) => {
                onSave([...values, val]);
                if (action === 'edit') {
                  onSave(values.map((old) => (old.id === val.id ? val : old)));
                  onClickEdit({} as never);
                }
              }}
            />
          </div>
          <div className="flex-1">
            <Table columns={columns} data={data} />
          </div>
        </div>
      </Modal>
    </>
  );
};

const useBoughtList = () => {
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

  return columns;
};

const ModalSummary: React.FC<{ isOpen: boolean; values: AddStockValue }> = ({ isOpen, values }) => {
  const router = useRouter();
  const handleClick = () => {
    router.push('/transaction');
  };
  return (
    <Modal isOpen={isOpen}>
      <div className="justify-center flex flex-col">
        <h2 className="text-2xl font-bold mb-4">Berhasil Membuat Transaksi</h2>
        <label className="">Nama Customer</label>
        <p className="font-bold mb-4">{values.customer?.label}</p>
        <label className="">Harga Total</label>
        <p className="font-bold mb-4">{formatToIDR(values.totalPrice)}</p>
        <label className="">Dibayarkan</label>
        <p className="font-bold mb-4">{formatToIDR(+values.payAmount)}</p>
        {values.paymentMethod.value === 'debt' || values.paymentMethod.value === 'current_account' ? (
          <>
            <label className="">Pelanggan berhutang</label>
            <p className="text-2xl font-bold mb-4">{formatToIDR(+values.totalPrice - +values.payAmount)}</p>
          </>
        ) : (
          <>
            <label className="">Kembalian</label>
            <p className="text-2xl font-bold mb-4">{formatToIDR(+values.payAmount - values.totalPrice)}</p>
          </>
        )}
        <ModalActionWrapper>
          <Button onClick={handleClick}>Ke Halaman Transaksi</Button>
        </ModalActionWrapper>
      </div>
    </Modal>
  );
};

export default AddTransactionPage;
