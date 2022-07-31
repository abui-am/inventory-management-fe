import { useFormik } from 'formik';
import React from 'react';
import toast from 'react-hot-toast';

import { useUpdatePayroll } from '@/hooks/mutation/useMutateSalary';
import { Option } from '@/typings/common';
import { Datum as Payroll, PayPayrollPayload } from '@/typings/salary';
import { formatToIDR } from '@/utils/format';
import { salarySchema } from '@/utils/validation/pay-salary';

import { Button } from '../Button';
import Divider from '../Divider';
import { Checkbox, CurrencyTextField, ThemedSelect, WithLabelAndError } from '../Form';

export type PaySalaryFormValues = {
  salary: number;
  paidAmount: number;
  amount: number | null;
  payFull: boolean;
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

const PaySalaryForm: React.FC<{
  payroll: Payroll;
  onSave?: (data: any) => void;
  onClose: (data: any) => void;
}> = ({ onSave, onClose, payroll }) => {
  const { mutateAsync } = useUpdatePayroll();
  const initialValues: PaySalaryFormValues = {
    salary: payroll.employee_salary,
    paidAmount: payroll.paid_amount,
    amount: null,
    payFull: false,
    transactionType: transactionTypeOptions[0],
  };

  const { values, handleChange, setFieldValue, setSubmitting, handleSubmit, errors, touched } = useFormik({
    validationSchema: salarySchema,
    validateOnChange: true,
    validateOnBlur: true,
    initialValues,
    onSubmit: async (values, { resetForm }) => {
      setSubmitting(true);
      const jsonBody: PayPayrollPayload = {
        id: payroll.id,
        data: {
          amount: values?.payFull ? values?.salary - values?.paidAmount : values?.amount ?? 0,
          payment_method: values?.transactionType?.value ?? '',
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
          <h6 className="mb-6 text-2xl font-bold">Bayar Gaji</h6>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-base block">Gaji per bulan</label>
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
                {/* <TextField
                  name="amount"
                  value={values.amount as number}
                  onChange={handleChange}
                  placeholder="0"
                  type="number"
                  disabled={values.payFull}
                /> */}
                <CurrencyTextField
                  disabled={values?.payFull}
                  name="amount"
                  value={values.amount}
                  onChange={(val) => {
                    setFieldValue('amount', val);
                  }}
                  placeholder="0"
                />
              </WithLabelAndError>
              {!values.payFull && (
                <div>
                  <small className="text-red-500">Batas maksimal {formatToIDR(values?.salary)}</small>
                </div>
              )}

              <div className="sm:col-span-2">
                <div className="flex mt-2 items-center mb-2">
                  <Checkbox name="payFull" onChange={handleChange} />
                  <label className="text-base ml-1">Lunas</label>
                </div>
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
        </div>
      </section>
      <div className="mt-8 flex justify-end">
        <div className="flex">
          <Button onClick={onClose} variant="secondary" className="mr-4">
            Batalkan
          </Button>
          <Button type="submit">Bayar Gaji</Button>
        </div>
      </div>
    </form>
  );
};

export default PaySalaryForm;
