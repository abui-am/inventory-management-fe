import Tippy from '@tippyjs/react';
import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { Plus } from 'lucide-react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

import { CurrencyTextField, DatePickerComponent, TextField, WithLabelAndError } from '@/components/Form';
import { SelectSupplier } from '@/components/Select';
import ConfirmStockInDialog from '@/components/stock-in/ConfirmStockInDialog';
import StockInItemTable, { StockInRow } from '@/components/stock-in/StockInItemTable';
import JournalPreviewCard from '@/components/transaction/JournalPreviewCard';
import PartyBalanceCard from '@/components/transaction/PartyBalanceCard';
import PaymentRow, { Payment } from '@/components/transaction/PaymentRow';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { METHODS_ON_CREDIT, PAYMENT_METHOD_OPTIONS } from '@/constants/options';
import { useCreateItems } from '@/hooks/mutation/useMutateItems';
import { useCreateStockIn } from '@/hooks/mutation/useMutateStockIn';
import { cn } from '@/lib/cn';
import { Option } from '@/typings/common';
import { ThemeablePage } from '@/typings/page';
import { CreateStockInBody, Item } from '@/typings/stock-in';
import { SupplierData } from '@/typings/supplier';
import promiseAll from '@/utils/promiseAll';
import reportError from '@/utils/reportError';
import { controlStyle } from '@/utils/style';
import { validationSchemaStockIn } from '@/utils/validation/stock-in';

/** Tanpa awalan "Rp" — kolom dan labelnya sudah menyatakan satuannya. */
const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

const hitungSubtotal = (rows: StockInRow[]) =>
  rows.reduce((total, { qty, buyPrice }) => total + +(qty || 0) * +(buyPrice || 0), 0);

export type AddStockInValue = {
  supplier: Option<SupplierData> | null;
  invoiceNumber: string;
  dateIn: Date;
  memo: string;
  stockAdjustment: StockInRow[];
  payments: Payment[];
  shippingCost: number | '';
  payFull: boolean;
};

const AddStockInPage: NextPage & ThemeablePage = () => {
  const { push } = useRouter();
  const [isOpenConfirm, setIsOpenConfirm] = useState(false);
  const { mutateAsync, isLoading } = useCreateStockIn();
  const { mutateAsync: createItem, isLoading: isLoadingItem } = useCreateItems();

  const initialValues: AddStockInValue = {
    supplier: null,
    invoiceNumber: '',
    dateIn: new Date(),
    memo: '',
    stockAdjustment: [],
    payments: [
      {
        payAmount: '',
        paymentMethod: PAYMENT_METHOD_OPTIONS[0],
        paymentDue: new Date(),
      },
    ],
    shippingCost: '',
    payFull: false,
  };

  const { values, handleChange, errors, isSubmitting, setFieldValue, touched, handleSubmit } =
    useFormik<AddStockInValue>({
      validationSchema: validationSchemaStockIn,
      initialValues,
      onSubmit: async (data, { setSubmitting }) => {
        try {
          setSubmitting(true);

          // Barang yang belum terdaftar dibuat DULU: payload barang masuk hanya mengenal
          // id, jadi barang baru harus sudah punya id sebelum transaksinya dikirim.
          const items = await promiseAll<Item>(
            data.stockAdjustment.map(async ({ isNew, unit, item, buyPrice, memo, qty, itemId }): Promise<Item> => {
              const baseData = {
                note: memo,
                purchase_price: +buyPrice || 0,
                quantity: +qty || 0,
                item_id: itemId,
              };
              if (!isNew) return { id: item?.value ?? '', ...baseData };
              const { data: created } = await createItem({ name: item?.label ?? '', unit, item_id: itemId });
              return { id: created.item.id, ...baseData };
            })
          );

          // promiseAll tidak berhenti di kegagalan pertama — barang yang gagal dibuat
          // hanya HILANG dari hasilnya. Diteruskan, barang masuknya tersimpan tanpa
          // barang itu dan pembayarannya jadi tidak cocok dengan totalnya.
          if (items.errors.length > 0) {
            reportError(items.errors[0], { form: 'stock-in/add', step: 'create-item' });
            toast.error('Barang baru gagal dibuat, jadi barang masuknya belum tersimpan');
            return;
          }

          const payments = (
            data.payFull && data.payments.length === 1
              ? // "Seluruhnya" tidak menyimpan angkanya di form — angkanya diambil dari total
                // saat simpan, supaya tidak basi ketika daftar barang masih berubah sesudah
                // kotaknya dicentang.
                [{ ...data.payments[0], payAmount: total }]
              : data.payments
          ).map(({ paymentMethod, paymentDue, payAmount }) => ({
            payment_method: `${paymentMethod.value}`,
            maturity_date:
              paymentMethod.value !== 'cash' && paymentMethod.value !== 'bank'
                ? dayjs(paymentDue).format('YYYY-MM-DD HH:mm:ss')
                : undefined,
            cash: Number(payAmount ?? 0) || 0,
            // Selalu nol: simpan baru terbuka ketika pembayaran PERSIS sama dengan
            // totalnya, jadi tidak ada kembalian yang bisa muncul.
            change: 0,
          }));

          const jsonBody: CreateStockInBody = {
            transactionable_type: 'suppliers',
            transactionable_id: `${data.supplier?.value ?? ''}`,
            purchase_date: dayjs(data.dateIn).format('YYYY-MM-DD HH:mm:ss'),
            // Backend menomori sendiri bila dikosongkan, sama seperti di penjualan.
            invoice_number: data.invoiceNumber.trim() || null,
            note: data.memo,
            items: items.results,
            payments,
            shipping_cost: +(data.shippingCost ?? 0),
          };

          await mutateAsync(jsonBody);
          setIsOpenConfirm(false);
          push('/stock-in');
        } catch (e) {
          reportError(e, { form: 'stock-in/add' });
          toast.error('Gagal menyimpan barang masuk');
        } finally {
          setSubmitting(false);
        }
      },
    });

  const subtotal = hitungSubtotal(values.stockAdjustment);
  const total = subtotal + +(values.shippingCost ?? 0);

  const totalPaid = values.payFull ? total : values.payments.reduce((prev, curr) => prev + +(curr?.payAmount ?? 0), 0);

  // Bahan preview jurnal dan kartu supplier: nominal per metode, sudah memperhitungkan
  // "Seluruhnya" yang jumlahnya baru ditentukan saat simpan.
  const amountByMethod = values.payments.map((p, i) => ({
    method: p.paymentMethod?.value as string,
    amount: values.payFull && i === 0 ? total : +(p.payAmount ?? 0),
  }));

  const creditThisTransaction = amountByMethod
    .filter(({ method }) => METHODS_ON_CREDIT.includes(method))
    .reduce((jumlah, { amount }) => jumlah + amount, 0);

  /**
   * Apa saja yang masih menghalangi barang masuk ini disimpan.
   *
   * Empat yang pertama karena payloadnya akan ditolak apa adanya — barang tanpa harga
   * beli merusak nilai persediaan, dan barang baru tanpa kode tidak akan pernah ketemu
   * saat dicari kasir. Yang terakhir diminta backend: jumlah pembayaran harus PERSIS
   * sama dengan totalnya, termasuk kalau lebih.
   */
  const blockers: { id: string; isi: React.ReactNode }[] = [];
  const halangan = (id: string, isi: React.ReactNode = id) => blockers.push({ id, isi });

  if (!values.supplier) halangan('Supplier belum dipilih');
  if (values.stockAdjustment.length === 0) halangan('Belum ada barang');
  else {
    if (values.stockAdjustment.some((row) => +(row.buyPrice || 0) <= 0)) halangan('Ada harga beli yang belum diisi');
    if (values.stockAdjustment.some((row) => row.isNew && !row.itemId.trim())) halangan('Kode barang baru belum diisi');
    if (values.stockAdjustment.some((row) => row.isNew && !row.unit.trim())) halangan('Satuan barang baru belum diisi');

    if (totalPaid !== total) {
      const kurang = totalPaid < total;
      const selisih = Math.abs(total - totalPaid);
      halangan(
        `Pembayaran ${kurang ? 'kurang' : 'lebih'}`,
        <>
          Pembayaran {kurang ? 'kurang' : 'lebih'}{' '}
          <span className="font-mono font-semibold tabular-nums">{formatNumber(selisih)}</span>
        </>
      );
    }
  }

  const canSave = blockers.length === 0;
  const disabled = isSubmitting || isLoading || isLoadingItem;

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
      {/* SPEC-44: dua kolom, gap 12px, rel kanan menempel di atas — sama persis dengan
          /transaction/add. Padding luar tidak ditulis di sini; Layout sudah memberinya. */}
      <div className="flex flex-col items-start gap-3 xl:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-2.5">
          {/* SPEC-45..48 — identitas barang masuk */}
          <div className="flex flex-wrap gap-2.25 rounded-card border border-border bg-surface px-3.25 py-2.75 shadow-sm">
            <div className="flex min-w-[180px] flex-1 flex-col">
              <WithLabelAndError required touched={touched} errors={errors} name="supplier" label="Supplier">
                <SelectSupplier
                  name="supplier"
                  instanceId="supplier-barang-masuk"
                  placeholder="Pilih supplier"
                  onChange={(val) => setFieldValue('supplier', val)}
                  value={values.supplier}
                  isDisabled={disabled}
                  additionalStyle={controlStyle}
                />
              </WithLabelAndError>
            </div>

            <div className="flex w-[148px] flex-col">
              <Label htmlFor="dateIn" className="mb-1">
                Tanggal masuk
              </Label>
              <DatePickerComponent
                id="dateIn"
                name="dateIn"
                selected={values.dateIn}
                disabled={disabled}
                className="h-8 rounded-control font-mono"
                onChange={(date) => setFieldValue('dateIn', date)}
              />
            </div>

            <div className="flex w-[148px] flex-col">
              <Label htmlFor="invoiceNumber" className="mb-1">
                Nomor faktur
              </Label>
              {/* Opsional: backend menomori sendiri kalau dikosongkan. */}
              <TextField
                id="invoiceNumber"
                name="invoiceNumber"
                className="h-8 rounded-control font-mono"
                value={values.invoiceNumber}
                placeholder="Otomatis"
                disabled={disabled}
                onChange={handleChange}
              />
            </div>

            <div className="flex min-w-[180px] flex-1 flex-col">
              <Label htmlFor="memo" className="mb-1">
                Catatan
              </Label>
              <TextField
                id="memo"
                name="memo"
                className="h-8 rounded-control"
                value={values.memo}
                placeholder="Opsional"
                disabled={disabled}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* SPEC-49..52 — barang */}
          <StockInItemTable
            items={values.stockAdjustment}
            onChange={(rows) => setFieldValue('stockAdjustment', rows)}
            disabled={disabled}
          />

          {/* SPEC-53 — pembayaran ke supplier */}
          <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border bg-surface-raised px-3.25 py-2.25">
              {/* Sama dengan judul seksi di rincian barang masuk: yang dibayar di sini
                  adalah supplier, bukan kita yang menerima. */}
              <span className="text-base font-semibold">Pembayaran ke supplier</span>

              <div className="flex items-center gap-2.5">
                {values.payments.length === 1 && (
                  <label htmlFor="payFull" className="flex cursor-pointer items-center gap-1.5 text-sm">
                    <Checkbox
                      id="payFull"
                      name="payFull"
                      checked={values.payFull}
                      disabled={disabled}
                      onChange={(e) => setFieldValue('payFull', e.target.checked)}
                    />
                    Seluruhnya
                  </label>
                )}

                {!values.payFull && values.payments.length < 2 && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={disabled}
                    onClick={() => {
                      setFieldValue('payments', [
                        ...values.payments,
                        {
                          paymentMethod: PAYMENT_METHOD_OPTIONS.filter(
                            (val) => val.value !== values?.payments?.[0]?.paymentMethod?.value
                          )[0],
                          payAmount: Math.max(total - +(values.payments[0]?.payAmount ?? 0), 0),
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
                key={payment.paymentMethod?.value ?? index}
                value={payment}
                disabled={disabled}
                fixedAmount={values.payFull && index === 0 ? total : undefined}
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

        {/* SPEC-54 — rel ringkasan */}
        <div className="flex w-full flex-col gap-2.5 xl:sticky xl:top-3.5 xl:w-[284px] xl:shrink-0">
          <div className="flex flex-col gap-2.5 rounded-card border border-border bg-surface px-3.75 py-3.25 shadow-sm">
            <span className="text-base font-semibold">Ringkasan</span>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-muted">Subtotal</span>
                <span className="font-mono tabular-nums">{formatNumber(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between gap-2 text-sm">
                <Label htmlFor="shippingCost">Ongkos kirim</Label>
                <CurrencyTextField
                  name="shippingCost"
                  value={values.shippingCost}
                  placeholder="0"
                  disabled={disabled}
                  prefix=""
                  className="h-8 w-[92px] rounded-control px-2.5 text-right font-mono"
                  onChange={(val) => setFieldValue('shippingCost', val ?? '')}
                />
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-baseline justify-between gap-2">
              <span className="text-base font-semibold">Total</span>
              <span className="font-mono text-xl font-bold tabular-nums tracking-[-0.025em] text-accent">
                {formatNumber(total)}
              </span>
            </div>

            <div className="flex flex-col gap-1.25 rounded-lg bg-surface-raised px-2.75 py-2.25">
              <div className="flex justify-between text-sm">
                <span className="text-foreground-muted">Dibayarkan</span>
                <span className="font-mono font-medium tabular-nums">{formatNumber(totalPaid)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground-muted">Selisih</span>
                <span
                  className={cn(
                    'font-mono font-semibold tabular-nums',
                    totalPaid === total ? 'text-success' : 'text-destructive'
                  )}
                >
                  {formatNumber(total - totalPaid)}
                </span>
              </div>
            </div>

            {/*
              Tippy dipasang di SPAN pembungkus, bukan di tombolnya: tombol yang disabled
              memakai `pointer-events: none`, jadi ia tidak pernah mengirim event hover —
              tooltipnya tidak akan pernah muncul justru pada satu-satunya keadaan yang
              perlu dijelaskan.
            */}
            <Tippy
              content={
                <div className="flex flex-col gap-0.75">
                  {blockers.map(({ id, isi }) => (
                    <span key={id}>{isi}</span>
                  ))}
                </div>
              }
              disabled={canSave}
              placement="top"
              delay={[250, 0]}
            >
              <span className="block">
                <Button size="sm" fullWidth type="submit" disabled={!canSave || disabled}>
                  Simpan sebagai Menunggu
                </Button>
              </span>
            </Tippy>

            {/* Tombolnya menyebut statusnya, keterangannya menyebut akibatnya — keduanya
                dibutuhkan: "Menunggu" tidak memberi tahu bahwa stok belum bergerak. */}
            <span className="text-2xs leading-[15px] text-foreground-subtle">
              Stok dan jurnal belum berubah. Keduanya baru berjalan setelah barang masuk ini dikonfirmasi.
            </span>
          </div>

          <PartyBalanceCard
            variant="supplier"
            name={values.supplier?.label}
            currentDebt={+(values.supplier?.data?.total_receivable ?? 0)}
            creditThisTransaction={creditThisTransaction}
          />

          <JournalPreviewCard
            variant="purchase"
            payments={amountByMethod}
            total={total}
            shippingCost={+(values.shippingCost ?? 0)}
          />
        </div>
      </div>

      <ConfirmStockInDialog
        isOpen={isOpenConfirm}
        onClose={() => setIsOpenConfirm(false)}
        onConfirm={handleSubmit}
        saving={disabled}
        supplier={values.supplier?.label}
        itemCount={values.stockAdjustment.length}
        newItemCount={values.stockAdjustment.filter((row) => row.isNew).length}
        amountByMethod={amountByMethod}
        total={total}
        currentDebt={+(values.supplier?.data?.total_receivable ?? 0)}
        creditThisTransaction={creditThisTransaction}
      />
    </form>
  );
};

AddStockInPage.themeable = true;

export default AddStockInPage;
