import { useFormik } from 'formik';
import { useRouter } from 'next/router';
import React, { useMemo } from 'react';
import toast from 'react-hot-toast';
import { object } from 'yup';

import { useCreateCustomer, useEditCustomer } from '@/hooks/mutation/useMutateCustomer';
import { Option } from '@/typings/common';
import { formatToIDR } from '@/utils/format';
import createSchema from '@/utils/validation/formik';

import { Button } from '../Button';
import { DatePickerComponent, TextField, WithLabelAndError } from '../Form';
import { SelectSender } from '../Select';

export type CreatePrepaidSalaryFormValues = {
  employee: Option | null;
  amount: number;
  salaryDate: Date;
};

const CreatePrepaidSalary: React.FC<{
  prepaidSalaryId?: string;
  onSave?: (data: any) => void;
}> = ({ prepaidSalaryId, onSave }) => {
  const { mutateAsync } = useCreateCustomer();
  const { mutateAsync: editCustomer } = useEditCustomer(prepaidSalaryId ?? '');
  const initialValues: CreatePrepaidSalaryFormValues = {
    employee: null,
    amount: 0,
    salaryDate: new Date(),
  };

  const { back } = useRouter();

  const isEdit = !!prepaidSalaryId;

  const validationSchema = useMemo(() => object().shape(createSchema(initialValues)), [initialValues]);

  const { values, handleChange, setSubmitting, handleSubmit, setFieldValue, errors, touched } = useFormik({
    validationSchema,
    initialValues,
    enableReinitialize: isEdit,
    onSubmit: async (values, { resetForm }) => {
      setSubmitting(true);
      const jsonBody: any = {
        employee_id: values.employee?.data?.id,
        amount: values.amount,
        salary_date: values.salaryDate,
      };
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
          <h6 className="mb-3 text-lg font-bold">Gaji dibayar dimuka</h6>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <WithLabelAndError touched={touched} errors={errors} name="employee" label="Nama karyawan">
                <SelectSender
                  placeholder="Masukan nama karyawan"
                  value={values.employee}
                  name="employee"
                  onChange={handleChange}
                />
              </WithLabelAndError>
            </div>
            <div className="sm:col-span-2">
              <WithLabelAndError touched={touched} errors={errors} name="amount" label="Jumlah gaji">
                <TextField
                  type="number"
                  hasError={!!touched.amount && !!errors.amount}
                  placeholder="Masukan nomor telepon"
                  value={values.amount}
                  name="paidDate"
                  onChange={(amount) => setFieldValue('paidDate', amount)}
                />
                <span className="text-red-500 mt-2 block">
                  Batas maksimal {formatToIDR(values.employee?.data?.salary as number)}
                </span>
              </WithLabelAndError>
            </div>
            <div className="sm:col-span-2">
              <WithLabelAndError touched={touched} errors={errors} name="salaryDate" label="Bulan Gajian">
                <DatePickerComponent
                  selected={values.salaryDate}
                  name="salaryDate"
                  onChange={(date) => setFieldValue('salaryDate', date)}
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
          <Button type="submit">{isEdit ? 'Edit Customer' : 'Tambah Customer'}</Button>
        </div>
      </div>
    </form>
  );
};

export default CreatePrepaidSalary;
