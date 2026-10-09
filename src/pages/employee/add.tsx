import { NextPage } from 'next';

import CreateEmployeeForm from '@/components/form/CreateEmployeeForm';
import { ThemeablePage } from '@/typings/page';

/**
 * Tambah karyawan.
 *
 * Tanpa pembungkus `CardDashboard`: formulirnya membawa judul dan kartunya sendiri,
 * jadi kartu luar hanya menambah satu lapis kotak di dalam kotak.
 */
const AddEmployeePage: NextPage & ThemeablePage = () => <CreateEmployeeForm />;

AddEmployeePage.themeable = true;

export default AddEmployeePage;
