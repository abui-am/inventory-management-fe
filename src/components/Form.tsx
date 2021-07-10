import clsx from 'clsx';
import React, { InputHTMLAttributes, useState } from 'react';

const TextField: React.FC<InputHTMLAttributes<unknown>> = ({ className, ...props }) => {
  return (
    <input
      {...props}
      className={clsx(
        'h-11 w-full border-gray-300 border rounded-md px-3 outline-none',
        'focus:ring-blue-600 focus:ring-inset focus:border-transparent focus:outline-none focus:ring-2',
        'transition-all duration-150 ease-in',
        className
      )}
    />
  );
};

const Button: React.FC<InputHTMLAttributes<unknown>> = ({ children, className, ...props }) => {
  return (
    <button
      {...props}
      type="button"
      className={clsx('h-11 w-full rounded-md bg-blue-600 shadow-md text-white font-bold', className)}
    >
      {children}
    </button>
  );
};

const Checkbox: React.FC<InputHTMLAttributes<unknown>> = ({ children, ...props }) => {
  const [checked, setChecked] = useState(false);
  return (
    <div className="flex relative items-center">
      <input
        onClick={() => setChecked((val) => !val)}
        type="checkbox"
        className={`mr-2 h-4 w-4 border border-gray-300 rounded-sm checked:bg-blue-600 checked:border-transparent focus:outline-none ${
          !checked ? 'appearance-none' : ''
        }`}
        {...props}
      />
      {/* <div className="bg-white border-2 rounded-md border-grey-300 h-4 w-4 flex flex-shrink-0 justify-center items-center mr-2 hover:border-blue-500" /> */}
      {children}
    </div>
  );
};

export { Button, Checkbox, TextField };