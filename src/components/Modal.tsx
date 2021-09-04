import React from 'react';
import ReactModal, { Props } from 'react-modal';

const Modal: React.FC<Props> = ({ children, ...props }) => {
  const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      TwShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      boxShadow: 'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)',
      borderRadius: 16,
    },
  };

  return (
    <ReactModal {...props} style={customStyles} overlayClassName="modal-overlay">
      <div className="max-w-md">{children}</div>
    </ReactModal>
  );
};

export default Modal;
