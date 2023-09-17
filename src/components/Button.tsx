/* eslint-disable react/require-default-props */
import Tippy from '@tippyjs/react';
import clsx from 'clsx';
import React, { ButtonHTMLAttributes, DetailedHTMLProps, forwardRef, RefObject, useState } from 'react';
import { X } from 'react-bootstrap-icons';

import { useUpdateStockIn } from '@/hooks/mutation/useMutateStockIn';

import Modal, { ModalActionWrapper } from './Modal';

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
  variant?: 'primary' | 'secondary' | 'gray' | 'outlined' | 'danger';
  fullWidth?: boolean;
  Icon?: JSX.Element;
  size?: 'small' | 'medium';
  loading?: boolean;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, variant = 'primary', fullWidth, Icon, size, ...props }, ref) => {
    const classes = {
      primary: 'bg-blue-600 hover:bg-blue-700 shadow-md text-white',
      secondary: 'hover:text-blue-600',
      gray: 'bg-blueGray-200 hover:text-white hover:bg-blue-600',
      outlined: 'border border-blue-600 rounded-md text-blue-600 hover:bg-blue-600 hover:text-white',
      danger: 'bg-red-500 text-white hover:text-white hover:bg-red-600',
    };

    const classesDisabled = {
      primary: 'disabled:bg-blue-400 disabled:cursor-auto',
      secondary: 'disabled:cursor-auto',
      gray: 'disabled:cursor-auto',
      outlined: 'disabled:border-gray-600 disabled:text-gray-600',
      danger: 'disabled:cursor-auto',
    };
    return (
      <button
        type="button"
        className={clsx(
          'rounded-md font-bold relative transition-colors',
          size === 'small' ? 'min-h-9 px-2 py-1' : 'min-h-11 px-4 py-2',
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
  ...props
}: {
  text: any;
  children: ((val: { handleClose: () => void }) => JSX.Element) | JSX.Element;
} & ButtonProps & { ref?: RefObject<HTMLButtonElement> }): JSX.Element => {
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
      <Button onClick={handleClick} {...props}>
        {text}
      </Button>
    </>
  );
};

const ButtonCancelTransaction: React.FC<{ content?: string; transactionId: string }> = ({ content, transactionId }) => {
  const { mutateAsync: updateStockIn } = useUpdateStockIn();

  return (
    <Tippy content={content || 'Batalkan barang masuk'}>
      <ButtonWithModal text={<X width={24} height={24} />} size="small" variant="outlined">
        {({ handleClose }) => {
          const handleClick = () => {
            try {
              updateStockIn({
                transactionId,
                data: {
                  status: 'declined',
                },
              });
              handleClose();
            } catch (e) {
              console.error(e);
            }
          };
          return (
            <>
              <h2 className="text-xl font-bold mb-4">Konfirmasi</h2>
              <p>Batalkan barang masuk?</p>
              <ModalActionWrapper>
                <Button variant="secondary" className="mr-2" onClick={handleClose}>
                  Tidak
                </Button>

                <Button onClick={handleClick}>Batalkan</Button>
              </ModalActionWrapper>
            </>
          );
        }}
      </ButtonWithModal>
    </Tippy>
  );
};

export { Button, ButtonCancelTransaction, RoundedButton };
