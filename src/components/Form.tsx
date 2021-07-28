import clsx from 'clsx';
import React, {
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  useState,
} from 'react';

const TextField: React.FC<InputHTMLAttributes<unknown> & { variant?: 'outlined' | 'contained'; Icon?: JSX.Element }> =
  ({ className, Icon, variant = 'outlined', ...props }) => {
    const variation = variant === 'outlined' ? 'border-gray-300 border' : 'bg-blueGray-100';

    return (
      <div className="relative">
        {Icon && (
          <div className="absolute flex items-center left-3 top-0 bottom-0 m-auto text-blueGray-400">{Icon}</div>
        )}

        <input
          {...props}
          className={clsx(
            Icon ? 'pl-11' : '',
            variation,
            'h-11 w-full rounded-md px-3 outline-none',
            'focus:ring-blue-600 focus:ring-inset focus:border-transparent focus:outline-none focus:ring-2',
            'transition-all duration-150 ease-in',
            className
          )}
        />
      </div>
    );
  };

const TextArea: React.FC<TextareaHTMLAttributes<unknown>> = ({ className, ...props }) => {
  return (
    <textarea
      {...props}
      rows={3}
      className={clsx(
        'resize-none w-full border-gray-300 border rounded-md px-3 py-2 outline-none',
        'focus:ring-blue-600 focus:ring-inset focus:border-transparent focus:outline-none focus:ring-2',
        'transition-all duration-150 ease-in',
        className
      )}
    />
  );
};

const Button: React.FC<
  DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
    variant?: 'primary' | 'secondary';
    fullWidth?: boolean;
    Icon?: JSX.Element;
  }
> = ({ children, className, variant = 'primary', fullWidth, Icon, ...props }) => {
  const classes = { primary: 'bg-blue-600 shadow-md text-white', secondary: '' };
  return (
    <button
      type="button"
      className={clsx(
        Icon ? 'pl-10' : 'pl-4',
        'h-11 rounded-md font-bold whitespace-nowrap pr-4 relative',
        classes[variant],
        fullWidth ? 'w-full' : '',
        className
      )}
      {...props}
    >
      {Icon && (
        <div
          className={clsx(
            variant === 'primary' ? 'text-white' : '',
            'absolute flex items-center left-3 top-0 bottom-0 m-auto'
          )}
        >
          {Icon}
        </div>
      )}
      <div>{children}</div>
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

export { Button, Checkbox, TextArea, TextField };
