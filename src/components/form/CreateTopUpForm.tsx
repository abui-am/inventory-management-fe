import { useFormik } from 'formik';
import React, { useMemo } from 'react';
import toast from 'react-hot-toast';

import { useCreateLedgerTopUp } from '@/hooks/mutation/useMutateLedgerTopUp';
import { useFetchUnpaginatedLedgerAccounts } from '@/hooks/query/useFetchLedgerAccount';
import { Option } from '@/typings/common';
import { CreateLedgerTopUpPayload } from '@/typings/ledger-top-up';

import { Button } from '../Button';
import { CurrencyTextField, ThemedSelect, WithLabelAndError } from '../Form';
import { validationSchemaLedgerTopUp } from './constant';

export type CreateTopUpFormValues = {
  ledger: Option | null;
  amount: number | null;
  paymentMethod: Option | null;
};

export const paymentMethodOptions = [
  {
    label: 'Kas',
    value: 'cash',
  },
  {
    label: 'Bank',
    value: 'bank',
  },
  {
    label: 'Giro',
    value: 'current_account',
  },
  {
    label: 'Uang Pribadi',
    value: 'personal_money',
  },
];

const CreateTopUp: React.FC<{
  onSave?: (data: any) => void;
  onClose?: () => void;
}> = ({ onSave, onClose }) => {
  const { mutateAsync, isLoading } = useCreateLedgerTopUp();
  const initialValues: CreateTopUpFormValues = {
    ledger: null,
    amount: null,
    paymentMethod: null,
  };
  const { data: dataResLedger } = useFetchUnpaginatedLedgerAccounts();
  const [isConfirmed, setConfirmed] = React.useState(false);
  const { values, setSubmitting, handleSubmit, setFieldValue, errors, touched } = useFormik({
    validationSchema: validationSchemaLedgerTopUp,
    initialValues,
    enableReinitialize: false,
    onSubmit: async (values, { resetForm }) => {
      setSubmitting(true);
      const jsonBody: CreateLedgerTopUpPayload = {
        amount: values?.amount ?? 0,
        payment_method: values?.paymentMethod?.value ?? '',
        ledger_account_id: values.ledger?.value ?? '',
      };
      const res = await mutateAsync(jsonBody);
      setConfirmed(false);
      setSubmitting(false);
      resetForm();
      onSave?.(res.data);
      toast(res.message);
    },
  });

  const typeOptions = useMemo(
    () =>
      dataResLedger?.data?.ledger_accounts
        .map?.(({ name, id, ...props }) => ({
          label: name,
          value: id,
          data: props,
        }))
        .filter((val) =>
          ['Kas', 'Giro', 'Bank'].filter((val) => val !== values?.paymentMethod?.label).includes(val.label)
        ) ?? [],
    [dataResLedger, values]
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <section className="max-w-4xl mr-auto ml-auto">
        <div className="mb-4">
          <h6 className="mb-3 text-lg font-bold">Konversi Saldo</h6>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <WithLabelAndError required touched={touched} errors={errors} name="paymentMethod" label="Dari">
                <ThemedSelect
                  value={values.paymentMethod}
                  options={paymentMethodOptions}
                  name="paymentMethod"
                  getPopupContainer={(trigger: any) => trigger.parentNode}
                  onChange={(value) => setFieldValue('paymentMethod', value)}
                />
              </WithLabelAndError>
            </div>

            <div className="sm:col-span-2">
              {typeOptions?.length > 1 && (
                <WithLabelAndError required touched={touched} errors={errors} name="ledger" label="Kepada Akun">
                  <ThemedSelect
                    getPopupContainer={(trigger: any) => trigger.parentNode}
                    onChange={(val) => setFieldValue('ledger', val)}
                    options={typeOptions}
                  />
                </WithLabelAndError>
              )}
            </div>
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
          </div>
        </div>
        {isConfirmed && <div className="text-red-500">Pastikan semuanya sudah terisi secara benar!</div>}
      </section>
      <div className="mt-8 flex justify-end">
        <div className="flex">
          <Button onClick={onClose} variant="secondary" className="mr-4">
            Batalkan
          </Button>
          {!isConfirmed ? (
            <Button
              disabled={isLoading}
              onClick={(e) => {
                e.preventDefault();
                setConfirmed(true);
              }}
              type="button"
            >
              Konversi
            </Button>
          ) : (
            <Button variant="danger" disabled={isLoading} type="submit">
              Konfirmasi
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

export default CreateTopUp;
