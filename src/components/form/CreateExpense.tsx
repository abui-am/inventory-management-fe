import { useFormik } from 'formik';
import React from 'react';
import toast from 'react-hot-toast';

import { useCreateExpense } from '@/hooks/mutation/useMutateExpense';
import { Option } from '@/typings/common';
import { CreateExpensePayload } from '@/typings/expense';

import { Button } from '../Button';
import { CurrencyTextField, TextField, ThemedSelect, WithLabelAndError } from '../Form';
import { validationSchemaLedgerTopUp } from './constant';

export type CreateExpenseFormValues = {
  name: string;
  description: string;
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
];

const CreateExpense: React.FC<{
  onSave?: (data: any) => void;
  onClose?: () => void;
}> = ({ onSave, onClose }) => {
  const { mutateAsync, isLoading } = useCreateExpense();
  const initialValues: CreateExpenseFormValues = {
    amount: null,
    description: '',
    name: '',
    paymentMethod: null,
  };

  const { values, setSubmitting, handleSubmit, setFieldValue, errors, touched } = useFormik({
    validationSchema: validationSchemaLedgerTopUp,
    initialValues,
    enableReinitialize: false,
    onSubmit: async (values, { resetForm }) => {
      setSubmitting(true);
      const jsonBody: CreateExpensePayload = {
        amount: values.amount ? values.amount : 0,
        date: null,
        description: values.description,
        name: values.name,
        payment_method: values.paymentMethod?.value ?? '',
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
          <h6 className="mb-3 text-lg font-bold">Konversi Saldo</h6>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <WithLabelAndError required touched={touched} errors={errors} name="name" label="Nama beban">
                <TextField
                  hasError={!!touched.name && !!errors.name}
                  placeholder="Masukan deskripsi"
                  value={values.name}
                  name="name"
                  onChange={(name) => setFieldValue('name', name.target.value)}
                />
              </WithLabelAndError>
            </div>
            <div className="sm:col-span-2">
              <WithLabelAndError
                required
                touched={touched}
                errors={errors}
                name="description"
                label="Deskripsi / Keterangan"
              >
                <TextField
                  hasError={!!touched.description && !!errors.description}
                  placeholder="Masukan deskripsi"
                  value={values.description}
                  name="description"
                  onChange={(description) => setFieldValue('description', description.target.value)}
                />
              </WithLabelAndError>
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
          </div>
        </div>
      </section>
      <div className="mt-8 flex justify-end">
        <div className="flex">
          <Button onClick={onClose} variant="secondary" className="mr-4">
            Batalkan
          </Button>
          <Button disabled={isLoading} type="submit">
            Tulis Beban
          </Button>
        </div>
      </div>
    </form>
  );
};

export default CreateExpense;
