import { useFormik } from 'formik';
import { AlertCircle, Eye, EyeOff, KeyRound, Lock } from 'lucide-react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { object } from 'yup';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useResetPassword } from '@/hooks/mutation/useAuth';
import { cn } from '@/lib/cn';
import { ThemeablePage } from '@/typings/page';
import createSchema from '@/utils/validation/formik';

/**
 * Mengisi kata sandi baru — layar yang dituju tautan dari email.
 *
 * Kartunya sama persis dengan halaman masuk dan pemulihan: orang sampai ke sini
 * lewat email, dan kalau bentuknya berbeda ia terbaca seperti situs lain.
 */
const ResetPasswordPage: NextPage & ThemeablePage = () => {
  const { query, push, isReady } = useRouter();
  const { mutateAsync, isLoading, error } = useResetPassword();
  const [lihat, setLihat] = useState(false);

  const initialValues = { newPassword: '', confirmPassword: '' };

  const { values, handleChange, errors, isSubmitting, handleSubmit, touched } = useFormik({
    validationSchema: object().shape(createSchema(initialValues)),
    initialValues,
    onSubmit: async (values) => {
      await mutateAsync({
        token: query.token as string,
        password_confirmation: values.confirmPassword,
        password: values.newPassword,
      });
    },
  });

  const galat = error as { response?: { data?: { msg?: string; message?: string } } } | null;
  const pesanGagal = galat?.response?.data?.msg ?? galat?.response?.data?.message;

  // Dicek di layar, bukan hanya di server: mengetahui keduanya berbeda setelah menekan
  // tombol berarti satu perjalanan bolak-balik yang tidak perlu.
  const tidakSama =
    touched.confirmPassword && values.confirmPassword.length > 0 && values.confirmPassword !== values.newPassword;

  // `router.query` masih kosong di render pertama halaman yang dioptimalkan statis,
  // jadi tanpa `isReady` peringatan "tautan tidak lengkap" sempat berkedip untuk
  // tautan yang sebenarnya sah.
  const tanpaToken = isReady && !query.token;

  const kotakSandi = (
    nama: 'newPassword' | 'confirmPassword',
    label: string,
    placeholder: string,
    salah: boolean
  ): JSX.Element => (
    <div>
      <Label htmlFor={nama} className="mb-1.25">
        {label}
      </Label>
      <div className="relative">
        <Lock
          size={14}
          strokeWidth={1.8}
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-2.5 z-10 my-auto text-foreground-subtle"
        />
        <Input
          id={nama}
          name={nama}
          type={lihat ? 'text' : 'password'}
          size="sm"
          className="px-[31px]"
          placeholder={placeholder}
          autoComplete="new-password"
          value={values[nama]}
          disabled={isSubmitting || tanpaToken}
          aria-invalid={salah}
          onChange={handleChange}
        />
        <button
          type="button"
          aria-label={lihat ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
          aria-pressed={lihat}
          className={cn(
            'absolute inset-y-0 right-2 my-auto flex size-5 items-center justify-center rounded-sm',
            'text-foreground-subtle transition-colors duration-fast hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35'
          )}
          onClick={() => setLihat((buka) => !buka)}
        >
          {lihat ? <EyeOff size={14} strokeWidth={1.8} aria-hidden /> : <Eye size={14} strokeWidth={1.8} aria-hidden />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="w-full max-w-[352px] rounded-card border border-border bg-surface p-5 shadow-md"
      >
        <div className="flex flex-col items-center gap-1.75 text-center">
          <span className="flex size-[34px] items-center justify-center rounded-lg bg-accent-subtle text-accent">
            <KeyRound size={18} strokeWidth={1.8} aria-hidden />
          </span>
          <div>
            <h1 className="text-lg font-bold leading-5">Kata sandi baru</h1>
            <p className="text-sm text-foreground-subtle">Pilih yang kuat dan mudah kamu ingat</p>
          </div>
        </div>

        {tanpaToken && (
          <p
            role="alert"
            className="mt-3.5 flex items-start gap-2 rounded-lg bg-warning-subtle px-2.75 py-2.25 text-sm leading-[17px] text-warning"
          >
            <AlertCircle size={14} strokeWidth={1.9} className="mt-px shrink-0" aria-hidden />
            <span>
              Tautannya tidak lengkap. Buka halaman ini dari tautan di email atur ulang, atau minta tautan baru.
            </span>
          </p>
        )}

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
          {kotakSandi(
            'newPassword',
            'Kata sandi baru',
            'Masukkan kata sandi baru',
            !!(touched.newPassword && errors.newPassword)
          )}
          {touched.newPassword && errors.newPassword && (
            <span className="-mt-1.75 block text-xs text-destructive">{errors.newPassword}</span>
          )}

          {kotakSandi('confirmPassword', 'Ulangi kata sandi', 'Ketik ulang kata sandi baru', !!tidakSama)}
          {tidakSama && <span className="-mt-1.75 block text-xs text-destructive">Kedua kata sandi belum sama.</span>}

          <Button type="submit" fullWidth size="sm" loading={isLoading} disabled={tanpaToken || !!tidakSama}>
            Simpan kata sandi
          </Button>

          <button
            type="button"
            className="text-sm text-foreground-muted transition-colors duration-fast hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
            onClick={() => push('/login')}
          >
            Kembali ke halaman masuk
          </button>
        </div>
      </form>
    </div>
  );
};

ResetPasswordPage.themeable = true;

export default ResetPasswordPage;
