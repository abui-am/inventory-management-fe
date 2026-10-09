import { useFormik } from 'formik';
import React from 'react';
import { object, string } from 'yup';

import { SelectRole } from '@/components/Form';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { DialogHeading } from '@/components/ui/dialog-summary';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreateAccountReqBody, useCreateAccount } from '@/hooks/mutation/useAuth';
import reportError from '@/utils/reportError';
import { controlStyle } from '@/utils/style';

type Nilai = {
  username: string;
  roles: { label: string; value: string }[];
  password: string;
  passwordConfirmation: string;
};

/** Keterangan di bawah isian: 11px, jarak 5px, lh 1.45 — destructive hanya saat jadi error. */
const pesan = (error: boolean) =>
  error ? 'mt-1.25 text-xs leading-[1.45] text-destructive' : 'mt-1.25 text-xs leading-[1.45] text-foreground-subtle';

/**
 * Membuat akun login untuk karyawan yang sudah tersimpan.
 *
 * Layar lama menaruhnya di balik tab, dengan ajakan berupa `<span>` biru yang berperan
 * sebagai tombol dan label "konfirmasi password" huruf kecil. Yang di sini berbentuk
 * dialog berjudul nama orangnya, supaya jelas akun siapa yang sedang dibuat.
 *
 * Kata sandi tetap diisi di sini karena `PUT /users` mewajibkannya
 * (`'password' => 'required|string|confirmed'`). Berkas desain menggambarkan akun yang
 * kata sandinya diatur sendiri oleh orangnya lewat email — itu butuh perubahan backend.
 */
export function CreateAccountDialog({
  employeeId,
  nama,
  isOpen,
  onClose,
  onSuccess,
}: {
  employeeId: string;
  nama: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}): JSX.Element {
  const { mutateAsync, isLoading } = useCreateAccount();

  const { values, errors, touched, handleChange, handleSubmit, setFieldValue, setFieldTouched, resetForm } =
    useFormik<Nilai>({
      initialValues: { username: '', roles: [], password: '', passwordConfirmation: '' },
      validationSchema: object().shape({
        username: string()
          .matches(/^[a-z0-9_]+$/, 'Hanya huruf kecil, angka, dan garis bawah.')
          .required('Username wajib diisi.'),
        password: string().min(8, 'Minimal 8 karakter.').required('Kata sandi wajib diisi.'),
        // Dicocokkan lewat `test`, bukan `oneOf([ref('password')])`: yang terakhir tidak
        // pernah memberi tahu bedanya antara kosong dan tidak sama.
        passwordConfirmation: string()
          .required('Ulangi kata sandinya.')
          .test('sama', 'Kata sandinya belum sama.', (value, ctx) => value === ctx.parent.password),
      }),
      onSubmit: async (nilai) => {
        if (nilai.roles.length === 0) {
          setFieldTouched('roles', true);
          return;
        }
        const body: CreateAccountReqBody = {
          employee_id: employeeId,
          username: nilai.username,
          password: nilai.password,
          password_confirmation: nilai.passwordConfirmation,
          roles: nilai.roles.map(({ value }) => value),
        };
        try {
          await mutateAsync(body);
          resetForm();
          onSuccess();
        } catch (e) {
          reportError(e, { form: 'employee/create-account' });
        }
      },
    });

  const tutup = () => {
    resetForm();
    onClose();
  };

  const perluPeran = !!touched.roles && values.roles.length === 0;

  return (
    <Modal isOpen={isOpen} onRequestClose={isLoading ? undefined : tutup} bodyClassName="p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        <DialogHeading title={`Buat akun login untuk ${nama}?`}>
          Sesudah akunnya jadi, ia bisa masuk memakai username di bawah dengan kata sandi yang diisi di sini.
        </DialogHeading>

        <div className="flex flex-col gap-2.25">
          <div>
            <Label htmlFor="akun-username" required>
              Username
            </Label>
            <Input
              id="akun-username"
              size="sm"
              name="username"
              value={values.username}
              onChange={handleChange}
              aria-required
              aria-invalid={!!(errors.username && touched.username) || undefined}
              placeholder="budi_santoso"
              className="mt-1.25"
            />
            <p className={pesan(!!(errors.username && touched.username))}>
              {errors.username && touched.username
                ? errors.username
                : 'Huruf kecil dan garis bawah. Tidak bisa diubah sesudah dibuat.'}
            </p>
          </div>

          <div>
            <Label htmlFor="akun-peran" required>
              Peran
            </Label>
            <div className="mt-1.25">
              <SelectRole
                isMulti
                isSearchable
                inputId="akun-peran"
                instanceId="akun-peran"
                name="roles"
                aria-label="Peran akun"
                value={values.roles}
                additionalStyle={controlStyle}
                onChange={(val) => setFieldValue('roles', val ?? [])}
                onBlur={() => setFieldTouched('roles', true)}
              />
            </div>
            <p className={pesan(perluPeran)}>
              {perluPeran
                ? 'Pilih minimal satu peran.'
                : 'Menentukan menu apa saja yang ia lihat. Kepala gudang hanya mengkonfirmasi barang masuk.'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.75 sm:grid-cols-2">
            <div>
              <Label htmlFor="akun-password" required>
                Kata sandi
              </Label>
              <Input
                id="akun-password"
                size="sm"
                type="password"
                name="password"
                value={values.password}
                onChange={handleChange}
                aria-required
                aria-invalid={!!(errors.password && touched.password) || undefined}
                className="mt-1.25"
              />
              {errors.password && touched.password && <p className={pesan(true)}>{errors.password}</p>}
            </div>
            <div>
              <Label htmlFor="akun-password-ulang" required>
                Ulangi kata sandi
              </Label>
              <Input
                id="akun-password-ulang"
                size="sm"
                type="password"
                name="passwordConfirmation"
                value={values.passwordConfirmation}
                onChange={handleChange}
                aria-required
                aria-invalid={!!(errors.passwordConfirmation && touched.passwordConfirmation) || undefined}
                className="mt-1.25"
              />
              {errors.passwordConfirmation && touched.passwordConfirmation && (
                <p className={pesan(true)}>{errors.passwordConfirmation}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-0.5 flex justify-end gap-1.75">
          <Button size="sm" variant="outline" onClick={tutup} disabled={isLoading}>
            Batal
          </Button>
          <Button size="sm" type="submit" loading={isLoading}>
            Buat akun
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateAccountDialog;
