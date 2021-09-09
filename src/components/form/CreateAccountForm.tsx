import { useFormik } from 'formik';
import React from 'react';
import { object } from 'yup';

import { CreateAccountReqBody, useCreateAccount } from '@/hooks/mutation/useAuth';
import createSchema from '@/utils/validation/formik';

import { Button } from '../Button';
import { TextField } from '../Form';

export type CreateAccountValue = {
  username: string;
  password: string;
  passwordConfirmation: string;
};

const CreateAccountForm: React.FC<{
  isEdit: boolean;
  employeeId: string;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ isEdit, employeeId, onSuccess, onCancel }) => {
  const initialValues: CreateAccountValue = {
    username: '',
    password: '',
    passwordConfirmation: '',
  };

  const { mutateAsync } = useCreateAccount();

  const { values, handleChange, setSubmitting, handleSubmit, errors } = useFormik({
    validationSchema: object().shape(createSchema(initialValues)),
    initialValues,
    enableReinitialize: isEdit,
    onSubmit: async (values) => {
      const { passwordConfirmation, ...rest } = values;
      setSubmitting(true);

      const jsonBody: CreateAccountReqBody = {
        employee_id: employeeId,
        password_confirmation: passwordConfirmation,
        ...rest,
      };
      await mutateAsync(jsonBody);
      setSubmitting(false);
      if (onSuccess) onSuccess();
    },
  });
  return (
    <form onSubmit={handleSubmit}>
      <section className="w-full">
        <div className="mb-4">
          <h6 className="mb-3 text-lg font-bold">Buat Akun</h6>
          <div className="mb-4">
            <label className="mb-1 inline-block">Nama Awal</label>
            <TextField placeholder="Username" value={values.username} name="username" onChange={handleChange} />
            {errors.username && <span className="text-xs text-red-500">{errors.username}</span>}
          </div>
          <div className="mb-4">
            <label className="mb-1 inline-block">Password</label>
            <TextField
              placeholder="Password"
              type="password"
              value={values.password}
              name="password"
              onChange={handleChange}
            />
            {errors.password && <span className="text-xs text-red-500">{errors.password}</span>}
          </div>
          <div className="mb-4">
            <label className="mb-1 inline-block">konfirmasi password</label>
            <TextField
              placeholder="Password"
              type="password"
              value={values.passwordConfirmation}
              name="passwordConfirmation"
              onChange={handleChange}
            />
            {errors.passwordConfirmation && <span className="text-xs text-red-500">{errors.passwordConfirmation}</span>}
          </div>
          <div className="mt-4 flex justify-end">
            <div className="flex">
              <Button onClick={() => onCancel()} variant="secondary" className="mr-4">
                Batalkan
              </Button>
              <Button type="submit">{isEdit ? 'Edit Akun' : 'Buat Akun'}</Button>
            </div>
          </div>
        </div>
      </section>
    </form>
  );
};

export default CreateAccountForm;
