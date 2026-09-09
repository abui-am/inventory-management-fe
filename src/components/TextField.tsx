import clsx from 'clsx';
import React, {
  DetailedHTMLProps,
  InputHTMLAttributes,
  PropsWithChildren,
  TextareaHTMLAttributes,
  useState,
} from 'react';

import Label from './Label';

// Input polos dipisah dari Form.tsx supaya halaman yang hanya butuh ini — /login,
// /forget-password, /login/recover, form supplier — tidak ikut memuat react-select
// (tiga entry point) dan react-datepicker lewat barrel Form.tsx.
// Form.tsx tetap mengekspor ulang semuanya, jadi import lama tidak perlu diubah.

const TextField: React.FC<
  PropsWithChildren<
    DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
      variant?: 'outlined' | 'contained';
      hasError?: boolean;
      Icon?: JSX.Element;
    }
  >
> = ({ className, hasError, Icon, variant = 'outlined', ...props }) => {
  const variation = variant === 'outlined' ? 'border-gray-300 border' : 'bg-blueGray-100';
  const errorStyle = hasError ? 'ring-red-500 ring-inset border-transparent outline-none ring-2' : '';
  return (
    <div className="relative h-11">
      {Icon && (
        <div className="absolute h-4 flex items-center left-3 top-0 bottom-0 m-auto text-blueGray-400">{Icon}</div>
      )}

      <input
        // id default dari name supaya htmlFor pada <Label> menemukan input ini tanpa
        // perlu menambah prop di ~50 call site.
        id={props.id ?? props.name}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError && props.name ? `${props.name}-error` : undefined}
        {...props}
        className={clsx(
          Icon ? 'pl-11' : '',
          errorStyle,
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

const TextArea: React.FC<PropsWithChildren<TextareaHTMLAttributes<HTMLTextAreaElement>>> = ({
  className,
  ...props
}) => {
  return (
    <textarea
      id={props.id ?? props.name}
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

const Checkbox: React.FC<PropsWithChildren<InputHTMLAttributes<HTMLInputElement>>> = ({ children, ...props }) => {
  const [checked, setChecked] = useState(false);
  return (
    <div className="flex relative items-center text-sm">
      <input
        id={props.id ?? props.name}
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

const PhoneNumberTextField: React.FC<
  PropsWithChildren<
    Omit<DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, 'onChange'> & {
      hasError: boolean;
      onChange: (phoneNumber: string) => void;
    }
  >
> = ({ onChange, className, hasError, value, ...props }) => {
  const errorStyle = hasError ? 'ring-red-500 ring-inset border-transparent outline-none ring-2' : '';
  return (
    <div className="flex">
      <div className="flex items-center top-0 bottom-0 m-auto text-blueGray-400 px-3 border h-11 border-r-0 border-gray-300 rounded-tl-md rounded-bl-md">
        +62
      </div>

      <input
        id={props.id ?? props.name}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError && props.name ? `${props.name}-error` : undefined}
        {...props}
        onChange={(e) => {
          if (onChange) {
            onChange(`62${e.target.value}`);
          }
        }}
        type="number"
        value={value?.toString().slice(2)}
        className={clsx(
          errorStyle,
          'h-11 w-full px-3 outline-none rounded-tr-md rounded-br-md border-gray-300 border',
          'focus:ring-blue-600 focus:ring-inset focus:border-transparent focus:outline-none focus:ring-2',
          'transition-all duration-150 ease-in',
          className
        )}
      />
    </div>
  );
};

const WithLabelAndError: React.FC<
  PropsWithChildren<{
    label: string;
    errors: Record<string, unknown>;
    touched: Record<string, unknown>;
    name: string;
    required?: boolean;
  }>
> = ({ label, children, errors, touched, name, required }) => {
  const hasError = !!errors[name] && !!touched[name];
  return (
    <>
      <Label required={required} htmlFor={name}>
        {label}
      </Label>
      {children}
      {/* role="alert" supaya pesan error diumumkan screen reader saat muncul; sebelumnya
          <span> biasa yang tidak pernah terdengar. id-nya dirujuk aria-describedby kontrol. */}
      {hasError && (
        <span className="text-xs text-red-500" id={`${name}-error`} role="alert">
          {errors[name] as string}
        </span>
      )}
    </>
  );
};

export { Checkbox, PhoneNumberTextField, TextArea, TextField, WithLabelAndError };
