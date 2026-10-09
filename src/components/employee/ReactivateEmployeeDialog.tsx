import React from 'react';
import toast from 'react-hot-toast';

import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { DialogHeading } from '@/components/ui/dialog-summary';
import { useEditEmployee } from '@/hooks/query/useFetchEmployee';
import reportError from '@/utils/reportError';

/**
 * Mengaktifkan kembali karyawan yang pernah dinonaktifkan.
 *
 * Sebelumnya tidak ada layar mana pun yang bisa melakukannya: daftarnya dipaku ke
 * `active: true`, jadi begitu seseorang dinonaktifkan ia hilang dari satu-satunya tempat
 * ia bisa dibuka lagi. Yang dikirim sama persis dengan yang dikirim tombol Deactivate,
 * hanya nilainya dibalik — `PATCH /employees/{id}` dengan `{ active }`.
 */
export function ReactivateEmployeeDialog({
  employeeId,
  nama,
  isOpen,
  onClose,
}: {
  employeeId: string;
  nama: string;
  isOpen: boolean;
  onClose: () => void;
}): JSX.Element {
  const { mutateAsync, isLoading } = useEditEmployee(employeeId);

  const aktifkan = async () => {
    try {
      await mutateAsync({ active: true });
      toast.success(`${nama} aktif kembali`);
      onClose();
    } catch (e) {
      reportError(e, { form: 'employee/reactivate' });
      toast.error('Gagal mengaktifkan karyawan');
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={isLoading ? undefined : onClose} bodyClassName="p-4">
      <div className="flex flex-col gap-2.5">
        <DialogHeading title={`Aktifkan ${nama} lagi?`}>
          Ia akan ikut lagi saat daftar gaji bulan berikutnya dibuat, memakai gaji dan jabatan yang tercatat sekarang.
          Daftar gaji bulan yang sudah jadi tidak ikut berubah.
        </DialogHeading>

        <div className="mt-1 flex justify-end gap-1.75">
          <Button size="sm" variant="outline" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button size="sm" onClick={aktifkan} loading={isLoading}>
            Aktifkan
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ReactivateEmployeeDialog;
