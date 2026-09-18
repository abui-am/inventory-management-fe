import { useFormik } from 'formik';
import { Info } from 'lucide-react';
import React from 'react';
import toast from 'react-hot-toast';

import { validationSchemaSupplier } from '@/components/form/constant';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { DialogHeading } from '@/components/ui/dialog-summary';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateSupplier, useEditSupplier } from '@/hooks/query/useFetchSupplier';
import { cn } from '@/lib/cn';
import { CreateSupplierBody, SupplierData } from '@/typings/supplier';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/**
 * Membuat dan mengubah supplier — satu dialog, dua mode.
 *
 * Bentuknya sengaja sama persis dengan dialog customer: dua daftar yang bentuknya sama
 * tidak boleh punya cara mengisi yang berbeda.
 */
export function SupplierFormDialog({
  supplier,
  isOpen,
  onClose,
}: {
  /** `null` berarti membuat supplier baru. */
  supplier: SupplierData | null;
  isOpen: boolean;
  onClose: () => void;
}): JSX.Element {
  const isEdit = !!supplier;
  const { mutateAsync: createSupplier, isLoading: sedangMembuat } = useCreateSupplier();
  const { mutateAsync: editSupplier, isLoading: sedangMengubah } = useEditSupplier(supplier?.id ?? '');
  const saving = sedangMembuat || sedangMengubah;

  const { values, errors, touched, handleChange, handleSubmit, setFieldValue, resetForm } = useFormik({
    validationSchema: validationSchemaSupplier,
    enableReinitialize: true,
    initialValues: {
      name: supplier?.name ?? '',
      phoneNumber: supplier?.phone_number ?? '',
      address: supplier?.address ?? '',
    },
    onSubmit: async (isian) => {
      const jsonBody: CreateSupplierBody = {
        name: isian.name,
        phone_number: isian.phoneNumber,
        address: isian.address,
      };

      try {
        const res = isEdit ? await editSupplier(jsonBody) : await createSupplier(jsonBody);
        toast.success(res.message);
        resetForm();
        onClose();
      } catch {
        // Pesannya sudah muncul sebagai toast di hook-nya.
      }
    },
  });

  const galatNama = touched.name && errors.name ? 'Nama supplier wajib diisi' : '';

  return (
    <Modal isOpen={isOpen} onRequestClose={saving ? undefined : onClose} bodyClassName="p-4">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2.5">
        <DialogHeading title={isEdit ? 'Ubah supplier' : 'Supplier baru'}>
          {isEdit
            ? 'Perubahan nama ikut terbaca di seluruh barang masuk lamanya — riwayatnya menunjuk supplier yang sama, bukan menyimpan salinan namanya.'
            : 'Nomor HP dan alamat boleh menyusul — yang wajib hanya namanya.'}
        </DialogHeading>

        <div className="flex flex-col gap-2.25">
          <div className="flex flex-col">
            <Label htmlFor="name" className="mb-1">
              Nama supplier <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              size="sm"
              className={cn('rounded-control', galatNama && 'border-destructive')}
              placeholder="Nama supplier"
              value={values.name}
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
                value={`${values.phoneNumber ?? ''}`.slice(2)}
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

        {isEdit && +(supplier?.total_receivable ?? 0) > 0 && (
          <p className="flex items-start gap-1.5 rounded-lg bg-info-subtle px-3.25 py-2 text-sm leading-[17px] text-info">
            <Info size={13} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
            <span>
              Utang{' '}
              <span className="font-mono font-semibold tabular-nums">
                {formatNumber(+(supplier?.total_receivable ?? 0))}
              </span>{' '}
              tidak berubah dari sini. Utang hanya bergerak lewat barang masuk dan pembayarannya.
            </span>
          </p>
        )}

        <div className="mt-1 flex justify-end">
          <Button className="mr-2" size="sm" variant="outline" type="button" disabled={saving} onClick={onClose}>
            Batal
          </Button>
          <Button size="sm" type="submit" loading={saving}>
            {isEdit ? 'Simpan perubahan' : 'Simpan supplier'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default SupplierFormDialog;
