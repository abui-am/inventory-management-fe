/* eslint-disable no-nested-ternary */
import { useFormik } from 'formik';
import React from 'react';
import toast from 'react-hot-toast';

import { PAYMENT_METHOD_OPTIONS_DEBT } from '@/constants/options';
import { useApp } from '@/context/app-context';
import { useUpdateDebt } from '@/hooks/mutation/useMutateDebt';
import { Option } from '@/typings/common';
import { Datum, PayDebtPayload } from '@/typings/debts';
import { formatToIDR } from '@/utils/format';

import { Button } from '../Button';
import Divider from '../Divider';
import { Checkbox, CurrencyTextField, ThemedSelect, WithLabelAndError } from '../Form';
import { validationSchemaPayDebt } from './constant';
export type PayDebtFormValues = {
  debtAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  payFull: boolean;
  amount: number | '';
  paymentMethod: Option;
};

const PayDebtForm: React.FC<{
  debt: Datum;
  onSave?: (data: any) => void;
  onClose: () => void;
  type: 'giro' | 'normal' | 'account-receivable';
}> = ({ debt, type, onSave, onClose }) => {
  const {
    state: { hideLabel },
  } = useApp();
  const { mutateAsync, isLoading } = useUpdateDebt();
  const initialValues: PayDebtFormValues = {
    debtAmount: debt?.amount ? +debt?.amount : 0,
    paidAmount: debt?.paid_amount ? +debt?.paid_amount : 0,
    unpaidAmount: +debt?.amount - +debt?.paid_amount,
    payFull: false,
    amount: '',
    paymentMethod: PAYMENT_METHOD_OPTIONS_DEBT[0],
  };

  const { values, setFieldValue, setSubmitting, handleSubmit, errors, touched } = useFormik({
    validationSchema: validationSchemaPayDebt,
    initialValues,
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      setSubmitting(true);
      const jsonBody: PayDebtPayload = {
        id: debt?.id,
        data: {
          payment_method: values?.paymentMethod?.value,
          paid_amount: values?.payFull ? +values?.unpaidAmount : +values?.amount,
        },
      };
      const res = await mutateAsync(jsonBody);
      setSubmitting(false);
      resetForm();
      onSave?.(res.data);
      toast(res.message);
    },
  });

  return (
    <form onSubmit={handleSubmit} noValidate>
      <section className="max-w-4xl mr-auto ml-auto">
        <div className="mb-4">
          <h6 className="mb-6 text-2xl font-bold">
            {type === 'giro' ? 'Bayar Utang Giro' : type === 'account-receivable' ? 'Terima Piutang' : 'Bayar Utang'}
          </h6>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-base block">
                {type === 'account-receivable' ? 'Jumlah Piutang' : 'Jumlah Utang'}
              </label>
              <span className="text-xl font-bold block">{formatToIDR(values?.debtAmount)}</span>
            </div>
            <div className="sm:col-span-2">
              <label className="text-base block">Yang sudah dibayarkan</label>
              <span className="text-xl font-bold block">{formatToIDR(values?.paidAmount)}</span>
            </div>
            <div className="sm:col-span-2">
              <label className="text-base block">Yang belum dibayarkan</label>
              <span className="text-xl font-bold block">{formatToIDR(values?.unpaidAmount)}</span>
            </div>

            <div className="sm:col-span-2">
              <Divider />
            </div>
            <div className="sm:col-span-2">
              <WithLabelAndError touched={touched} errors={errors} name="amount" label="Jumlah yang mau dibayarkan">
                {values.payFull ? (
                  <div className="h-16 border rounded-md py-4 px-4 w-max">
                    <span className="text-xl text-gray-900 font-bold block">
                      <span className="text-gray-500 mr-3">IDR</span>
                      {formatToIDR(values?.unpaidAmount)}
                    </span>
                  </div>
                ) : (
                  <CurrencyTextField
                    name="amount"
                    value={values.amount}
                    onChange={(val) => {
                      setFieldValue('amount', val);
                    }}
                    placeholder="0"
                  />
                )}
              </WithLabelAndError>

              {!values.payFull && (
                <small className="text-red-500 block">
                  Batas maksimal {formatToIDR(values?.debtAmount - values?.paidAmount)}
                </small>
              )}

              <div className="sm:col-span-2">
                <div className="flex mt-2 mb-2 items-center">
                  <Checkbox
                    name="payFull"
                    onChange={(e: any) => {
                      setFieldValue('amount', values?.unpaidAmount);
                      setFieldValue('payFull', e.target.checked);
                    }}
                  />
                  <label className="text-base ml-1">Seluruhnya</label>
                </div>
              </div>
              <WithLabelAndError
                touched={touched}
                errors={errors}
                name="paymentMethod"
                required
                label="Metode pembayaran"
              >
                <ThemedSelect
                  variant="contained"
                  name="paymentMethod"
                  onChange={(val) => {
                    setFieldValue('paymentMethod', val);
                  }}
                  value={values.paymentMethod}
                  additionalStyle={{
                    control: (provided) => ({ ...provided, minWidth: hideLabel ? 120 : 240 }),
                  }}
                  options={PAYMENT_METHOD_OPTIONS_DEBT}
                />
              </WithLabelAndError>
            </div>
          </div>
        </div>
      </section>
      <div className="mt-8 flex justify-end">
        <div className="flex">
          <Button onClick={onClose} variant="secondary" className="mr-4">
            Batalkan
          </Button>
          <Button disabled={isLoading} type="submit">
            {type === 'giro' ? 'Bayar Utang Giro' : type === 'account-receivable' ? 'Terima Piutang' : 'Bayar Utang'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default PayDebtForm;
