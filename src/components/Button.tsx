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

const Button: React.FC<
  DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
    variant?: 'primary' | 'secondary';
    fullWidth?: boolean;
    Icon?: JSX.Element;
  }
> = ({ children, className, variant = 'primary', fullWidth, Icon, ...props }) => {
  const classes = { primary: 'bg-blue-600 hover:bg-blue-700 shadow-md text-white', secondary: 'hover:text-blue-600' };
  return (
    <button
      type="button"
      className={clsx(
        Icon ? 'pl-10' : 'pl-4',
        'h-11 rounded-md font-bold whitespace-nowrap pr-4 relative transition-colors',
        classes[variant],
        fullWidth ? 'w-full' : '',
        className
      )}
      {...props}
    >
      {Icon && (
        <div
          className={clsx(
            variant === 'primary' ? 'text-white' : '',
            'absolute flex items-center left-3 top-0 bottom-0 m-auto'
          )}
        >
          {Icon}
        </div>
      )}
      <div>{children}</div>
    </button>
  );
};

export { Button, RoundedButton };
