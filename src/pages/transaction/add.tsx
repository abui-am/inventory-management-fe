/* eslint-disable @typescript-eslint/no-unused-vars */
import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { Pencil, Plus, X } from 'lucide-react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { PropsWithChildren, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { CurrencyTextField, DatePickerComponent, TextField, WithLabelAndError } from '@/components/Form';
import ItemToBuyForm, { ItemToBuyFormValues } from '@/components/form/ItemToBuyForm';
import Modal, { ModalActionWrapper } from '@/components/Modal';
import { SelectCustomer, SelectSender } from '@/components/Select';
import Table from '@/components/Table';
import PaymentMethod, { Payment } from '@/components/transaction/PaymentMethod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PAYMENT_METHOD_OPTIONS } from '@/constants/options';
import { useCreateSale } from '@/hooks/mutation/useMutateSale';
import useFetchInvoice from '@/hooks/query/useFetchInvoice';
import { cn } from '@/lib/cn';
import { Option } from '@/typings/common';
import { ThemeablePage } from '@/typings/page';
import { calculateChange } from '@/utils/change';
import { formatToIDR } from '@/utils/format';
import printInvoice from '@/utils/printInvoice';
import reportError from '@/utils/reportError';
import { validationSchemaTransaction } from '@/utils/validation/transaction';

/** Tanpa awalan "Rp" — kolom dan labelnya sudah menyatakan satuannya. */
const angka = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

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
  dateIn: Date;
  stockAdjustment: ItemToBuyFormValues[];
  memo: string;
  payments: Payment[];
  discount: number | '';
  customer: Option<unknown> | null;
  sender: Option<unknown> | null;
  isNewSupplier: boolean;
  totalPrice: number;
  shippingCost: number | '';
};

const AddTransactionPage: NextPage & ThemeablePage = () => {
  const { mutateAsync } = useCreateSale();
  const [tempCreatedId, setTempCreatedId] = useState('');

  const initialValues = {
    dateIn: new Date(),
    stockAdjustment: [] as ItemToBuyFormValues[],
    memo: '',
    invoiceNumber: '',
    payments: [
      {
        payAmount: '',
        paymentMethod: PAYMENT_METHOD_OPTIONS[0],
        paymentDue: new Date(),
      },
    ] as Payment[],
    customer: null as Option<unknown> | null,
    sender: null as Option<unknown> | null,
    isNewSupplier: false,
    totalPrice: 0,
    discount: '' as number | '',
    shippingCost: '' as number | '',
    payFull: false,
  };
  const [editId, setEditId] = useState<string | null>(null);
  const [isOpenSummary, setIsOpenSummary] = useState(false);

  const { values, handleChange, errors, isSubmitting, setFieldValue, touched, handleSubmit, resetForm } = useFormik({
    validationSchema: validationSchemaTransaction,
    initialValues,
    validateOnChange: true,
    onSubmit: async (data, { setSubmitting }) => {
      try {
        setSubmitting(true);

        const payments = data?.payments?.map((val) => ({
          payment_method: val?.paymentMethod.value,
          // `+x ?? 0` tidak pernah jalan: unary plus selalu number (NaN untuk input non-angka),
          // jadi NaN lolos ke payload. Number(...) || 0 menutup keduanya.
          cash: Number(val?.payAmount ?? 0) || 0,
          change: 0,
          maturity_date:
            val?.paymentMethod.value !== 'cash' && val?.paymentMethod.value !== 'bank'
              ? dayjs(val.paymentDue).format('YYYY-MM-DD HH:mm:ss')
              : undefined,
        }));
        const payload = {
          transactionable_type: 'customers' as const,
          payments:
            // Replace payment if payFull is true and there is only one payment method
            // with total price after discount and maturity date from the first payment
            values?.payFull && values?.payments?.length === 1
              ? [
                  {
                    payment_method: payments[0].payment_method,
                    cash: totalPriceAfterDiscount,
                    change: 0,
                    maturity_date: payments[0].maturity_date,
                  },
                ]
              : payments,
          discount: +(data?.discount ?? 0),
          note: data.memo,
          sender_id: data.sender?.value ?? '',
          transactionable_id: data.customer?.value ?? '',
          purchase_date: dayjs(data.dateIn).format('YYYY-MM-DD HH:mm:ss'),
          // Backend menomori sendiri bila dikosongkan (TransactionRepository:197),
          // jadi field ini opsional dan hanya menimpa saat kasir benar-benar mengisinya.
          invoice_number: data.invoiceNumber.trim(),
          items: data.stockAdjustment.map((value) => {
            return {
              id: value?.item?.value ?? '',
              purchase_price: value?.item?.data.sell_price ?? 0,
              quantity: Number(value.qty) || 0,
              note: '',
            };
          }),
          shipping_cost: +(data.shippingCost ?? 0),
        };

        // find index where payment method is cash
        const cashIndex = payload.payments.findIndex((val) => val.payment_method === 'cash');

        if (cashIndex !== -1) {
          const change = calculateChange(
            payload.payments.reduce((acc, val) => acc + val.cash, 0),
            data.totalPrice,
            +(values?.discount ?? 0),
            +(values?.shippingCost ?? 0)
          );

          if (change < 0) {
            toast.error('Uang yang dibayarkan kurang dari total harga');
            return;
          }

          payload.payments[cashIndex].change = change;
        }

        const {
          data: {
            transaction: { id },
          },
        } = await mutateAsync(payload);
        setTempCreatedId(id);
        setSubmitting(false);
        setIsOpenSummary(true);
      } catch (e) {
        reportError(e, { form: 'transaction/add' });
        toast.error('Gagal menyimpan transaksi');
      }
    },
  });

  const totalDibayarkan = values.payments.reduce((prev, curr) => prev + +(curr?.payAmount ?? 0), 0);

  const change = calculateChange(
    values.payments.reduce((prev, curr) => prev + +(curr?.payAmount ?? 0), 0),
    values.totalPrice,
    +(values?.discount ?? 0),
    +(values?.shippingCost ?? 0)
  );

  const data = values?.stockAdjustment.map(({ item, qty, id }) => {
    const harga = +(item?.data?.sell_price ?? 0);
    return {
      barang: (
        <div className="flex flex-col">
          <span className="text-base font-medium">{item?.data?.name ?? item?.label ?? ''}</span>
          <span className="font-mono text-2xs text-foreground-subtle">{item?.data?.item_id ?? '-'}</span>
        </div>
      ),
      qty: <span className="block text-right font-mono tabular-nums">{qty}</span>,
      satuan: <span className="text-foreground-muted">{item?.data?.unit ?? '-'}</span>,
      harga: <span className="block text-right font-mono tabular-nums">{angka(harga)}</span>,
      subtotal: <span className="block text-right font-mono font-semibold tabular-nums">{angka(harga * +qty)}</span>,
      aksi: (
        <div className="flex justify-end gap-1">
          <Button size="icon-xs" variant="ghost" aria-label="Ubah barang" onClick={() => setEditId(id)}>
            <Pencil strokeWidth={1.7} aria-hidden />
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="Hapus barang"
            tabIndex={-1}
            onClick={() => {
              const newValue = values.stockAdjustment.filter((value) => value.id !== id);
              setFieldValue('stockAdjustment', newValue);
              setFieldValue(
                'totalPrice',
                newValue.reduce((prev, { item: it, qty: q }) => (it?.data?.sell_price ?? 0) * +q + prev, 0)
              );
            }}
          >
            <X strokeWidth={2} aria-hidden />
          </Button>
        </div>
      ),
    };
  });

  const columns = React.useMemo(
    () => [
      { Header: 'Barang', accessor: 'barang' },
      { Header: 'Qty', accessor: 'qty', width: '9%', className: 'justify-end' },
      { Header: 'Satuan', accessor: 'satuan', width: '12%' },
      { Header: 'Harga', accessor: 'harga', width: '16%', className: 'justify-end' },
      { Header: 'Subtotal', accessor: 'subtotal', width: '18%', className: 'justify-end' },
      { Header: '', accessor: 'aksi', width: '78px', className: 'justify-end' },
    ],
    []
  );

  const totalPriceAfterDiscount = values.totalPrice + +(values.shippingCost ?? 0) - +(values?.discount ?? 0);
  return (
    <form onSubmit={handleSubmit}>
      {/* A01: dua kolom, gap 12px, rel kanan menempel di atas */}
      <div className="flex flex-col items-start gap-3 xl:flex-row">
        {/* A02 */}
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          {/* A04..A07 — identitas transaksi */}
          <div className="flex flex-wrap gap-2.5 rounded-card border border-border bg-surface p-3 shadow-sm">
            <div className="flex min-w-[200px] flex-1 flex-col gap-1">
              <WithLabelAndError required touched={touched} errors={errors} name="customer" label="Customer">
                <SelectCustomer onChange={(val) => setFieldValue('customer', val)} value={values.customer} />
              </WithLabelAndError>
            </div>

            <div className="flex min-w-[200px] flex-1 flex-col gap-1">
              <WithLabelAndError required touched={touched} errors={errors} name="sender" label="Pengirim">
                <SelectSender onChange={(val) => setFieldValue('sender', val)} value={values.sender} />
              </WithLabelAndError>
            </div>

            <div className="flex w-[150px] flex-col gap-1">
              <Label htmlFor="dateIn">Tanggal</Label>
              <DatePickerComponent
                id="dateIn"
                name="dateIn"
                selected={values.dateIn}
                disabled={isSubmitting}
                onChange={(date) => setFieldValue('dateIn', date)}
              />
              {errors.dateIn && (
                <span className="text-sm text-destructive" role="alert">
                  {errors.dateIn as string}
                </span>
              )}
            </div>

            <div className="flex w-[150px] flex-col gap-1">
              <Label htmlFor="invoiceNumber">Faktur</Label>
              {/* Opsional: backend menomori sendiri kalau dikosongkan. */}
              <TextField
                id="invoiceNumber"
                name="invoiceNumber"
                className="font-mono"
                value={values.invoiceNumber}
                placeholder="Otomatis"
                disabled={isSubmitting}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* A08..A14 — barang */}
          <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-raised px-3.5 py-2.5">
              <span className="text-base font-semibold">Barang</span>
              <span className="text-sm text-foreground-muted">
                {values.stockAdjustment.length} baris · {angka(values.totalPrice)}
              </span>
            </div>

            <div className="border-b border-border p-3.5">
              <AddNewItem
                values={values.stockAdjustment}
                onSave={(dataBaru) => {
                  setFieldValue('stockAdjustment', dataBaru);
                  setFieldValue(
                    'totalPrice',
                    dataBaru.reduce((prev, { item, qty }) => (item?.data?.sell_price ?? 0) * +qty + prev, 0)
                  );
                }}
              />
            </div>

            {data.length > 0 ? (
              <Table withoutStripe columns={columns} data={data} />
            ) : (
              <p className="px-3.5 py-8 text-center text-sm text-foreground-muted">
                Belum ada barang. Tambahkan lewat kolom di atas.
              </p>
            )}
          </div>

          {/* A15..A18 — pembayaran */}
          <div className="flex flex-col gap-2.25 rounded-card border border-border bg-surface p-3.5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-base font-semibold">Pembayaran</span>
              {!values.payFull && values?.payments?.length < 2 && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    setFieldValue('payments', [
                      ...values.payments,
                      {
                        paymentMethod: PAYMENT_METHOD_OPTIONS?.filter(
                          (val) => val.value !== values?.payments?.[0]?.paymentMethod?.value
                        )[0],
                        payAmount: values?.payments?.[0]
                          ? totalPriceAfterDiscount - +(values?.payments?.[0]?.payAmount ?? 0)
                          : null,
                        paymentDue: null,
                      },
                    ]);
                  }}
                >
                  <Plus strokeWidth={2.2} aria-hidden /> Metode
                </Button>
              )}
            </div>

            <div className="grid gap-2.25 md:grid-cols-2">
              {values?.payments?.map((value, index) => (
                <div
                  // eslint-disable-next-line react/no-array-index-key
                  key={`${value.paymentMethod.value}${index}`}
                  className="rounded-lg border border-border bg-surface-raised p-2.5"
                >
                  <PaymentMethod
                    withPayFull
                    totalPrice={totalPriceAfterDiscount}
                    isSubmitting={isSubmitting}
                    setFieldValue={setFieldValue}
                    errors={errors}
                    touched={touched}
                    values={values}
                    index={index}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* A03 + A19..A26 — rel ringkasan */}
        <div className="flex w-full flex-col gap-2.5 xl:sticky xl:top-3.5 xl:w-72">
          <div className="flex flex-col gap-2.5 rounded-card border border-border bg-surface p-3.5 shadow-sm">
            <span className="text-base font-semibold">Ringkasan</span>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-foreground-muted">Subtotal</span>
                <span className="font-mono tabular-nums">{angka(values.totalPrice)}</span>
              </div>

              <div className="flex items-center justify-between gap-2 text-sm">
                <Label htmlFor="discount">Diskon</Label>
                <CurrencyTextField
                  name="discount"
                  value={values.discount}
                  placeholder="0"
                  disabled={isSubmitting}
                  prefix=""
                  className="h-[26px] w-[92px] rounded-md px-2 text-right font-mono text-sm"
                  onChange={(val) => setFieldValue('discount', val)}
                />
              </div>

              <div className="flex items-center justify-between gap-2 text-sm">
                <Label htmlFor="shippingCost">Ongkos kirim</Label>
                <CurrencyTextField
                  name="shippingCost"
                  value={values.shippingCost}
                  placeholder="0"
                  disabled={isSubmitting}
                  prefix=""
                  className="h-[26px] w-[92px] rounded-md px-2 text-right font-mono text-sm"
                  onChange={(val) => setFieldValue('shippingCost', val)}
                />
              </div>
              {errors.shippingCost && touched.shippingCost && (
                <span className="text-sm text-destructive" role="alert">
                  {errors.shippingCost}
                </span>
              )}

              {/* Tidak ada di artboard, tapi fungsinya sudah ada sebelumnya — dipertahankan. */}
              <div className="mt-0.5 flex flex-col gap-1">
                <Label htmlFor="memo">Catatan</Label>
                <TextField
                  id="memo"
                  name="memo"
                  value={values.memo}
                  placeholder="Opsional"
                  disabled={isSubmitting}
                  onChange={handleChange}
                  hasError={!!errors.memo && !!touched.memo}
                />
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-baseline justify-between gap-2">
              <span className="text-base font-semibold">Total</span>
              <span className="font-mono text-xl font-bold tracking-[-0.025em]">{angka(totalPriceAfterDiscount)}</span>
            </div>

            <div className="flex flex-col gap-1.25 rounded-lg bg-surface-raised px-2.75 py-2.25">
              <div className="flex justify-between text-sm">
                <span className="text-foreground-muted">Dibayarkan</span>
                <span className="font-mono font-medium tabular-nums">{angka(totalDibayarkan)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground-muted">Kembalian</span>
                <span
                  className={cn(
                    'font-mono font-semibold tabular-nums',
                    change < 0 ? 'text-destructive' : 'text-success'
                  )}
                >
                  {angka(change)}
                </span>
              </div>
            </div>

            <Button type="submit" fullWidth loading={isSubmitting}>
              Simpan transaksi
            </Button>
            <p className="text-center text-2xs leading-[15px] text-foreground-subtle">
              Nonaktif selama menyimpan — klik ganda tidak lagi membuat dua transaksi
            </p>
          </div>
        </div>
      </div>

      <ModalSummary
        transactionId={tempCreatedId}
        onClose={() => {
          setTempCreatedId('');
          setIsOpenSummary(false);
          resetForm({ values: initialValues });
        }}
        isOpen={isOpenSummary}
        values={values}
      />
      <ModalEditItem
        onReset={() => setEditId(null)}
        editId={editId ?? ''}
        formikValues={values.stockAdjustment}
        onClose={() => setEditId(null)}
        onEdit={(editedData) => {
          const editedValues = values?.stockAdjustment?.map((d) => (d.id === editedData.id ? editedData : d));
          setFieldValue('stockAdjustment', editedValues);
          setFieldValue(
            'totalPrice',
            editedValues.reduce((prev, { item, qty }) => (item?.data?.sell_price ?? 0) * +qty + prev, 0)
          );
          setEditId(null);
        }}
      />
    </form>
  );
};

const AddNewItem: React.FC<
  PropsWithChildren<{
    onSave: (values: ItemToBuyFormValues[]) => void;
    values: ItemToBuyFormValues[];
  }>
> = ({ values = [], onSave }) => {
  // Judul dan bingkai dibuang: kartu induknya sudah berjudul "Barang" dan sudah
  // punya border. Dua bingkai bersarang membuat formnya tampak seperti dialog
  // yang nyasar ke dalam kartu.
  return <ItemToBuyForm onSave={(val) => onSave([...values, val])} />;
};

const ModalSummary: React.FC<
  PropsWithChildren<{
    isOpen: boolean;
    onClose: () => void;
    values: AddStockValue;
    transactionId: string;
  }>
> = ({ isOpen, values, onClose, transactionId }) => {
  const router = useRouter();
  const handleClick = () => {
    router.push('/transaction');
  };

  // isFetching, bukan isLoading: di react-query v4 query dengan `enabled: false`
  // berstatus 'loading' selamanya karena belum pernah punya data, jadi isLoading
  // tidak pernah false dan tombolnya disabled permanen.
  const { refetch: fetchBlobPdf, isFetching } = useFetchInvoice(transactionId, {
    enabled: false,
  });
  const handlePrintInvoice = async () => {
    const { data } = await fetchBlobPdf();
    if (!data) return;
    printInvoice(data);
  };

  // const finalPrice = values.totalPrice - (values?.discount ?? 0);
  return (
    <Modal isOpen={isOpen} onRequestClose={onClose}>
      <div className="justify-center flex flex-col">
        <h2 className="text-2xl font-bold mb-4">Berhasil Membuat Transaksi</h2>
        <label className="">Nama Customer</label>
        <p className="font-bold mb-4">{values.customer?.label}</p>
        <label className="">Discount</label>
        <p className="font-bold mb-4">{formatToIDR(+(values?.discount ?? 0))}</p>
        <label className="">Ongkos Kirim</label>
        <p className="font-bold mb-4">{formatToIDR(+(values?.shippingCost ?? 0))}</p>
        <label className="">Harga Total</label>
        <p className="font-bold mb-4">
          {formatToIDR(values.totalPrice - +(values?.discount ?? 0) - +(values?.shippingCost ?? 0))}
        </p>
        <label className="">Dibayarkan</label>
        {values.payments?.map((val, index) => {
          // Key lama: `payAmount + paymentDue?.toString() + paymentMethod`. Kalau paymentDue
          // null hasilnya NaN, dan paymentMethod adalah objek — jadi key-nya menjadi
          // "NaN[object Object]" dan bertabrakan antar baris.
          return (
            // eslint-disable-next-line react/no-array-index-key -- baris pembayaran tidak punya id dari API
            <p className="font-bold mb-4" key={`${val.paymentMethod?.value ?? 'payment'}-${index}`}>
              {formatToIDR(+(val?.payAmount ?? 0))}({val.paymentMethod.label})
            </p>
          );
        })}
        <p>
          Kembalian :{' '}
          {formatToIDR(
            calculateChange(
              values.payments.reduce((prev, curr) => prev + +(curr?.payAmount ?? 0), 0),
              values.totalPrice,
              +(values.discount ?? 0),
              +(values.shippingCost ?? 0)
            )
          )}
        </p>
        <ModalActionWrapper>
          <Button fullWidth loading={isFetching} onClick={handlePrintInvoice}>
            Print
          </Button>
        </ModalActionWrapper>
        <ModalActionWrapper>
          <Button className="mr-2" variant="outline" onClick={handleClick}>
            Ke Halaman Transaksi
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Tetap di halaman ini
          </Button>
        </ModalActionWrapper>
      </div>
    </Modal>
  );
};

const ModalEditItem: React.FC<
  PropsWithChildren<{
    editId: string;
    onClose: (val: boolean) => void;
    onReset: () => void;
    onEdit: (values: ItemToBuyFormValues, action: 'create' | 'edit') => void;
    formikValues: ItemToBuyFormValues[];
  }>
> = ({ editId, onClose, onEdit, formikValues, onReset }) => {
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

// Seluruh isinya sudah memakai token, jadi aman mengikuti tema pengguna.
AddTransactionPage.themeable = true;

export default AddTransactionPage;
