import Tippy from '@tippyjs/react';
import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { Check, Download, Plus } from 'lucide-react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { PropsWithChildren, useState } from 'react';
import toast from 'react-hot-toast';

import { CurrencyTextField, DatePickerComponent, TextField, WithLabelAndError } from '@/components/Form';
import Modal from '@/components/Modal';
import { SelectCustomer, SelectSender } from '@/components/Select';
import CustomerReceivableCard from '@/components/transaction/CustomerReceivableCard';
import ItemTable, { ItemRow } from '@/components/transaction/ItemTable';
import JournalPreviewCard from '@/components/transaction/JournalPreviewCard';
import { Payment } from '@/components/transaction/PaymentMethod';
import PaymentRow from '@/components/transaction/PaymentRow';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { METHODS_ON_CREDIT, METHODS_WITH_DUE_DATE, PAYMENT_METHOD_OPTIONS } from '@/constants/options';
import { useCreateSale } from '@/hooks/mutation/useMutateSale';
import { useFetchMyself } from '@/hooks/query/useFetchEmployee';
import { cn } from '@/lib/cn';
import { Option } from '@/typings/common';
import { CustomerData } from '@/typings/customer';
import { ThemeablePage } from '@/typings/page';
import { CreateSaleResponse, SaleTransactionsData } from '@/typings/sale';
import { calculateChange } from '@/utils/change';
import { formatPaymentMethod } from '@/utils/format';
import { downloadInvoice } from '@/utils/invoice';
import reportError from '@/utils/reportError';
import { controlStyle } from '@/utils/style';
import { validationSchemaTransaction } from '@/utils/validation/transaction';

/** Tanpa awalan "Rp" — kolom dan labelnya sudah menyatakan satuannya. */
const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

const calculateSubtotal = (rows: ItemRow[]) =>
  rows.reduce((total, { item, qty }) => total + (item?.data?.sell_price ?? 0) * +(qty || 0), 0);

export type AddStockValue = {
  dateIn: Date;
  stockAdjustment: ItemRow[];
  memo: string;
  invoiceNumber: string;
  payments: Payment[];
  discount: number | '';
  customer: Option<CustomerData> | null;
  sender: Option<unknown> | null;
  totalPrice: number;
  shippingCost: number | '';
  payFull: boolean;
};

const AddTransactionPage: NextPage & ThemeablePage = () => {
  const { mutateAsync } = useCreateSale();
  // Seluruh objeknya disimpan, bukan cuma id: kode transaksi dan nomor fakturnya
  // dibangkitkan backend dan hanya ada di respons ini — dan keduanya dicetak di faktur.
  const [created, setCreated] = useState<CreateSaleResponse['transaction'] | null>(null);
  const [isOpenSummary, setIsOpenSummary] = useState(false);
  const [isOpenConfirm, setIsOpenConfirm] = useState(false);

  const initialValues: AddStockValue = {
    dateIn: new Date(),
    stockAdjustment: [],
    memo: '',
    invoiceNumber: '',
    payments: [
      {
        payAmount: '',
        paymentMethod: PAYMENT_METHOD_OPTIONS[0],
        paymentDue: new Date(),
      },
    ],
    customer: null,
    sender: null,
    totalPrice: 0,
    discount: '',
    shippingCost: '',
    payFull: false,
  };

  const { values, handleChange, errors, isSubmitting, setFieldValue, touched, handleSubmit, resetForm } =
    useFormik<AddStockValue>({
      validationSchema: validationSchemaTransaction,
      initialValues,
      validateOnChange: true,
      onSubmit: async (data, { setSubmitting }) => {
        try {
          setSubmitting(true);

          const payments = data?.payments?.map((val) => ({
            payment_method: val?.paymentMethod.value,
            // `+x ?? 0` tidak pernah jalan: unary plus selalu number (NaN untuk input non-formatNumber),
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
              // "Seluruhnya" tidak menyimpan angkanya di form — angkanya diambil dari total
              // saat submit, supaya tidak basi ketika daftar barang masih berubah sesudah
              // kotaknya dicentang.
              data?.payFull && data?.payments?.length === 1
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
            // jadi field ini opsional dan hanya menimpa saat cashier benar-benar mengisinya.
            invoice_number: data.invoiceNumber.trim(),
            items: data.stockAdjustment.map((value) => ({
              id: value?.item?.value ?? '',
              purchase_price: value?.item?.data.sell_price ?? 0,
              quantity: Number(value.qty) || 0,
              note: '',
            })),
            shipping_cost: +(data.shippingCost ?? 0),
          };

          const cashIndex = payload.payments.findIndex((val) => val.payment_method === 'cash');

          if (cashIndex !== -1) {
            const change = calculateChange(
              payload.payments.reduce((acc, val) => acc + val.cash, 0),
              data.totalPrice,
              +(data?.discount ?? 0),
              +(data?.shippingCost ?? 0)
            );

            if (change < 0) {
              toast.error('Uang yang dibayarkan kurang dari total harga');
              return;
            }

            payload.payments[cashIndex].change = change;
          }

          // Bukan `data`: nama itu sudah dipakai parameter onSubmit untuk isi form.
          const { data: response } = await mutateAsync(payload);
          setCreated(response.transaction);
          setSubmitting(false);
          setIsOpenConfirm(false);
          setIsOpenSummary(true);
        } catch (e) {
          reportError(e, { form: 'transaction/add' });
          toast.error('Gagal menyimpan transaksi');
        }
      },
    });

  const totalPriceAfterDiscount = values.totalPrice + +(values.shippingCost ?? 0) - +(values?.discount ?? 0);

  const totalPaid = values.payFull
    ? totalPriceAfterDiscount
    : values.payments.reduce((prev, curr) => prev + +(curr?.payAmount ?? 0), 0);

  const change = calculateChange(totalPaid, values.totalPrice, +(values?.discount ?? 0), +(values?.shippingCost ?? 0));

  // Bahan preview jurnal dan kartu piutang: nominal per metode, sudah memperhitungkan
  // "Seluruhnya" yang jumlahnya baru ditentukan saat simpan.
  const amountByMethod = values.payments.map((p, i) => ({
    method: p.paymentMethod?.value as string,
    amount: values.payFull && i === 0 ? totalPriceAfterDiscount : +(p.payAmount ?? 0),
  }));

  const creditThisTransaction = amountByMethod
    .filter(({ method }) => METHODS_ON_CREDIT.includes(method))
    .reduce((total, { amount }) => total + amount, 0);

  /**
   * Apa saja yang masih menghalangi transaksi ini disimpan.
   *
   * Tiga yang pertama diminta Yup, yang keempat diminta backend: `TransactionRepository`
   * menolak dengan 400 kalau jumlah pembayaran tidak PERSIS sama dengan totalnya —
   * termasuk kalau lebih. Menyerahkannya ke server berarti cashier baru tahu setelah
   * menekan simpan dan menerima pesan yang tidak menyebutkan bagian mana yang salah.
   */
  const blockers: string[] = [];
  if (!values.customer) blockers.push('Customer belum dipilih');
  if (!values.sender) blockers.push('Pengirim belum dipilih');
  if (values.stockAdjustment.length === 0) blockers.push('Belum ada barang');
  else if (totalPaid !== totalPriceAfterDiscount) {
    blockers.push(
      totalPaid < totalPriceAfterDiscount
        ? `Pembayaran kurang ${formatNumber(totalPriceAfterDiscount - totalPaid)}`
        : `Pembayaran lebih ${formatNumber(totalPaid - totalPriceAfterDiscount)}`
    );
  }

  const canSave = blockers.length === 0;

  const handleItemsChange = (rows: ItemRow[]) => {
    setFieldValue('stockAdjustment', rows);
    setFieldValue('totalPrice', calculateSubtotal(rows));
  };

  const handlePaymentChange = (index: number, patch: Partial<Payment>) => {
    setFieldValue(
      'payments',
      values.payments.map((p, i) => (i === index ? { ...p, ...patch } : p))
    );
  };

  const paymentErrorAt = (index: number) => {
    const e = errors.payments?.[index];
    if (typeof e === 'string') return e;
    return e?.payAmount;
  };

  return (
    <form
      // Enter di kolom mana pun ikut lewat konfirmasi, sama seperti menekan tombolnya.
      onSubmit={(e) => {
        e.preventDefault();
        if (canSave) setIsOpenConfirm(true);
      }}
    >
      {/* SPEC-01: dua kolom, gap 12px, rel kanan menempel di atas. Padding luar tidak
          ditulis di sini — Layout sudah memberi 14px/18px. */}
      <div className="flex flex-col items-start gap-3 xl:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-2.5">
          {/* SPEC-04..08 — identitas transaksi */}
          <div className="flex flex-wrap gap-2.25 rounded-card border border-border bg-surface px-3.25 py-2.75 shadow-sm">
            <div className="flex min-w-[180px] flex-1 flex-col">
              <WithLabelAndError required touched={touched} errors={errors} name="customer" label="Customer">
                <SelectCustomer
                  name="customer"
                  placeholder="Pilih customer"
                  onChange={(val) => setFieldValue('customer', val)}
                  value={values.customer}
                  isDisabled={isSubmitting}
                  additionalStyle={controlStyle}
                />
              </WithLabelAndError>
            </div>

            <div className="flex min-w-[180px] flex-1 flex-col">
              <WithLabelAndError required touched={touched} errors={errors} name="sender" label="Pengirim">
                <SelectSender
                  name="sender"
                  placeholder="Pilih pengirim"
                  onChange={(val) => setFieldValue('sender', val)}
                  value={values.sender}
                  isDisabled={isSubmitting}
                  additionalStyle={controlStyle}
                />
              </WithLabelAndError>
            </div>

            <div className="flex w-[148px] flex-col">
              <Label htmlFor="dateIn" className="mb-1">
                Tanggal
              </Label>
              <DatePickerComponent
                id="dateIn"
                name="dateIn"
                selected={values.dateIn}
                disabled={isSubmitting}
                className="h-8 rounded-control font-mono"
                onChange={(date) => setFieldValue('dateIn', date)}
              />
            </div>

            <div className="flex w-[148px] flex-col">
              <Label htmlFor="invoiceNumber" className="mb-1">
                Faktur
              </Label>
              {/* Opsional: backend menomori sendiri kalau dikosongkan. */}
              <TextField
                id="invoiceNumber"
                name="invoiceNumber"
                className="h-8 rounded-control font-mono"
                value={values.invoiceNumber}
                placeholder="Otomatis"
                disabled={isSubmitting}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* SPEC-09..20 — barang */}
          <ItemTable items={values.stockAdjustment} onChange={handleItemsChange} disabled={isSubmitting} />

          {/* SPEC-21..30 — pembayaran */}
          <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border bg-surface-raised px-3.25 py-2.25">
              <span className="text-base font-semibold">Pembayaran</span>

              <div className="flex items-center gap-2.5">
                {values.payments.length === 1 && (
                  <label htmlFor="payFull" className="flex cursor-pointer items-center gap-1.5 text-sm">
                    <Checkbox
                      id="payFull"
                      name="payFull"
                      checked={values.payFull}
                      disabled={isSubmitting}
                      onChange={(e) => setFieldValue('payFull', e.target.checked)}
                    />
                    Seluruhnya
                  </label>
                )}

                {!values.payFull && values.payments.length < 2 && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => {
                      setFieldValue('payments', [
                        ...values.payments,
                        {
                          paymentMethod: PAYMENT_METHOD_OPTIONS.filter(
                            (val) => val.value !== values?.payments?.[0]?.paymentMethod?.value
                          )[0],
                          payAmount: Math.max(totalPriceAfterDiscount - +(values.payments[0]?.payAmount ?? 0), 0),
                          paymentDue: new Date(),
                        },
                      ]);
                    }}
                  >
                    <Plus strokeWidth={2.2} aria-hidden /> Metode
                  </Button>
                )}
              </div>
            </div>

            {values.payments.map((payment, index) => (
              <PaymentRow
                // Metode unik per baris (tombol Metode selalu memilih yang berbeda),
                // jadi ini kunci yang stabil — tidak seperti indeks yang bergeser saat
                // baris pertama dihapus.
                key={payment.paymentMethod?.value ?? index}
                value={payment}
                disabled={isSubmitting}
                fixedAmount={values.payFull && index === 0 ? totalPriceAfterDiscount : undefined}
                error={paymentErrorAt(index)}
                onChange={(patch) => handlePaymentChange(index, patch)}
                onDelete={
                  values.payments.length > 1
                    ? () =>
                        setFieldValue(
                          'payments',
                          values.payments.filter((_, i) => i !== index)
                        )
                    : undefined
                }
              />
            ))}

            <div className="flex items-baseline justify-between bg-surface-raised px-3.25 py-2.5 text-sm">
              <span className="text-foreground-muted">Total dibayarkan</span>
              <span className="font-mono text-[14px] font-bold tabular-nums text-accent">
                {formatNumber(totalPaid)}
              </span>
            </div>
          </div>
        </div>

        {/* SPEC-03 + 31..43 — rel ringkasan */}
        <div className="flex w-full flex-col gap-2.5 xl:sticky xl:top-3.5 xl:w-[284px] xl:shrink-0">
          <div className="flex flex-col gap-2.5 rounded-card border border-border bg-surface px-3.75 py-3.25 shadow-sm">
            <span className="text-base font-semibold">Ringkasan</span>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-muted">Subtotal</span>
                <span className="font-mono tabular-nums">{formatNumber(values.totalPrice)}</span>
              </div>

              <div className="flex items-center justify-between gap-2 text-sm">
                <Label htmlFor="discount">Diskon</Label>
                <CurrencyTextField
                  name="discount"
                  value={values.discount}
                  placeholder="0"
                  disabled={isSubmitting}
                  prefix=""
                  className="h-8 w-[92px] rounded-control px-2.5 text-right font-mono"
                  onChange={(val) => setFieldValue('discount', val ?? '')}
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
                  className="h-8 w-[92px] rounded-control px-2.5 text-right font-mono"
                  onChange={(val) => setFieldValue('shippingCost', val ?? '')}
                />
              </div>
              {errors.shippingCost && touched.shippingCost && (
                <span className="text-sm text-destructive" role="alert">
                  {errors.shippingCost}
                </span>
              )}

              {/* Tidak ada di artboard, tapi tetap dibutuhkan — catatan ikut tersimpan
                  sebagai `note` transaksi dan muncul lagi di detailnya. */}
              <div className="mt-0.5 flex flex-col">
                <Label htmlFor="memo" className="mb-1">
                  Catatan
                </Label>
                <TextField
                  id="memo"
                  name="memo"
                  className="h-8 rounded-control"
                  value={values.memo}
                  placeholder="Opsional"
                  disabled={isSubmitting}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-baseline justify-between gap-2">
              <span className="text-base font-semibold">Total</span>
              <span className="font-mono text-xl font-bold tabular-nums tracking-[-0.025em] text-accent">
                {formatNumber(totalPriceAfterDiscount)}
              </span>
            </div>

            <div className="flex flex-col gap-1.25 rounded-lg bg-surface-raised px-2.75 py-2.25">
              <div className="flex justify-between text-sm">
                <span className="text-foreground-muted">Dibayarkan</span>
                <span className="font-mono font-medium tabular-nums">{formatNumber(totalPaid)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground-muted">Selisih</span>
                {/*
                  Hijau HANYA saat nol. Backend menolak pembayaran yang tidak persis sama
                  dengan totalnya — termasuk yang lebih — jadi selisih positif sama-sama
                  menghalangi simpan, dan menandainya hijau bertentangan dengan tombol
                  yang justru mati di keadaan itu.
                */}
                <span
                  className={cn(
                    'font-mono font-semibold tabular-nums',
                    // eslint-disable-next-line no-nested-ternary
                    change === 0 ? 'text-success' : change < 0 ? 'text-destructive' : 'text-warning'
                  )}
                >
                  {formatNumber(change)}
                </span>
              </div>
            </div>

            {/*
              Tippy dipasang di SPAN pembungkus, bukan di tombolnya.
              
              Tombol yang disabled memakai `pointer-events: none`, jadi ia tidak pernah
              mengirim event hover — tooltip di tombol itu sendiri tidak akan pernah
              muncul justru pada satu-satunya keadaan yang perlu dijelaskan.
            */}
            <Tippy
              content={
                <div className="flex flex-col gap-0.75">
                  {blockers.map((h) => (
                    <span key={h}>{h}</span>
                  ))}
                </div>
              }
              disabled={canSave}
              placement="top"
              delay={[250, 0]}
            >
              <span className="block">
                <Button size="sm" fullWidth disabled={!canSave} onClick={() => setIsOpenConfirm(true)}>
                  Simpan transaksi
                </Button>
              </span>
            </Tippy>
          </div>

          <CustomerReceivableCard
            name={values.customer?.label}
            currentDebt={+(values.customer?.data?.total_debt ?? 0)}
            creditThisTransaction={creditThisTransaction}
          />

          <JournalPreviewCard
            payments={amountByMethod}
            total={totalPriceAfterDiscount}
            shippingCost={+(values.shippingCost ?? 0)}
          />
        </div>
      </div>

      <ModalConfirm
        isOpen={isOpenConfirm}
        onClose={() => setIsOpenConfirm(false)}
        onConfirm={handleSubmit}
        saving={isSubmitting}
        values={values}
        total={totalPriceAfterDiscount}
        amountByMethod={amountByMethod}
        creditThisTransaction={creditThisTransaction}
      />

      <ModalSummary
        created={created}
        amountByMethod={amountByMethod}
        onClose={() => {
          setCreated(null);
          setIsOpenSummary(false);
          resetForm({ values: initialValues });
        }}
        isOpen={isOpenSummary}
        values={values}
      />
    </form>
  );
};

/**
 * Menyusun bentuk transaksi yang dipahami pembuat faktur dari isi form.
 *
 * Sengaja tidak mengambil ulang transaksinya ke backend: semua yang dibutuhkan faktur
 * baru saja dikirim dari layar ini, dan yang belum ada — kode transaksi serta nomor
 * faktur — datang di respons simpannya. Satu permintaan jaringan lebih sedikit, dan
 * tidak bergantung pada bentuk respons endpoint detail yang belum pernah diperiksa.
 */
const invoiceFromForm = (
  values: AddStockValue,
  created: CreateSaleResponse['transaction'],
  cashier: string
): SaleTransactionsData => {
  const totalAfterDiscount = values.totalPrice + +(values.shippingCost ?? 0) - +(values?.discount ?? 0);

  return {
    id: created.id,
    invoice_number: created.invoice_number,
    transaction_code: created.transaction_code,
    purchase_date: dayjs(values.dateIn).format('YYYY-MM-DD HH:mm:ss'),
    note: values.memo,
    discount: +(values.discount ?? 0),
    shipping_cost: +(values.shippingCost ?? 0),
    customer: { full_name: values.customer?.label ?? 'Umum' },
    pic: { employee: { first_name: cashier } },
    items: values.stockAdjustment.map((row) => ({
      name: row.item?.data?.name ?? '',
      unit: row.item?.data?.unit ?? '',
      pivot: {
        item_name: row.item?.data?.name ?? '',
        item_unit: row.item?.data?.unit ?? '',
        quantity: +(row.qty || 0),
        purchase_price: row.item?.data?.sell_price ?? 0,
        total_price: (row.item?.data?.sell_price ?? 0) * +(row.qty || 0),
      },
    })),
    payments: values.payments.map((p, i) => ({
      payment_method: p.paymentMethod?.value as string,
      // "Seluruhnya" tidak menyimpan angkanya di form — sama seperti saat dikirim,
      // nilainya diambil dari total.
      payment_price: values.payFull && i === 0 ? totalAfterDiscount : +(p.payAmount ?? 0),
      maturity_date: METHODS_WITH_DUE_DATE.includes(p.paymentMethod?.value as string)
        ? (p.paymentDue as Date)
        : undefined,
    })),
    // Sisanya tidak dipakai faktur; cast dilakukan sekali di sini, bukan di pemakaian.
  } as unknown as SaleTransactionsData;
};

/**
 * Satu baris label–nilai di dalam dialog.
 *
 * Metode bayar sempat tampil sebagai pill berwarna di sini dan dicabut lagi: di form,
 * warna itu berguna karena barisnya banyak dan perlu dipindai; di dialog yang isinya
 * cuma satu-dua baris, ia jadi noda warna yang menarik perhatian ke tempat yang salah.
 * Warna disisakan untuk yang benar-benar punya arti — total, selisih, dan peringatan.
 */
function DialogRow({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: 'accent' | 'warning' | 'success';
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-foreground-muted">{label}</span>
      <span
        className={cn(
          'font-mono tabular-nums',
          strong ? 'font-semibold' : 'font-medium',
          tone === 'accent' && 'text-accent',
          tone === 'warning' && 'text-warning',
          tone === 'success' && 'text-success'
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** Garis pemisah tipis di dalam blok ringkasan dialog. */
const DialogDivider = () => <div className="my-0.5 h-px bg-border" />;

/**
 * Konfirmasi sebelum transaksi disimpan.
 *
 * Bukan sekadar "yakin?" — dialognya mengulang apa yang akan tersimpan, dan menyebut
 * akibat yang tidak bisa ditarik kembali: jurnalnya ditulis seketika, stok berkurang,
 * dan piutang customer bertambah kalau ada bagian yang dibayar Utang atau Giro. Itu
 * yang tidak terlihat dari layar form.
 */
const ModalConfirm: React.FC<
  PropsWithChildren<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    saving: boolean;
    values: AddStockValue;
    total: number;
    amountByMethod: { method: string; amount: number }[];
    creditThisTransaction: number;
  }>
> = ({ isOpen, onClose, onConfirm, saving, values, total, amountByMethod, creditThisTransaction }) => {
  const currentDebt = +(values.customer?.data?.total_debt ?? 0);

  return (
    <Modal isOpen={isOpen} onRequestClose={saving ? undefined : onClose} bodyClassName="p-4">
      <div className="flex flex-col gap-2.5">
        <div>
          <h2 className="text-lg font-semibold">Simpan transaksi?</h2>
          <p className="mt-0.5 text-sm leading-[17px] text-foreground-muted">
            Jurnalnya ditulis begitu tersimpan dan stok barang langsung berkurang.
          </p>
        </div>

        {/* Satu blok, bukan tiga: identitas, pembayaran, dan total dulu berdiri sebagai
            kotak terpisah dan dialognya jadi tinggi tanpa menambah informasi apa pun. */}
        <div className="flex flex-col gap-1.25 rounded-lg bg-surface-raised px-3.25 py-2.5">
          <DialogRow label="Customer" value={values.customer?.label ?? 'Umum'} />
          <DialogRow label="Barang" value={`${values.stockAdjustment.length}`} />
          <DialogDivider />
          {amountByMethod.map(({ method, amount }) => (
            <DialogRow key={method} label={formatPaymentMethod(method)} value={formatNumber(amount)} />
          ))}
          <DialogDivider />
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold">Total</span>
            <span className="font-mono text-lg font-bold tabular-nums tracking-[-0.02em] text-accent">
              Rp {formatNumber(total)}
            </span>
          </div>
        </div>

        {creditThisTransaction > 0 && (
          <p className="rounded-lg bg-warning-subtle px-3.25 py-2 text-sm leading-[17px] text-warning">
            Piutang {values.customer?.label ?? 'customer'} bertambah {formatNumber(creditThisTransaction)} menjadi{' '}
            {formatNumber(currentDebt + creditThisTransaction)}.
          </p>
        )}

        <div className="mt-1 flex justify-end">
          <Button className="mr-2" size="sm" variant="outline" disabled={saving} onClick={onClose}>
            Batal
          </Button>
          <Button size="sm" loading={saving} onClick={onConfirm}>
            Ya, simpan
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const ModalSummary: React.FC<
  PropsWithChildren<{
    isOpen: boolean;
    onClose: () => void;
    values: AddStockValue;
    created: CreateSaleResponse['transaction'] | null;
    amountByMethod: { method: string; amount: number }[];
  }>
> = ({ isOpen, values, onClose, created, amountByMethod }) => {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const { data: dataSelf } = useFetchMyself();
  const cashier = [dataSelf?.data.user.employee?.first_name, dataSelf?.data.user.employee?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();

  // Fakturnya disusun dari isi form yang baru saja dikirim, lalu dibangkitkan jadi PDF
  // di browser — tanpa mengambil ulang transaksinya ke backend.
  const run = async () => {
    if (!created) return;
    setBusy(true);
    try {
      await downloadInvoice(invoiceFromForm(values, created, cashier), `${created.transaction_code}.pdf`);
    } catch (e) {
      reportError(e, { action: 'download-faktur' });
      toast.error('Faktur gagal dibuat');
    } finally {
      setBusy(false);
    }
  };

  const subtotal = values.totalPrice;
  const total = subtotal + +(values.shippingCost ?? 0) - +(values.discount ?? 0);
  const paid = values.payFull ? total : values.payments.reduce((sum, p) => sum + +(p.payAmount ?? 0), 0);

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} bodyClassName="p-4">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2.25">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
            <Check strokeWidth={3} className="size-3.5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-tight">Transaksi tersimpan</h2>
            <p className="font-mono text-xs text-foreground-subtle">
              {created?.transaction_code}
              {created?.invoice_number ? ` · ${created.invoice_number}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1.25 rounded-lg bg-surface-raised px-3.25 py-2.5">
          <DialogRow label="Customer" value={values.customer?.label ?? 'Umum'} />
          <DialogDivider />
          {amountByMethod.map(({ method, amount }) => (
            <DialogRow key={method} label={formatPaymentMethod(method)} value={formatNumber(amount)} />
          ))}
          <DialogRow
            label="Selisih"
            value={formatNumber(paid - total)}
            tone={paid - total === 0 ? 'success' : 'warning'}
          />
          <DialogDivider />
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold">Total</span>
            <span className="font-mono text-lg font-bold tabular-nums tracking-[-0.02em] text-accent">
              Rp {formatNumber(total)}
            </span>
          </div>
        </div>

        {/* Tiga tombol berbagi tepi kiri-kanan yang sama: aksi utama selebar penuh, dua
            aksi lanjutan membagi baris di bawahnya sama rata. Sebelumnya keduanya rata
            kanan dengan lebar mengikuti panjang teks, jadi tepinya bertingkat-tingkat. */}
        <div className="mt-1 flex flex-col gap-1.5">
          <Button size="sm" fullWidth loading={busy} onClick={run}>
            <Download strokeWidth={1.8} aria-hidden /> Download faktur
          </Button>
          <div className="grid grid-cols-2 gap-1.5">
            <Button size="sm" variant="outline" onClick={() => router.push('/transaction')}>
              Ke halaman transaksi
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              Buat transaksi lagi
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Seluruh isinya sudah memakai token, jadi aman mengikuti tema pengguna.
AddTransactionPage.themeable = true;

export default AddTransactionPage;
