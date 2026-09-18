import { useFormik } from 'formik';
import { AlertCircle, AtSign, Eye, EyeOff, Lock } from 'lucide-react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import { object } from 'yup';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import useAuthMutation from '@/hooks/mutation/useAuth';
import { cn } from '@/lib/cn';
import { ThemeablePage } from '@/typings/page';
import createSchema from '@/utils/validation/formik';

/**
 * Masuk ke dashboard.
 *
 * Satu kartu di tengah, tanpa hiasan: layar ini hanya punya satu pekerjaan. Yang
 * berubah dari versi lama bukan cuma warnanya — kegagalan login dulu hanya lewat
 * toast yang keburu hilang, dan `autoComplete` diisi "invt-email"/"invt-password"
 * sehingga pengelola sandi tidak pernah mengenali formnya.
 */
const LoginPage: NextPage & ThemeablePage = () => {
  const { mutateAsync, isLoading, error } = useAuthMutation('login');
  const [lihatSandi, setLihatSandi] = useState(false);

  const initialValues = {
    usernameEmail: '',
    password: '',
    rememberMe: false,
  };

  const { values, handleChange, errors, isSubmitting, handleSubmit, touched } = useFormik({
    validationSchema: object().shape(createSchema(initialValues)),
    initialValues,
    onSubmit: async (values) => {
      await mutateAsync({
        email: values.usernameEmail,
        password: values.password,
        rememberMe: values.rememberMe,
      });
    },
  });

  const pesanGagal = (error as { response?: { data?: { message?: string } } } | null)?.response?.data?.message;

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
          <span className="flex size-[34px] items-center justify-center rounded-lg bg-accent text-lg font-extrabold text-accent-foreground">
            P
          </span>
          <div>
            <h1 className="text-lg font-bold leading-5">Putra Pribumi</h1>
            <p className="text-sm text-foreground-subtle">Masuk untuk melanjutkan</p>
          </div>
        </div>

        {/* Alasan penolakan tinggal di dalam form, bukan di toast yang menghilang. */}
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
            <Label htmlFor="usernameEmail" className="mb-1.25">
              Username
            </Label>
            <div className="relative">
              <AtSign
                size={14}
                strokeWidth={1.8}
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-2.5 z-10 my-auto text-foreground-subtle"
              />
              <Input
                id="usernameEmail"
                name="usernameEmail"
                size="sm"
                className="pl-[31px]"
                placeholder="Masukkan username"
                autoComplete="username"
                autoFocus
                value={values.usernameEmail}
                disabled={isSubmitting}
                aria-invalid={touched.usernameEmail && !!errors.usernameEmail}
                onChange={handleChange}
              />
            </div>
            {touched.usernameEmail && errors.usernameEmail && (
              <span className="mt-1 block text-xs text-destructive">{errors.usernameEmail}</span>
            )}
          </div>

          <div>
            <Label htmlFor="password" className="mb-1.25">
              Kata sandi
            </Label>
            <div className="relative">
              <Lock
                size={14}
                strokeWidth={1.8}
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-2.5 z-10 my-auto text-foreground-subtle"
              />
              <Input
                id="password"
                name="password"
                type={lihatSandi ? 'text' : 'password'}
                size="sm"
                className="px-[31px]"
                placeholder="Masukkan kata sandi"
                autoComplete="current-password"
                value={values.password}
                disabled={isSubmitting}
                aria-invalid={touched.password && !!errors.password}
                onChange={handleChange}
              />
              <button
                type="button"
                aria-label={lihatSandi ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                aria-pressed={lihatSandi}
                className={cn(
                  'absolute inset-y-0 right-2 my-auto flex size-5 items-center justify-center rounded-sm',
                  'text-foreground-subtle transition-colors duration-fast hover:text-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35'
                )}
                onClick={() => setLihatSandi((lihat) => !lihat)}
              >
                {lihatSandi ? (
                  <EyeOff size={14} strokeWidth={1.8} aria-hidden />
                ) : (
                  <Eye size={14} strokeWidth={1.8} aria-hidden />
                )}
              </button>
            </div>
            {touched.password && errors.password && (
              <span className="mt-1 block text-xs text-destructive">{errors.password}</span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="rememberMe"
              className="flex cursor-pointer items-center gap-1.75 text-sm text-foreground-muted"
            >
              <Checkbox id="rememberMe" name="rememberMe" checked={values.rememberMe} onChange={handleChange} />
              Ingat saya
            </label>
            <Link href="/login/recover">
              <a className="text-sm text-accent hover:underline">Lupa kata sandi</a>
            </Link>
          </div>

          <Button type="submit" fullWidth size="sm" loading={isLoading}>
            Masuk
          </Button>
        </div>
      </form>
    </div>
  );
};

LoginPage.themeable = true;

export default LoginPage;
