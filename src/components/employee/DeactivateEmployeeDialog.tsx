import React from 'react';
import toast from 'react-hot-toast';

import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { DialogHeading } from '@/components/ui/dialog-summary';
import { useEditEmployee } from '@/hooks/query/useFetchEmployee';
import reportError from '@/utils/reportError';

/**
 * Menonaktifkan karyawan. Kebalikan dari [ReactivateEmployeeDialog], dan yang dikirim
 * sama persis — `PATCH /employees/{id}` dengan `{ active: false }`.
 *
 * Dialog lama hanya berbunyi "Nonaktifkan karyawan ini?" tanpa menyebut siapa dan tanpa
 * mengatakan akibatnya, padahal akibatnya dua: ia keluar dari daftar gaji bulan
 * berikutnya, dan aksesnya masuk ke aplikasi ditutup.
 */
export function DeactivateEmployeeDialog({
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
  onSuccess?: () => void;
}): JSX.Element {
  const { mutateAsync, isLoading } = useEditEmployee(employeeId);

  const nonaktifkan = async () => {
    try {
      await mutateAsync({ active: false });
      toast.success(`${nama} dinonaktifkan`);
      onClose();
      onSuccess?.();
    } catch (e) {
      reportError(e, { form: 'employee/deactivate' });
      toast.error('Gagal menonaktifkan karyawan');
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={isLoading ? undefined : onClose} bodyClassName="p-4">
      <div className="flex flex-col gap-2.5">
        <DialogHeading title={`Nonaktifkan ${nama}?`}>
          Ia tidak ikut dibuatkan baris gaji bulan berikutnya, dan tidak bisa masuk ke aplikasi. Daftar gaji bulan yang
          sudah jadi tidak ikut berubah, dan datanya tetap bisa dibuka dari tab Nonaktif.
        </DialogHeading>

        <div className="mt-1 flex justify-end gap-1.75">
          <Button size="sm" variant="outline" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button size="sm" variant="destructive" onClick={nonaktifkan} loading={isLoading}>
            Nonaktifkan
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default DeactivateEmployeeDialog;
