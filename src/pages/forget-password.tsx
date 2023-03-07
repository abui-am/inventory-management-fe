import { useFormik } from 'formik';
import { useRouter } from 'next/router';
import { object } from 'yup';

import { Button } from '@/components/Button';
import { TextField, WithLabelAndError } from '@/components/Form';
import { useResetPassword } from '@/hooks/mutation/useAuth';
import { useKeyPressEnter } from '@/hooks/useKeyHandler';
import createSchema from '@/utils/validation/formik';
export default function Home(): JSX.Element {
  const { query } = useRouter();
  const initialValues = {
    newPassword: '',
    confirmPassword: '',
  };

  const { mutateAsync, isLoading } = useResetPassword();
  const { values, handleChange, errors, isSubmitting, handleSubmit, touched } = useFormik({
    validationSchema: object().shape(createSchema(initialValues)),
    initialValues,
    onSubmit: async (values) => {
      const data = {
        token: query.token as string,
        password_confirmation: values.confirmPassword,
        password: values.newPassword,
      };
      mutateAsync(data);
    },
  });

  const { push } = useRouter();
  const handleKey = useKeyPressEnter(() => {
    push('/login');
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 p-6">
      <form onSubmit={handleSubmit} className="max-w-md flex-col justify-center items-center -mt-16">
        <h1 className="text-4xl font-bold mb-10 text-center">
          Ubah <span className="text-blue-600">Kata Sandi</span>
        </h1>
        <div className=" w-full text-center mb-10">
          <span className="text-blueGray-600">Pastikan kata sandi baru anda kuat dan mudah diingat</span>
        </div>
        <div className="max-w-md w-screen p-8 shadow-2xl rounded-lg bg-white">
          <div className="mb-3">
            <WithLabelAndError label="Kata sandi baru" touched={touched} errors={errors} name="newPassword">
              <TextField
                id="newPassword"
                name="newPassword"
                placeholder="Masukan kata sandi baru"
                type="password"
                value={values.newPassword}
                disabled={isSubmitting}
                onChange={handleChange}
              />
            </WithLabelAndError>
          </div>
          <div className="mb-8">
            <WithLabelAndError name="confirmPassword" label="Konfirmasi kata sandi" touched={touched} errors={errors}>
              <TextField
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Konfirmasi kata sandi baru"
                type="password"
                value={values.confirmPassword}
                disabled={isSubmitting}
                onChange={handleChange}
              />
            </WithLabelAndError>
          </div>
          <div>
            <Button fullWidth disabled={isLoading} type="submit">
              Ubah Kata Sandi
            </Button>
            <div className="text-center text-blueGray-600 mt-2">
              <span className="text-sm">Ingat password anda? </span>
              <span
                role="link"
                tabIndex={0}
                onKeyDown={handleKey}
                className="text-sm cursor-pointer font-bold hover:text-blue-700"
                onClick={() => push('/login')}
              >
                Coba untuk masuk
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
