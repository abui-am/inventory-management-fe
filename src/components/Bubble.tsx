import Tippy from '@tippyjs/react';
import clsx from 'clsx';
import React from 'react';
import { Check, X } from 'react-bootstrap-icons';

type BubbleProps = {
  isValid: boolean;
};

const Bubble = ({ isValid }: BubbleProps): JSX.Element => {
  return (
    <div
      className={clsx(
        !isValid ? 'bg-red-600' : 'bg-green-600',
        'text-white rounded-full w-6 h-6 flex items-center justify-center'
      )}
    >
      <Tippy content={isValid ? 'Jumlah stock sesuai dengan sistem' : 'Jumlah stock tidak sesuai dengan sistem'}>
        {isValid ? <Check width={16} height={16} /> : <X width={16} height={16} />}
      </Tippy>
    </div>
  );
};

export default Bubble;
