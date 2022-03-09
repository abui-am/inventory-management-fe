import { useFormik } from 'formik';
import { useRouter } from 'next/router';
import React, { useMemo } from 'react';
import toast from 'react-hot-toast';
import { object } from 'yup';

import { useCreateCustomer, useEditCustomer } from '@/hooks/mutation/useMutateCustomer';
import { formatToIDR } from '@/utils/format';
import createSchema from '@/utils/validation/formik';

import { Button } from '../Button';
import Divider from '../Divider';
import { TextField, WithLabelAndError } from '../Form';
export type PayDebtFormValues = {
  salary: number;
  paidAmount: number;
  amount: number;
};

const PayDebtForm: React.FC<{
  prepaidSalaryId?: string;
  onSave?: (data: any) => void;
  type: 'giro' | 'normal';
}> = ({ prepaidSalaryId, type, onSave }) => {
  const { mutateAsync } = useCreateCustomer();
  const { mutateAsync: editCustomer } = useEditCustomer(prepaidSalaryId ?? '');
  const initialValues: PayDebtFormValues = {
    salary: 0,
    paidAmount: 0,
    amount: 0,
  };

  const { back } = useRouter();

  const isEdit = !!prepaidSalaryId;

  const validationSchema = useMemo(() => object().shape(createSchema(initialValues)), [initialValues]);

  const { values, handleChange, setSubmitting, handleSubmit, errors, touched } = useFormik({
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
          <h6 className="mb-6 text-2xl font-bold">{type === 'giro' ? 'Bayar Utang Giro' : 'Bayar Utang'}</h6>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-base block">Jumlah Utang</label>
              <span className="text-xl font-bold block">{formatToIDR(values?.salary)}</span>
            </div>
            <div className="sm:col-span-2">
              <label className="text-base block">Yang sudah dibayarkan</label>
              <span className="text-xl font-bold block">{formatToIDR(values?.paidAmount)}</span>
            </div>

            <div className="sm:col-span-2">
              <Divider />
            </div>
            <div className="sm:col-span-2">
              <WithLabelAndError touched={touched} errors={errors} name="amount" label="Jumlah yang mau dibayarkan">
                <TextField name="amount" value={values.amount} onChange={handleChange} placeholder="0" type="number" />
              </WithLabelAndError>
              <small className="text-red-500">Batas maksimal {formatToIDR(values?.salary)}</small>
            </div>
          </div>
        </div>
      </section>
      <div className="mt-8 flex justify-end">
        <div className="flex">
          <Button onClick={() => back()} variant="secondary" className="mr-4">
            Batalkan
          </Button>
          <Button type="submit">{type === 'giro' ? 'Bayar Urang Giro' : 'Bayar Utang'}</Button>
        </div>
      </div>
    </form>
  );
};

export default PayDebtForm;
