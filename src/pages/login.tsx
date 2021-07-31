import { useFormik } from 'formik';
import { object } from 'yup';

import { Button } from '@/components/Button';
import { Checkbox, TextField } from '@/components/Form';
import useAuthMutation from '@/hooks/mutation/useAuth';
import createSchema from '@/utils/validation/formik';
export default function Home(): JSX.Element {
  const { mutateAsync } = useAuthMutation('login');
  const initialValues = {
    email: '',
    password: '',
  };
  const { values, handleChange, isSubmitting, handleSubmit } = useFormik({
    validationSchema: object().shape(createSchema(initialValues)),
    initialValues,
    onSubmit: async (values) => {
      await mutateAsync(values);
    },
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 as">
      <form onSubmit={handleSubmit} className="max-w-md flex-col justify-center items-center -mt-16">
        <h1 className="text-4xl font-bold mb-10 text-center">
          Sign in ke <span className="text-blue-600">dashboard</span>
        </h1>
        <div className=" w-full text-center mb-10">
          <span className="text-blueGray-600">Silahkan mengisi form di bawah ini untuk masuk ke dalam dashboard</span>
        </div>
        <div className="max-w-md w-full p-8 shadow-2xl rounded-lg bg-white">
          <div className="mb-3">
            <label className="mb-1 inline-block">Username / Email</label>
            <TextField
              id="email"
              name="email"
              value={values.email}
              placeholder="Email"
              autoComplete="invt-email"
              disabled={isSubmitting}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 inline-block">Password</label>
            <TextField
              id="password"
              name="password"
              type="password"
              value={values.password}
              placeholder="Password"
              autoComplete="invt-password"
              disabled={isSubmitting}
              onChange={handleChange}
            />
          </div>
          <div className="flex mb-4 justify-between">
            <Checkbox>Remember me</Checkbox>
            <a>Lupa password</a>
          </div>
          <div>
            <Button fullWidth type="submit">
              Sign in
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
