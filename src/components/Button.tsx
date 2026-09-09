/* eslint-disable react/require-default-props */
import Tippy from '@tippyjs/react';
import React, {
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  forwardRef,
  PropsWithChildren,
  RefObject,
  useState,
} from 'react';
import { X } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';

import { Button as UIButton, type ButtonProps as UIButtonProps } from '@/components/ui/button';
import { useUpdateStockIn } from '@/hooks/mutation/useMutateStockIn';
import { cn } from '@/lib/cn';
import reportError from '@/utils/reportError';

import Modal, { ModalActionWrapper } from './Modal';

/**
 * Adapter ke primitive baru di components/ui/button. Nama varian lama dipetakan
 * supaya 25 pemanggil tidak perlu ikut berubah di batch ini; call site dipindahkan
 * ke `@/components/ui/button` saat halamannya digarap di Fase 4.
 */
const LEGACY_VARIANT = {
  primary: 'default',
  secondary: 'ghost',
  gray: 'secondary',
  outlined: 'outline',
  danger: 'destructive',
} as const;

const RoundedButton = forwardRef<
  HTMLButtonElement,
  PropsWithChildren<DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>>
>(({ children, className, ...props }, ref) => (
  <UIButton ref={ref} variant="ghost" size="icon" className={cn('rounded-full', className)} {...props}>
    {children}
  </UIButton>
));

RoundedButton.displayName = 'RoundedButton';

type ButtonProps = Omit<UIButtonProps, 'variant' | 'size'> & {
  variant?: keyof typeof LEGACY_VARIANT;
  fullWidth?: boolean;
  Icon?: JSX.Element;
  size?: 'small' | 'medium';
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size, Icon, ...props }, ref) => (
    <UIButton ref={ref} variant={LEGACY_VARIANT[variant]} size={size === 'small' ? 'sm' : 'default'} {...props}>
      {Icon}
      {children}
    </UIButton>
  )
);

Button.displayName = 'Button';

export function ButtonWithModal({
  text,
  children,
  ...props
}: {
  text: any;
  // Render prop. `children` di-Omit dari ButtonProps supaya tipe ini yang menang:
  // ButtonProps menyumbang `children?: ReactNode`, dan sejak React 18 sebuah fungsi
  // bukan ReactNode yang sah — di React 17 lolos karena ReactNode memuat `{}`.
  children: ((val: { handleClose: () => void }) => JSX.Element) | JSX.Element;
} & Omit<ButtonProps, 'children'> & { ref?: RefObject<HTMLButtonElement> }): JSX.Element {
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
}

const ButtonCancelTransaction: React.FC<PropsWithChildren<{ content?: string; transactionId: string }>> = ({
  content,
  transactionId,
}) => {
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
              reportError(e, { action: 'decline-transaction' });
              toast.error('Gagal menolak transaksi');
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
