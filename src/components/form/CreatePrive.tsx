import { useFormik } from 'formik';
import { useRouter } from 'next/router';
import React, { useMemo } from 'react';
import toast from 'react-hot-toast';
import { object } from 'yup';

import { useCreateCustomer, useEditCustomer } from '@/hooks/mutation/useMutateCustomer';
import createSchema from '@/utils/validation/formik';

import { Button } from '../Button';
import { DatePickerComponent, TextField, WithLabelAndError } from '../Form';

export type CreatePriveFormValues = {
  description: string;
  amount: number;
  date: Date;
};

const CreatePrive: React.FC<{
  prepaidSalaryId?: string;
  onSave?: (data: any) => void;
}> = ({ prepaidSalaryId, onSave }) => {
  const { mutateAsync } = useCreateCustomer();
  const { mutateAsync: editCustomer } = useEditCustomer(prepaidSalaryId ?? '');
  const initialValues: CreatePriveFormValues = {
    description: '',
    amount: 0,
    date: new Date(),
  };

  const { back } = useRouter();

  const isEdit = !!prepaidSalaryId;

  const validationSchema = useMemo(() => object().shape(createSchema(initialValues)), [initialValues]);

  const { values, setSubmitting, handleSubmit, setFieldValue, errors, touched } = useFormik({
    validationSchema,
    initialValues,
    enableReinitialize: isEdit,
    onSubmit: async (values, { resetForm }) => {
      setSubmitting(true);
      const jsonBody: any = {};
      const res = isEdit ? await editCustomer(jsonBody) : await mutateAsync(jsonBody);
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
              <WithLabelAndError touched={touched} errors={errors} name="description" label="Deskripsi / Keterangan">
                <TextField
                  type="number"
                  hasError={!!touched.description && !!errors.description}
                  placeholder="Masukan deskripsi"
                  value={values.description}
                  name="description"
                  onChange={(description) => setFieldValue('description', description)}
                />
              </WithLabelAndError>
            </div>
            <div className="sm:col-span-2">
              <WithLabelAndError touched={touched} errors={errors} name="amount" label="Jumlah penarikan">
                <TextField
                  type="number"
                  hasError={!!touched.amount && !!errors.amount}
                  placeholder="Masukan nomor telepon"
                  value={values.amount}
                  name="paidDate"
                  onChange={(amount) => setFieldValue('paidDate', amount)}
                />
              </WithLabelAndError>
            </div>
            <div className="sm:col-span-2">
              <WithLabelAndError touched={touched} errors={errors} name="date" label="Tanggal">
                <DatePickerComponent
                  selected={values.date}
                  name="salaryDate"
                  onChange={(date) => setFieldValue('date', date)}
                />
              </WithLabelAndError>
            </div>
          </div>
        </div>
      </section>
      <div className="mt-8 flex justify-end">
        <div className="flex">
          <Button onClick={() => back()} variant="secondary" className="mr-4">
            Batalkan
          </Button>
          <Button type="submit">Tambah Prive</Button>
        </div>
      </div>
    </form>
  );
};

export default CreatePrive;
