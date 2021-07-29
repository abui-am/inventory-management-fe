import clsx from 'clsx';
import React, { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';

const RoundedButton: React.FC<DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <button
      type="button"
      {...props}
      className={clsx(
        'p-2 hover:bg-blueGray-400 rounded-full flex items-center justify-center cursor-pointer transition-color duration-75 ease-out',
        className
      )}
    >
      {children}
    </button>
  );
};

export { RoundedButton };
