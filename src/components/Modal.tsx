/* eslint-disable no-nested-ternary */
import React from 'react';
import ReactModal, { Props } from 'react-modal';

const Modal: React.FC<Props & { style?: ReactModal.Styles; variant?: 'big' | 'normal' | 'large' }> = ({
  children,
  variant = 'normal',
  style,
  ...props
}) => {
  const customStyles = {
    overlay: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100vw',
    },
    content: {
      background: 'transparent',
      border: 0,
      position: 'relative',
      maxWidth: variant === 'big' ? '48rem' : variant === 'large' ? '56rem' : '32rem',
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
          maxWidth: variant === 'big' ? '48rem' : variant === 'large' ? '56rem' : '32rem',
        }}
      >
        <div className="w-full rounded-2xl ml-auto mr-auto bg-white p-6 drop-shadow-lg 100h">{children}</div>
      </div>
    </ReactModal>
  );
};

export default Modal;
