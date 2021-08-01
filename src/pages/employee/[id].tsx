import React from 'react';

import { CardDashboard } from '@/components/Container';

const EmployeeDetails = () => {
  return (
    <CardDashboard>
      <div className="flex">
        <img className="w-60 h-60" alt="profile" src="https://randomuser.me/api/portraits/women/44.jpg" />
        <div className="mt-2 ml-10">
          <h1 className="text-2xl font-bold mb-2">Abuidillah Adjie Muliadi</h1>
          <span className="text-blue-600 font-bold mb-6">Staff Gudang</span>
        </div>
      </div>
    </CardDashboard>
  );
};

export default EmployeeDetails;
