import clsx from 'clsx';
import React, { ButtonHTMLAttributes, DetailedHTMLProps, forwardRef, useState } from 'react';

import Modal from './Modal';

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

type ButtonProps = DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'gray' | 'outlined';
  fullWidth?: boolean;
  Icon?: JSX.Element;
  size?: 'small' | 'medium';
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, variant = 'primary', fullWidth, Icon, size, ...props }, ref) => {
    const classes = {
      primary: 'bg-blue-600 hover:bg-blue-700 shadow-md text-white',
      secondary: 'hover:text-blue-600',
      gray: 'bg-blueGray-200 hover:text-white hover:bg-blue-600',
      outlined: 'border border-blue-600 rounded-md text-blue-600 hover:bg-blue-600 hover:text-white',
    };

    const classesDisabled = {
      primary: 'disabled:bg-blue-400 disabled:cursor-auto',
      secondary: 'disabled:cursor-auto',
      gray: 'disabled:cursor-auto',
      outlined: 'disabled:border-gray-600 disabled:text-gray-600',
    };
    return (
      <button
        type="button"
        className={clsx(
          'rounded-md font-bold whitespace-nowrap relative transition-colors',
          size === 'small' ? 'h-9 px-2 py-1' : 'h-11 px-4 py-2',
          classes[variant],
          classesDisabled[variant],
          fullWidth ? 'w-full' : '',
          Icon ? 'pl-10' : '',
          className
        )}
        {...props}
        ref={ref}
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
  }
);

export const ButtonWithModal = ({
  text,
  children,
}: {
  text: string;
  children: ((val: { handleClose: () => void }) => JSX.Element) | JSX.Element;
}) => {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Modal isOpen={open} onRequestClose={handleClose}>
        {typeof children === 'function' ? children({ handleClose }) : children}
      </Modal>
      <Button onClick={handleClick}>{text}</Button>
    </>
  );
};

export { Button, RoundedButton };
