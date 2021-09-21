import { useFormik } from 'formik';
import { object } from 'yup';

import { Button } from '@/components/Button';
import { Checkbox, TextField, WithLabelAndError } from '@/components/Form';
import useAuthMutation from '@/hooks/mutation/useAuth';
import createSchema from '@/utils/validation/formik';
export default function Home(): JSX.Element {
  const { mutateAsync, isLoading } = useAuthMutation('login');
  const initialValues = {
    usernameEmail: '',
    password: '',
  };
  const { values, handleChange, errors, isSubmitting, handleSubmit, touched } = useFormik({
    validationSchema: object().shape(createSchema(initialValues)),
    initialValues,
    onSubmit: async (values) => {
      await mutateAsync({
        email: values.usernameEmail,
        password: values.password,
      });
    },
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 p-6">
      <form onSubmit={handleSubmit} className="max-w-md flex-col justify-center items-center -mt-16">
        <h1 className="text-4xl font-bold mb-10 text-center">
          Sign in ke <span className="text-blue-600">dashboard</span>
        </h1>
        <div className=" w-full text-center mb-10">
          <span className="text-blueGray-600">Silahkan mengisi form di bawah ini untuk masuk ke dalam dashboard</span>
        </div>
        <div className="max-w-md w-full p-8 shadow-2xl rounded-lg bg-white">
          <div className="mb-3">
            <WithLabelAndError label="Username / Email" touched={touched} errors={errors} name="usernameEmail">
              <TextField
                id="usernameEmail"
                name="usernameEmail"
                value={values.usernameEmail}
                placeholder="Email"
                autoComplete="invt-email"
                disabled={isSubmitting}
                onChange={handleChange}
                hasError={!!errors.usernameEmail}
              />
            </WithLabelAndError>
          </div>
          <div className="mb-3">
            <WithLabelAndError name="password" label="Password" touched={touched} errors={errors}>
              <TextField
                id="password"
                name="password"
                type="password"
                value={values.password}
                placeholder="Password"
                autoComplete="invt-password"
                disabled={isSubmitting}
                onChange={handleChange}
                hasError={!!errors.password}
              />
            </WithLabelAndError>
          </div>
          <div className="flex mb-4 justify-between">
            <Checkbox>Remember me</Checkbox>
            <a>Lupa password</a>
          </div>
          <div>
            <Button fullWidth type="submit" disabled={isLoading}>
              Sign in
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
