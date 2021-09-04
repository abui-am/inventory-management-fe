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
    },
  };

  return (
    <ReactModal {...props} style={customStyles}>
      <div className="max-w-md">{children}</div>
    </ReactModal>
  );
};

export default Modal;
