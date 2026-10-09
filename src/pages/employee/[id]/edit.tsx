import { NextPage } from 'next';
import { useRouter } from 'next/router';

import CreateEmployeeForm from '@/components/form/CreateEmployeeForm';
import { ThemeablePage } from '@/typings/page';

/** Ubah karyawan — formulir yang sama dengan Tambah, ditambah kendali status. */
const EditEmployeePage: NextPage & ThemeablePage = () => {
  const { query } = useRouter();
  return <CreateEmployeeForm isEdit editId={query.id as string} />;
};

EditEmployeePage.themeable = true;

export default EditEmployeePage;
