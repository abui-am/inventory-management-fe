import React from 'react';

const Label: React.FC<{ required?: boolean }> = ({ required, children }) => {
  return (
    <div>
      <label className="mb-1 inline-block">{children}</label>
      {required && <label className="mb-1 text-red-600">*</label>}
    </div>
  );
};

export default Label;
