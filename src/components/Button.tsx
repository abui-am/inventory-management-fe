import React from 'react';

const RoundedButton: React.FC = ({ children }) => {
  return (
    <button
      type="button"
      className="p-2 hover:bg-blueGray-400 rounded-full cursor-pointer transition-color duration-75 ease-out"
    >
      {children}
    </button>
  );
};

export { RoundedButton };
