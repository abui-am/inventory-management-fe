import clsx from 'clsx';
import React from 'react';

type TagProps = {
  variant: 'primary' | 'secondary';
};

const Tag: React.FC<TagProps> = ({ children, variant }) => {
  return (
    <div
      className={clsx(
        'rounded px-3 py-1 font-bold border-solid border inline-block',
        variant === 'primary' ? 'border-blue-600 text-blue-600' : 'border-gray-600 text-gray-600'
      )}
    >
      {children}
    </div>
  );
};

export default Tag;
