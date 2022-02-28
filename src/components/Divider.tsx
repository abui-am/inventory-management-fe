import React from 'react';

const Divider: React.FC<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>> = (props) => {
  return <div style={{ height: 1 }} className="bg-blueGray-200 mt-4 mb-4 w-full" {...props} />;
};

export default Divider;
