import { NextPage } from 'next';
import { useRouter } from 'next/router';

import { CardDashboard } from '@/components/Container';
import CreateEmployeeForm from '@/components/form/CreateEmployeeForm';

const Home: NextPage<unknown> = () => {
  const { query } = useRouter();
  return (
    <CardDashboard title="Edit Karyawan">
      <CreateEmployeeForm editId={query.id as string} isEdit />
    </CardDashboard>
  );
};

export default Home;
