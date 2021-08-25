import clsx from 'clsx';
import React from 'react';

export type SimpleListProps = {
  label: string;
  value: string | number;
  withTopDivider: boolean;
};

const SimpleList: React.FC<SimpleListProps> = ({ label, value, withTopDivider }) => {
  return (
    <div
      className={clsx('flex px-6 py-3 items-center justify-center', withTopDivider ? 'border-t to-blueGray-100' : '')}
    >
      <img src="/images/storage-mockup.svg" alt="item" className="w-8 h-8 mr-6 rounded flex-grow-0" />
      <div className="flex flex-1 justify-between">
        <span className="flex-1">{label}</span>
        <span className="flex-1 font-bold text-right">{value}</span>
      </div>
    </div>
  );
};

export default SimpleList;
