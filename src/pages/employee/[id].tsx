import dayjs from 'dayjs';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import Tabs from '@/components/Tabs';
import { useFetchEmployeeById } from '@/hooks/query/useFetchEmployee';
import { Employee } from '@/typings/employee';

const EmployeeDetails: NextPage = () => {
  const [activeTab, setActive] = useState(0);
  const { query = {}, push } = useRouter();
  const { data, isLoading } = useFetchEmployeeById(query.id as string);
  const { first_name, last_name, position, ...rest } = data?.data.employee ?? {};

  return (
    <CardDashboard>
      <div className="flex mb-7">
        <img className="w-60 h-60" alt="profile" src="https://randomuser.me/api/portraits/women/44.jpg" />
        <div className="mt-2 ml-10">
          <h1 className="text-2xl font-bold mb-2">{`${first_name} ${last_name}`}</h1>
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
      <EmployeeInfo isLoading={isLoading} data={rest as Omit<Employee, 'first_name' | 'last_name'>} />
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
        <div className="flex flex-shrink-0 font-bold" style={{ flexBasis: 200 }}>
          Tanggal Lahir :
        </div>
        <div className="flex">{dayjs(birth_date).format('DD MMMM YYYY')}</div>
      </div>
      <div className="flex mb-4">
        <div className="flex flex-shrink-0 font-bold" style={{ flexBasis: 200 }}>
          Jenis Kelamin :
        </div>
        <div className="flex">{gender === 'male' ? 'Laki-laki' : 'Perempuan'}</div>
      </div>
      <div className="flex mb-4">
        <div className="flex flex-shrink-0 font-bold" style={{ flexBasis: 200 }}>
          Email :
        </div>
        <div className="flex">{email}</div>
      </div>
      <div className="flex mb-4">
        <div className="flex flex-shrink-0 font-bold" style={{ flexBasis: 200 }}>
          Nomor Hp :
        </div>
        <div className="flex">{phone_number}</div>
      </div>
      <div className="flex mb-4">
        <div className="flex flex-shrink-0 font-bold" style={{ flexBasis: 200 }}>
          {address?.title}
        </div>
        <div>
          <div>{address?.complete_address ?? ''}</div>
          <div>{`Kelurahan ${village?.name ?? ''}, Kecamatan ${subdistrict?.name ?? ''}, ${city?.name}, ${
            province?.name ?? ''
          }`}</div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
