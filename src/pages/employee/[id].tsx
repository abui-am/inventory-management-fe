import dayjs from 'dayjs';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { KeyboardEvent, useState } from 'react';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import CreateAccountForm from '@/components/form/CreateAccountForm';
import Modal from '@/components/Modal';
import Tabs from '@/components/Tabs';
import { useFetchEmployeeById } from '@/hooks/query/useFetchEmployee';
import { Employee } from '@/typings/employee';

const EmployeeDetails: NextPage = () => {
  const [activeTab, setActive] = useState(0);
  const { query = {}, push } = useRouter();
  const { data, isLoading } = useFetchEmployeeById(query.id as string);
  const { first_name, last_name, position, id, ...rest } = data?.data.employee ?? {};

  const renderView = () => {
    switch (activeTab) {
      case 0:
        return <EmployeeInfo isLoading={isLoading} data={rest as Omit<Employee, 'first_name' | 'last_name'>} />;
      case 1:
        return <EmployeeAccount employeeId={id ?? ''} hasDashboardAccount={false} />;
      default:
        return <EmployeeInfo isLoading={isLoading} data={rest as Omit<Employee, 'first_name' | 'last_name'>} />;
    }
  };

  return (
    <CardDashboard>
      <div className="flex mb-7 flex-col sm:flex-row">
        <img
          className="w-full h-full sm:w-60 sm:h-60"
          alt="profile"
          src="https://randomuser.me/api/portraits/women/44.jpg"
        />
        <div className="mt-6 sm:mt-2 sm:ml-10">
          <h1 className="text-2xl font-bold mb-2">{`${first_name ?? ''} ${last_name ?? ''}`}</h1>
          <span className="text-blue-600 font-bold mb-6">{position}</span>
          <div className="flex mt-6">
            <Button variant="gray" onClick={() => push(`/employee/${query.id}/edit`)}>
              Edit Profile
            </Button>
          </div>
        </div>
      </div>
      <div className="flex mb-6">
        <Tabs menus={['Tentang', 'Akun Dashboard']} onClickTab={setActive} activeIndex={activeTab} />
      </div>
      {renderView()}
    </CardDashboard>
  );
};

const EmployeeInfo = ({
  data,
  isLoading,
}: {
  data: Omit<Employee, 'first_name' | 'last_name'>;
  isLoading: boolean;
}) => {
  const { birth_date, gender, email, phone_number, addresses } = data;
  const address = addresses?.filter((val) => val.title === 'Alamat Rumah')[0];
  const { village } = address ?? {};
  const { subdistrict } = village ?? {};
  const { city } = subdistrict ?? {};
  const { province } = city ?? {};

  if (isLoading) {
    return <div>Loading...</div>;
  }
  return (
    <div>
      <div className="flex mb-4">
        <div className="flex-0 flex-shrink-0 font-bold sm:w-48 w-36">Tanggal Lahir:</div>
        <div className="flex-1">{dayjs(birth_date).format('DD MMMM YYYY')}</div>
      </div>
      <div className="flex mb-4">
        <div className="flex-0 flex-shrink-0 font-bold sm:w-48 w-36">Jenis Kelamin:</div>
        <div className="flex-1">{gender === 'male' ? 'Laki-laki' : 'Perempuan'}</div>
      </div>
      <div className="flex mb-4">
        <div className="flex-0 flex-shrink-0 font-bold sm:w-48 w-36">Email:</div>
        <div className="flex-1 truncate">{email}</div>
      </div>
      <div className="flex mb-4">
        <div className="flex-0 flex-shrink-0 font-bold sm:w-48 w-36">Nomor Hp:</div>
        <div className="flex-1">{phone_number}</div>
      </div>
      <div className="flex mb-4">
        <div className="flex-0 flex-shrink-0 font-bold sm:w-48 w-36">{address?.title}:</div>
        <div className="flex-1">
          {province && address && (
            <>
              <div>{address?.complete_address ?? ''}</div>
              <div>{`Kelurahan ${village?.name ?? ''}, Kecamatan ${subdistrict?.name ?? ''}, ${city?.name ?? ''}, ${
                province?.name ?? ''
              }`}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const EmployeeAccount: React.FC<{ hasDashboardAccount: boolean; employeeId: string }> = ({
  hasDashboardAccount = true,
  employeeId,
}) => {
  const [isOpen, setOpen] = useState(false);
  function keyHandler(event: KeyboardEvent<HTMLDivElement>): void {
    switch (event.key) {
      case 'Enter':
        setOpen(true);
        break;
      default:
    }
  }
  if (!hasDashboardAccount) {
    return (
      <>
        <Modal isOpen={isOpen} onRequestClose={() => setOpen(false)}>
          <CreateAccountForm
            isEdit={false}
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
            employeeId={employeeId}
          />
        </Modal>
        <div>
          Akun belum diaktifkan,{' '}
          <span
            className="cursor-pointer text-blue-600"
            role="button"
            tabIndex={0}
            onKeyUp={keyHandler}
            onClick={() => setOpen(true)}
          >
            Aktifkan sekarang
          </span>
        </div>
      </>
    );
  }

  return (
    <div>
      <div className="flex mb-4">
        <div className="flex flex-shrink-0 font-bold" style={{ flexBasis: 200 }}>
          Account Username :
        </div>
        <div className="flex">adjiemuliadi</div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
