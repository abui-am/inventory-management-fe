import { useFormik } from 'formik';
import { Info } from 'lucide-react';
import React from 'react';
import toast from 'react-hot-toast';

import { validationSchemaCustomer } from '@/components/form/constant';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { DialogHeading } from '@/components/ui/dialog-summary';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateCustomer, useEditCustomer } from '@/hooks/mutation/useMutateCustomer';
import { cn } from '@/lib/cn';
import { CreateCustomerBody, CustomerData } from '@/typings/customer';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/**
 * Membuat dan mengubah customer — satu dialog, dua mode.
 *
 * Yang berbeda hanya judul, kalimat pembukanya, dan label tombolnya; isian dan
 * validasinya sama persis. Dua komponen terpisah hanya akan menyimpang pelan-pelan.
 */
export function CustomerFormDialog({
  customer,
  isOpen,
  onClose,
  onSaved,
}: {
  /** `null` berarti membuat customer baru. */
  customer: CustomerData | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}): JSX.Element {
  const isEdit = !!customer;
  const { mutateAsync: createCustomer, isLoading: sedangMembuat } = useCreateCustomer();
  const { mutateAsync: editCustomer, isLoading: sedangMengubah } = useEditCustomer(customer?.id ?? '');
  const saving = sedangMembuat || sedangMengubah;

  const { values, errors, touched, handleChange, handleSubmit, setFieldValue, resetForm } = useFormik({
    validationSchema: validationSchemaCustomer,
    enableReinitialize: true,
    initialValues: {
      fullName: customer?.full_name ?? '',
      phoneNumber: customer?.phone_number ?? '',
      address: customer?.address ?? '',
    },
    onSubmit: async (isian) => {
      const jsonBody: CreateCustomerBody = {
        full_name: isian.fullName,
        phone_number: isian.phoneNumber,
        address: isian.address,
      };

      try {
        const res = isEdit ? await editCustomer(jsonBody) : await createCustomer(jsonBody);
        toast.success(res.message);
        resetForm();
        onSaved?.();
        onClose();
      } catch {
        // Pesannya sudah muncul sebagai toast di hook-nya.
      }
    },
  });

  const galatNama = touched.fullName && errors.fullName ? 'Nama customer wajib diisi' : '';

  return (
    <Modal isOpen={isOpen} onRequestClose={saving ? undefined : onClose} bodyClassName="p-4">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2.5">
        <DialogHeading title={isEdit ? 'Ubah customer' : 'Customer baru'}>
          {isEdit
            ? 'Perubahan nama ikut terbaca di seluruh transaksi lamanya — riwayatnya menunjuk customer yang sama, bukan menyimpan salinan namanya.'
            : 'Nomor HP dan alamat boleh menyusul — yang wajib hanya namanya.'}
        </DialogHeading>

        <div className="flex flex-col gap-2.25">
          <div className="flex flex-col">
            <Label htmlFor="fullName" className="mb-1">
              Nama customer <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              name="fullName"
              size="sm"
              className={cn('rounded-control', galatNama && 'border-destructive')}
              placeholder="Nama customer"
              value={values.fullName}
              disabled={saving}
              aria-invalid={!!galatNama || undefined}
              onChange={handleChange}
            />
            {galatNama && (
              <span className="mt-1 text-sm text-destructive" role="alert">
                {galatNama}
              </span>
            )}
          </div>

          {/* Awalan +62 menempel di kotaknya. Nilainya tetap disimpan utuh sebagai
              `62xxxxxxxx`, sama seperti yang lama — hanya tingginya yang mengikuti
              32px milik halaman ini. */}
          <div className="flex flex-col">
            <Label htmlFor="phoneNumber" className="mb-1">
              Nomor HP
            </Label>
            <div className="flex">
              <span className="inline-flex h-8 items-center rounded-l-control border border-r-0 border-border-strong bg-surface-raised px-2.5 font-mono text-sm text-foreground-muted">
                +62
              </span>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                size="sm"
                type="number"
                className="rounded-l-none rounded-r-control font-mono"
                placeholder="812-3344-1122"
                disabled={saving}
                value={values.phoneNumber.toString().slice(2)}
                onChange={(e) => setFieldValue('phoneNumber', e.target.value ? `62${e.target.value}` : '')}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <Label htmlFor="address" className="mb-1">
              Alamat
            </Label>
            <Textarea
              id="address"
              name="address"
              rows={2}
              placeholder="Alamat lengkap (opsional)"
              value={values.address}
              disabled={saving}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Piutang muncul di sheet rincian tepat di atas tombol Edit, jadi orang wajar
            mengira ia bisa diperbaiki di sini. */}
        {isEdit && +(customer?.total_debt ?? 0) > 0 && (
          <p className="flex items-start gap-1.5 rounded-lg bg-info-subtle px-3.25 py-2 text-sm leading-[17px] text-info">
            <Info size={13} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
            <span>
              Piutang{' '}
              <span className="font-mono font-semibold tabular-nums">{formatNumber(+(customer?.total_debt ?? 0))}</span>{' '}
              tidak berubah dari sini. Piutang hanya bergerak lewat transaksi dan pembayarannya.
            </span>
          </p>
        )}

        <div className="mt-1 flex justify-end">
          <Button className="mr-2" size="sm" variant="outline" type="button" disabled={saving} onClick={onClose}>
            Batal
          </Button>
          <Button size="sm" type="submit" loading={saving}>
            {isEdit ? 'Simpan perubahan' : 'Simpan customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CustomerFormDialog;
