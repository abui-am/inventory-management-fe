import React, {
  ChangeEvent,
  DetailedHTMLProps,
  InputHTMLAttributes,
  PropsWithChildren,
  TextareaHTMLAttributes,
  useId,
} from 'react';

import { Checkbox as UICheckbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label as UILabel } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/cn';

// Input polos dipisah dari Form.tsx supaya halaman yang hanya butuh ini — /login,
// /forget-password, /login/recover, form supplier — tidak ikut memuat react-select
// (tiga entry point) dan react-datepicker lewat barrel Form.tsx.
// Form.tsx tetap mengekspor ulang semuanya, jadi import lama tidak perlu diubah.
//
// Sejak Fase 3 semuanya adapter tipis ke components/ui: tampilannya di sana,
// di sini tinggal pemetaan prop lama supaya ~90 call site tidak perlu ikut berubah.

const TextField: React.FC<
  PropsWithChildren<
    DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
      variant?: 'outlined' | 'contained';
      hasError?: boolean;
      Icon?: JSX.Element;
    }
  >
  // `size` dilepas dari sebaran: atribut HTML `size` (angka) bentrok dengan prop varian
  // ukuran milik Input. Tidak ada satu pun pemanggil yang memakai atribut aslinya.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
> = ({ className, hasError, Icon, variant = 'outlined', size: _size, ...props }) => (
  <div className="relative">
    {Icon && (
      <div className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-foreground-subtle [&_svg]:size-4">
        {Icon}
      </div>
    )}
    <Input
      // id default dari name supaya htmlFor pada <Label> menemukan input ini tanpa
      // perlu menambah prop di ~50 call site.
      id={props.id ?? props.name}
      aria-invalid={hasError || undefined}
      aria-describedby={hasError && props.name ? `${props.name}-error` : undefined}
      {...props}
      className={cn(Icon && 'pl-8', variant === 'contained' && 'border-transparent bg-surface-raised', className)}
    />
  </div>
);

const TextArea: React.FC<PropsWithChildren<TextareaHTMLAttributes<HTMLTextAreaElement>>> = ({ id, name, ...props }) => (
  <Textarea id={id ?? name} name={name} {...props} />
);

const Checkbox: React.FC<PropsWithChildren<InputHTMLAttributes<HTMLInputElement>>> = ({ children, ...props }) => {
  // Tanpa id, label tidak bisa menunjuk ke input dan mengklik teksnya tidak
  // mencentang apa pun — target sentuh jadi 16px, bukan selebar barisnya.
  const fallbackId = useId();
  const id = props.id ?? props.name ?? fallbackId;
  return (
    <div className="flex items-center gap-2 text-sm">
      <UICheckbox {...props} id={id} />
      {children && (
        <label htmlFor={id} className="cursor-pointer select-none text-foreground">
          {children}
        </label>
      )}
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
> = ({ onChange, className, hasError, value, size: _size, ...props }) => (
  <div className="flex">
    <span className="inline-flex h-9 items-center rounded-l-md border border-r-0 border-border-strong bg-surface-raised px-2.5 text-base text-foreground-muted">
      +62
    </span>
    <Input
      id={props.id ?? props.name}
      aria-invalid={hasError || undefined}
      aria-describedby={hasError && props.name ? `${props.name}-error` : undefined}
      {...props}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange?.(`62${e.target.value}`)}
      type="number"
      value={value?.toString().slice(2)}
      className={cn('rounded-l-none', className)}
    />
  </div>
);

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
      <UILabel required={required} htmlFor={name} className="mb-1">
        {label}
      </UILabel>
      {children}
      {/* role="alert" supaya pesan error diumumkan screen reader saat muncul; sebelumnya
          <span> biasa yang tidak pernah terdengar. id-nya dirujuk aria-describedby kontrol. */}
      {hasError && (
        <span className="mt-1 block text-sm text-destructive" id={`${name}-error`} role="alert">
          {errors[name] as string}
        </span>
      )}
    </>
  );
};

export { Checkbox, PhoneNumberTextField, TextArea, TextField, WithLabelAndError };
