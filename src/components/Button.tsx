import React, { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';

const RoundedButton: React.FC<DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>> = ({
  children,
  ...props
}) => {
  return (
    <button
      type="button"
      {...props}
      className="p-2 hover:bg-blueGray-400 rounded-full cursor-pointer transition-color duration-75 ease-out"
    >
      {children}
    </button>
  );
};

export { RoundedButton };
