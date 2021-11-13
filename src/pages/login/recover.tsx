import { useFormik } from 'formik';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { object } from 'yup';

import { Button } from '@/components/Button';
import { TextField, WithLabelAndError } from '@/components/Form';
import { useForgotPassword } from '@/hooks/mutation/useAuth';
import { useKeyPressEnter } from '@/hooks/useKeyHandler';
import createSchema from '@/utils/validation/formik';
export default function Home(): JSX.Element {
  const [sent, setSent] = useState(false);
  const initialValues = {
    email: '',
  };
  const handleKey = useKeyPressEnter(() => {
    setSent(false);
  });

  const { mutateAsync } = useForgotPassword();
  const { back } = useRouter();
  const { values, handleChange, errors, isSubmitting, handleSubmit, touched } = useFormik({
    validationSchema: object().shape(createSchema(initialValues)),
    initialValues,
    onSubmit: async (values) => {
      await mutateAsync(values);

      setSent(true);
    },
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 p-6">
      <form onSubmit={handleSubmit} className="max-w-md flex-col justify-center items-center -mt-16">
        {sent ? (
          <>
            <div className="max-w-md w-screen p-8 shadow-2xl rounded-lg bg-white">
              <h1 className="text-blue-700 font-bold mb-4 text-center text-3xl">Permintaan berhasil</h1>
              <div className="mb-8 text-center">Cek email untuk mendapatkan link atur ulang</div>
              <Button fullWidth onClick={() => back()} variant="outlined">
                Kembali
              </Button>
              <div className="text-center text-blueGray-600 mt-2">
                <span className="text-sm">Belum mendapatkan link? </span>
                <span
                  role="link"
                  tabIndex={0}
                  onKeyDown={handleKey}
                  className="text-sm cursor-pointer font-bold hover:text-blue-700"
                  onClick={() => setSent(false)}
                >
                  Kirim ulang
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-bold mb-10 text-center">Lupa kata sandi</h1>
            <div className=" w-full text-center mb-10">
              <span className="text-blueGray-600">Silahkan isi email untuk mengatur ulang kata sandi baru</span>
            </div>
            <div className="max-w-md w-screen p-8 shadow-2xl rounded-lg bg-white">
              <div className="mb-8">
                <WithLabelAndError label="Email" touched={touched} errors={errors} name="email">
                  <TextField
                    id="email"
                    name="email"
                    placeholder="example@mail.com"
                    value={values.email}
                    autoComplete="invt-email"
                    disabled={isSubmitting}
                    onChange={handleChange}
                  />
                </WithLabelAndError>
              </div>
              <div>
                <Button fullWidth disabled={sent} type="submit">
                  Minta atur ulang kata sandi
                </Button>
                <div className="text-center text-blueGray-600 mt-2">
                  <span className="text-sm">Ingat password anda? </span>
                  <span
                    role="link"
                    tabIndex={0}
                    onKeyDown={handleKey}
                    className="text-sm cursor-pointer font-bold hover:text-blue-700"
                    onClick={() => back()}
                  >
                    Coba untuk masuk
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
