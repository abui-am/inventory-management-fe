import { useFormik } from 'formik';
import { AlertCircle, ArrowLeft, Mail, MailCheck } from 'lucide-react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { object } from 'yup';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForgotPassword } from '@/hooks/mutation/useAuth';
import { ThemeablePage } from '@/typings/page';
import createSchema from '@/utils/validation/formik';

/**
 * Minta tautan atur ulang kata sandi.
 *
 * Dua keadaan dalam satu kartu: isian email, lalu tanda terkirim. Keduanya memakai
 * kartu yang sama persis dengan halaman masuk supaya perpindahannya tidak terasa
 * seperti pindah aplikasi.
 */
const RecoverPage: NextPage & ThemeablePage = () => {
  const [terkirim, setTerkirim] = useState(false);
  const { mutateAsync, isLoading, error } = useForgotPassword();
  const { back } = useRouter();

  const initialValues = { email: '' };

  const { values, handleChange, errors, isSubmitting, handleSubmit, touched } = useFormik({
    validationSchema: object().shape(createSchema(initialValues)),
    initialValues,
    onSubmit: async (values) => {
      await mutateAsync(values);
      setTerkirim(true);
    },
  });

  const pesanGagal = (error as { response?: { data?: { message?: string } } } | null)?.response?.data?.message;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-[352px] rounded-card border border-border bg-surface p-5 shadow-md">
        {terkirim ? (
          <div className="flex flex-col items-center gap-1.75 text-center">
            <span className="flex size-[34px] items-center justify-center rounded-lg bg-success-subtle text-success">
              <MailCheck size={18} strokeWidth={1.8} aria-hidden />
            </span>
            <h1 className="text-lg font-bold leading-5">Permintaan terkirim</h1>
            <p className="text-sm leading-[17px] text-foreground-muted">
              Tautan atur ulang dikirim ke <span className="font-medium text-foreground">{values.email}</span>. Buka
              tautannya dari email itu untuk membuat kata sandi baru.
            </p>

            <Button className="mt-2.5" fullWidth size="sm" variant="outline" onClick={() => back()}>
              <ArrowLeft size={14} strokeWidth={1.9} aria-hidden />
              Kembali ke halaman masuk
            </Button>

            <p className="mt-0.5 text-sm text-foreground-subtle">
              Belum ada emailnya?{' '}
              <button
                type="button"
                className="font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                onClick={() => setTerkirim(false)}
              >
                Kirim ulang
              </button>
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <div className="flex flex-col items-center gap-1.75 text-center">
              <span className="flex size-[34px] items-center justify-center rounded-lg bg-accent-subtle text-accent">
                <Mail size={18} strokeWidth={1.8} aria-hidden />
              </span>
              <div>
                <h1 className="text-lg font-bold leading-5">Lupa kata sandi</h1>
                <p className="text-sm text-foreground-subtle">Isi email akunmu, tautannya kami kirim ke sana</p>
              </div>
            </div>

            {pesanGagal && (
              <p
                role="alert"
                className="mt-3.5 flex items-start gap-2 rounded-lg bg-destructive-subtle px-2.75 py-2.25 text-sm leading-[17px] text-destructive"
              >
                <AlertCircle size={14} strokeWidth={1.9} className="mt-px shrink-0" aria-hidden />
                <span>{pesanGagal}</span>
              </p>
            )}

            <div className="mt-3.5 flex flex-col gap-2.75">
              <div>
                <Label htmlFor="email" className="mb-1.25">
                  Email
                </Label>
                <div className="relative">
                  <Mail
                    size={14}
                    strokeWidth={1.8}
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-2.5 z-10 my-auto text-foreground-subtle"
                  />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    size="sm"
                    className="pl-[31px]"
                    placeholder="nama@email.com"
                    autoComplete="email"
                    autoFocus
                    value={values.email}
                    disabled={isSubmitting}
                    aria-invalid={touched.email && !!errors.email}
                    onChange={handleChange}
                  />
                </div>
                {touched.email && errors.email && (
                  <span className="mt-1 block text-xs text-destructive">{errors.email}</span>
                )}
              </div>

              <Button type="submit" fullWidth size="sm" loading={isLoading}>
                Minta tautan atur ulang
              </Button>

              <button
                type="button"
                className="text-sm text-foreground-muted transition-colors duration-fast hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                onClick={() => back()}
              >
                Ingat kata sandimu? Coba masuk lagi
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

RecoverPage.themeable = true;

export default RecoverPage;
