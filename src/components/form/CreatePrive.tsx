import { useFormik } from 'formik';
import React from 'react';
import toast from 'react-hot-toast';

import { useCreatePrive } from '@/hooks/mutation/useMutatePrives';
import { Option } from '@/typings/common';
import { CreatePrivePayload } from '@/typings/prives';
import { formatDateYYYYMMDD } from '@/utils/format';

import { Button } from '../Button';
import { CurrencyTextField, DatePickerComponent, TextField, ThemedSelect, WithLabelAndError } from '../Form';
import { validationSchemaPrive } from './constant';

export type CreatePriveFormValues = {
  description: string;
  amount: number | null;
  date: Date;
  transactionType: Option | null;
};

export const transactionTypeOptions = [
  {
    label: 'Cash',
    value: 'cash',
  },
  {
    label: 'Bank',
    value: 'bank',
  },
];

const CreatePrive: React.FC<{
  prepaidSalaryId?: string;
  onSave?: (data: any) => void;
  onClose?: () => void;
}> = ({ prepaidSalaryId, onSave, onClose }) => {
  const { mutateAsync, isLoading } = useCreatePrive();
  const initialValues: CreatePriveFormValues = {
    description: '',
    amount: null,
    date: new Date(),
    transactionType: transactionTypeOptions[0],
  };

  const isEdit = !!prepaidSalaryId;

  const { values, setSubmitting, handleSubmit, setFieldValue, errors, touched } = useFormik({
    validationSchema: validationSchemaPrive,
    initialValues,
    enableReinitialize: isEdit,
    onSubmit: async (values, { resetForm }) => {
      setSubmitting(true);
      const jsonBody: CreatePrivePayload = {
        amount: values?.amount ?? 0,
        description: values?.description,
        prive_date: formatDateYYYYMMDD(values?.date),
        transaction_method: values?.transactionType?.value ?? '',
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
          <h6 className="mb-3 text-lg font-bold">Prive</h6>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <WithLabelAndError required touched={touched} errors={errors} name="amount" label="Jumlah penarikan">
                <CurrencyTextField
                  placeholder="Masukan jumlah penarikan"
                  value={values.amount?.toString()}
                  name="amount"
                  onChange={(amount) => setFieldValue('amount', amount)}
                />
              </WithLabelAndError>
            </div>
            <div className="sm:col-span-2">
              <WithLabelAndError required touched={touched} errors={errors} name="date" label="Tanggal">
                <DatePickerComponent
                  selected={values.date}
                  name="date"
                  onChange={(date) => setFieldValue('date', date)}
                />
              </WithLabelAndError>
            </div>
            <div className="sm:col-span-2">
              <WithLabelAndError
                required
                touched={touched}
                errors={errors}
                name="transactionType"
                label="Metode transaksi"
              >
                <ThemedSelect
                  value={values.transactionType}
                  options={transactionTypeOptions}
                  name="transactionType"
                  onChange={(value) => setFieldValue('transactionType', value)}
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
            Tambah Prive
          </Button>
        </div>
      </div>
    </form>
  );
};

export default CreatePrive;
