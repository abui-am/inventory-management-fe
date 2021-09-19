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
      background: 'transparent',
      border: 0,
      width: '100%',
      maxWidth: '28rem',
    },
  };

  return (
    <ReactModal {...props} style={customStyles} overlayClassName="modal-overlay">
      <div className="w-full rounded-2xl ml-auto mr-auto bg-white p-6 drop-shadow-lg">{children}</div>
    </ReactModal>
  );
};

export default Modal;
