import { useFormik } from 'formik';
import React, { useEffect } from 'react';
import toast from 'react-hot-toast';

import { useCreateAdvancePayrolls } from '@/hooks/mutation/useMutateAdvancePayrolls';
import { useFetchEmployeeById } from '@/hooks/query/useFetchEmployee';
import { CreateAdvancePayrollsPayload } from '@/typings/advance-payrolls';
import { Option } from '@/typings/common';
import { formatDateYYYYMM, formatToIDR } from '@/utils/format';
import { prepaidSalarySchema } from '@/utils/validation/pre-paid-salary';

import { Button } from '../Button';
import { CurrencyTextField, DatePickerComponent, WithLabelAndError } from '../Form';
import { SelectSender } from '../Select';

export type CreatePrepaidSalaryFormValues = {
  employee: Option | null;
  amount: number;
  salaryDate: Date;
  salary: number;
};

const CreatePrepaidSalary: React.FC<{
  prepaidSalaryId?: string;
  onSave?: (data: any) => void;
  onClose?: () => void;
}> = ({ onSave, onClose }) => {
  const { mutateAsync, isLoading } = useCreateAdvancePayrolls();
  const initialValues: CreatePrepaidSalaryFormValues = {
    employee: null,
    amount: 0,
    salaryDate: new Date(),
    salary: 0,
  };

  const validationSchema = prepaidSalarySchema();

  const { values, setSubmitting, handleSubmit, setFieldValue, errors, touched } = useFormik({
    validationSchema,
    initialValues,
    validateOnChange: true,
    onSubmit: async (values, { resetForm }) => {
      try {
        setSubmitting(true);
        const jsonBody: CreateAdvancePayrollsPayload = {
          employee_id: values.employee?.value ?? '',
          amount: values.amount,
          payroll_month: formatDateYYYYMM(values.salaryDate),
        };
        const res = await mutateAsync(jsonBody);
        setSubmitting(false);
        resetForm();
        onSave?.(res.data);
        toast(res.message);
      } catch (e) {
        toast.error('Error');
      }
    },
  });

  const { data, isFetching } = useFetchEmployeeById(values?.employee?.value as string);

  useEffect(() => {
    setFieldValue('salary', data?.data?.employee?.salary);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFetching, data?.data.employee.salary]);

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
                  onChange={(e) => setFieldValue('employee', e)}
                />
              </WithLabelAndError>
            </div>
            <div className="sm:col-span-2">
              <WithLabelAndError touched={touched} errors={errors} name="amount" label="Jumlah gaji">
                <CurrencyTextField
                  disabled={!values?.salary}
                  placeholder="Masukan jumlah gaji"
                  value={values.amount}
                  name="amount"
                  onChange={(e) => setFieldValue('amount', e)}
                />
                <span className="text-red-500 mt-2 block">Batas maksimal {formatToIDR(values?.salary ?? 0)}</span>
              </WithLabelAndError>
            </div>
            <div className="sm:col-span-2">
              <WithLabelAndError touched={touched} errors={errors} name="salaryDate" label="Bulan Gajian">
                <DatePickerComponent
                  selected={values.salaryDate}
                  name="salaryDate"
                  dateFormat="MMMM yyyy"
                  showMonthYearPicker
                  onChange={(date) => setFieldValue('salaryDate', date)}
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
            Tambah Gaji dibayar di Muka
          </Button>
        </div>
      </div>
    </form>
  );
};

export default CreatePrepaidSalary;
