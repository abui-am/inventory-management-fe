/* eslint-disable no-nested-ternary */
import React from 'react';
import ReactModal, { Props } from 'react-modal';

export type ModalVariant = 'big' | 'normal' | 'large' | 'screen';

const Modal: React.FC<Props & { style?: ReactModal.Styles; variant?: ModalVariant }> = ({
  children,
  variant = 'normal',
  style,
  ...props
}) => {
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
          className="w-full rounded-2xl ml-auto mr-auto bg-white p-6 drop-shadow-lg 100h max-h-screen overflow-y-scroll"
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

export const ModalActionWrapper: React.FC = ({ children }) => {
  return <div className="mt-4 flex justify-end">{children}</div>;
};

export default Modal;
