/* eslint-disable no-nested-ternary */
import React, { PropsWithChildren } from 'react';
import ReactModal, { Props } from 'react-modal';

import { cn } from '@/lib/cn';

export type ModalVariant = 'big' | 'normal' | 'large' | 'screen';

const Modal: React.FC<
  PropsWithChildren<Props & { style?: ReactModal.Styles; variant?: ModalVariant; bodyClassName?: string }>
> = ({ children, variant = 'normal', style, bodyClassName, ...props }) => {
  const getWidth = (variant: ModalVariant) => {
    switch (variant) {
      case 'big':
        return '48rem';
      case 'large':
        return '56rem';
      case 'normal':
        return '32rem';
      case 'screen':
        return '68rem';
      default:
        return '32rem';
    }
  };

  const customStyles = {
    overlay: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100vw',
    },
    content: {
      background: 'transparent',
      position: 'relative',
      border: 0,
      insetBlockStart: 40,
      insetBlockEnd: 40,
      width: '100vw',
      inset: 0,
      maxWidth: getWidth(variant),
    },
  } as ReactModal.Styles;

  return (
    <ReactModal {...props} style={{ ...customStyles, ...style }} overlayClassName="modal-overlay">
      <div
        style={{
          border: 0,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          // overflow-y-auto, bukan -scroll: yang lama selalu menampilkan batang gulir
          // walau isinya pendek, jadi tiap dialog punya jalur abu-abu kosong di sisinya.
          // Padding bisa ditimpa: dialog padat memakai p-4, sisanya tetap p-5.
          className={cn(
            'ml-auto mr-auto w-full overflow-y-auto rounded-xl border border-border bg-surface p-5 shadow-md',
            bodyClassName
          )}
          style={{
            maxHeight: '80vh',
          }}
        >
          {children}
        </div>
      </div>
    </ReactModal>
  );
};

export const ModalActionWrapper: React.FC<PropsWithChildren<unknown>> = ({ children }) => {
  return <div className="mt-4 flex justify-end">{children}</div>;
};

export default Modal;
