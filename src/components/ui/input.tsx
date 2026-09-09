import { forwardRef, InputHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

/**
 * Input teks. Tinggi 36px, sejajar dengan Button `default`.
 *
 * State error tidak punya prop sendiri: ia dibaca dari `aria-invalid`, jadi
 * penanda visual dan penanda untuk screen reader tidak bisa saling menyimpang.
 */
const inputClass = cn(
  'h-9 w-full rounded-md border border-border-strong bg-surface px-2.5 text-base text-foreground',
  'placeholder:text-foreground-subtle',
  'transition-colors duration-fast',
  'focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/25',
  'aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-destructive/25',
  'disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-foreground-subtle'
);

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(inputClass, className)} {...props} />
));

Input.displayName = 'Input';

export { Input, inputClass };
