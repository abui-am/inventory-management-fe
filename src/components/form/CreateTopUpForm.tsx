import { useFormik } from 'formik';
import React from 'react';
import toast from 'react-hot-toast';

import { useCreateLedgerTopUp } from '@/hooks/mutation/useMutateLedgerTopUp';
import { Option } from '@/typings/common';
import { CreateLedgerTopUpPayload } from '@/typings/ledger-top-up';

import { Button } from '../Button';
import { CurrencyTextField, ThemedSelect, WithLabelAndError } from '../Form';
import { validationSchemaLedgerTopUp } from './constant';

export type CreateTopUpFormValues = {
  amount: number | null;
  paymentMethod: Option | null;
};

export const paymentMethodOptions = [
  {
    label: 'Cash',
    value: 'cash',
  },
  {
    label: 'Bank',
    value: 'bank',
  },
  {
    label: 'Uang Pribadi',
    value: 'personal_money',
  },
];

const CreateTopUp: React.FC<{
  onSave?: (data: any) => void;
  onClose?: () => void;
  ledgerAccountId: string;
}> = ({ onSave, onClose, ledgerAccountId }) => {
  const { mutateAsync } = useCreateLedgerTopUp();
  const initialValues: CreateTopUpFormValues = {
    amount: null,
    paymentMethod: null,
  };

  const { values, setSubmitting, handleSubmit, setFieldValue, errors, touched } = useFormik({
    validationSchema: validationSchemaLedgerTopUp,
    initialValues,
    enableReinitialize: false,
    onSubmit: async (values, { resetForm }) => {
      setSubmitting(true);
      const jsonBody: CreateLedgerTopUpPayload = {
        amount: values?.amount ?? 0,
        payment_method: values?.paymentMethod?.value ?? '',
        ledger_account_id: ledgerAccountId,
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
          <h6 className="mb-3 text-lg font-bold">Top Up Saldo</h6>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <WithLabelAndError required touched={touched} errors={errors} name="amount" label="Saldo">
                <CurrencyTextField
                  placeholder="Masukan saldo"
                  value={values.amount?.toString()}
                  name="amount"
                  onChange={(amount) => setFieldValue('amount', amount)}
                />
              </WithLabelAndError>
            </div>
            <div className="sm:col-span-2">
              <WithLabelAndError
                required
                touched={touched}
                errors={errors}
                name="paymentMethod"
                label="Metode pembayaran"
              >
                <ThemedSelect
                  value={values.paymentMethod}
                  options={paymentMethodOptions}
                  name="paymentMethod"
                  onChange={(value) => setFieldValue('paymentMethod', value)}
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
          <Button type="submit">Tambah Prive</Button>
        </div>
      </div>
    </form>
  );
};

export default CreateTopUp;
