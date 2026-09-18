import Tippy from '@tippyjs/react';
import clsx from 'clsx';
import React from 'react';
import { Check, X } from 'react-bootstrap-icons';

type BubbleProps = {
  isValid: boolean;
};

function Bubble({ isValid }: BubbleProps): JSX.Element {
  return (
    <div
      className={clsx(
        !isValid ? 'bg-red-600' : 'bg-green-600',
        'text-white rounded-full w-6 h-6 flex items-center justify-center'
      )}
    >
      <Tippy content={isValid ? 'Hitungan cocok dengan stok sistem' : 'Hitungan tidak cocok dengan stok sistem'}>
        {isValid ? <Check width={16} height={16} /> : <X width={16} height={16} />}
      </Tippy>
    </div>
  );
}

export default Bubble;
