import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import Tabs from '@/components/Tabs';
import { useFetchEmployeeById } from '@/hooks/query/useFetchEmployee';
import { Employee } from '@/typings/employee';
import { makeServerEmployee } from '@/utils/server';

const EmployeeDetails = () => {
  makeServerEmployee();
  const [activeTab, setActive] = useState(0);
  const { query = {} } = useRouter();
  const { data } = useFetchEmployeeById(query.id as string);

  const { first_name, last_name, ...rest } = data?.data.employee ?? {};

  return (
    <CardDashboard>
      <div className="flex mb-7">
        <img className="w-60 h-60" alt="profile" src="https://randomuser.me/api/portraits/women/44.jpg" />
        <div className="mt-2 ml-10">
          <h1 className="text-2xl font-bold mb-2">{`${first_name} ${last_name}`}</h1>
          <span className="text-blue-600 font-bold mb-6">position</span>
          <div className="flex mt-6">
            <Button variant="gray">Edit Profile</Button>
          </div>
        </div>
      </div>
      <div className="flex mb-6">
        <Tabs menus={['Tentang', 'Akun Dashboard']} onClickTab={setActive} activeIndex={activeTab} />
      </div>
      <EmployeeInfo data={rest as Omit<Employee, 'first_name' | 'last_name'>} />
    </CardDashboard>
  );
};

const EmployeeInfo = ({ data }: { data: Omit<Employee, 'first_name' | 'last_name'> }) => {
  const { birth_date, gender, email, phone_number, addresses } = data;
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
          Address :
        </div>
        <div className="flex">{addresses.filter((val) => val.title === 'Alamat Rumah')[0].complete_address}</div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
