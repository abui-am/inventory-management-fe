import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

/**
 * Tambah supplier sekarang lewat dialog di halaman daftarnya, sama seperti customer.
 *
 * Rutenya sengaja tidak dihapus: ia pernah jadi tujuan tombol "Tambah" dan bisa saja
 * tersimpan di riwayat atau tautan seseorang. Daripada mati sebagai 404, ia mengantar
 * ke tempat barunya.
 */
const AddSupplierPage: NextPage = () => {
  const { replace } = useRouter();

  useEffect(() => {
    replace('/supplier');
  }, [replace]);

  return null;
};

export default AddSupplierPage;
