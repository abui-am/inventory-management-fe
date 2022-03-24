import dayjs from 'dayjs';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { KeyboardEvent, useState } from 'react';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import CreateAccountForm from '@/components/form/CreateAccountForm';
import Modal from '@/components/Modal';
import Tabs from '@/components/Tabs';
import Tag from '@/components/Tag';
import { usePermission } from '@/context/permission-context';
import { useFetchEmployeeById, useFetchMyself } from '@/hooks/query/useFetchEmployee';
import { useFetchUserById } from '@/hooks/query/useFetchUser';
import { Employee } from '@/typings/employee';
import { formatDate } from '@/utils/format';
import formatCurrency from '@/utils/formatCurrency';

const EmployeeDetails: NextPage = () => {
  const [activeTab, setActive] = useState(0);
  const { query = {}, push } = useRouter();
  const { data, isLoading } = useFetchEmployeeById(query.id as string);
  const { first_name, last_name, position, id, has_dashboard_account, user, ...rest } = data?.data.employee ?? {};
  const { state } = usePermission();

  const { data: dataUser } = useFetchMyself();
  const isSelf = id === dataUser?.data?.user?.employee.id;
  const renderView = () => {
    switch (activeTab) {
      case 0:
        return <EmployeeInfo isLoading={isLoading} data={rest as Omit<Employee, 'first_name' | 'last_name'>} />;
      case 1:
        return (
          <EmployeeAccount
            employeeId={id ?? ''}
            userId={user?.id ?? ''}
            hasDashboardAccount={has_dashboard_account ?? false}
          />
        );
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
            {(state.permission.includes('control:profile') || isSelf) && (
              <Button variant="gray" onClick={() => push(`/employee/${query.id}/edit`)}>
                Edit Profile
              </Button>
            )}
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
  const { birth_date, gender, email, phone_number, addresses, salary, active } = data;
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
      {active !== undefined && (
        <>
          <div className="relative flex py-5 items-center">
            <span className="text-lg font-bold flex-shrink mr-4">Info Khusus Perusahaan</span>
            <div className="flex-grow border-t border-gray-400" />
          </div>

          <div className="flex mb-4">
            <div className="flex-0 flex-shrink-0 font-bold sm:w-48 w-36">Gaji:</div>
            <div className="flex-1">{formatCurrency({ value: salary })}</div>
          </div>

          {/* <div className="flex mb-4">
            <div className="flex-0 flex-shrink-0 font-bold sm:w-48 w-36">Jumlah Hutang:</div>
            <div className="flex-1">{debt ? formatCurrency({ value: debt }) : 'IDR 0'}</div>
          </div> */}
          <div className="flex mb-4">
            <div className="flex-0 flex-shrink-0 font-bold sm:w-48 w-36">Pegawai Aktif:</div>
            <div className="flex-1">{active ? 'Iya' : 'Tidak'}</div>
          </div>
        </>
      )}
    </div>
  );
};

const EmployeeAccount: React.FC<{ hasDashboardAccount: boolean; employeeId: string; userId: string }> = ({
  hasDashboardAccount = true,
  employeeId,
  userId,
}) => {
  const [isOpen, setOpen] = useState(false);
  const { data } = useFetchUserById(userId, { enabled: !!userId });
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
        <div className="flex-0 flex-shrink-0 font-bold sm:w-48 w-36">Username:</div>
        <div className="flex-1">{data?.data.user.username}</div>
      </div>
      <div className="flex mb-4">
        <div className="flex-0 flex-shrink-0 font-bold sm:w-48 w-36">Tanggal dibuat:</div>
        <div className="flex-1">{formatDate(data?.data.user.created_at ?? new Date())}</div>
      </div>
      <div className="flex mb-4">
        <div className="flex-0 flex-shrink-0 font-bold sm:w-48 w-36">Roles:</div>
        <div className="flex-1">
          {data?.data.user.roles.map(({ name, id }) => (
            <Tag variant="secondary" key={id}>
              {name}
            </Tag>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
