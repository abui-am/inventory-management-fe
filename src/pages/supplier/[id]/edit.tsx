import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

/** Ubah supplier sekarang lewat dialog di halaman daftarnya. Lihat catatan di add.tsx. */
const EditSupplierPage: NextPage = () => {
  const { replace } = useRouter();

  useEffect(() => {
    replace('/supplier');
  }, [replace]);

  return null;
};

export default EditSupplierPage;
