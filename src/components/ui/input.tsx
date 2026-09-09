import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, InputHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

/**
 * Input teks. Tiga tingkat tinggi: 28px, 32px, 36px.
 *
 * State error tidak punya prop sendiri: ia dibaca dari `aria-invalid`, jadi
 * penanda visual dan penanda untuk screen reader tidak bisa saling menyimpang.
 */
const inputBase = cn(
  'w-full border border-border-strong bg-surface text-foreground',
  'placeholder:text-foreground-subtle',
  'transition-colors duration-fast',
  'focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/25',
  'aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-destructive/25',
  'disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-foreground-subtle'
);

/**
 * Tinggi mengikuti dua tingkat kontrol di berkas desain: `.field` 32px radius 7px,
 * dan varian 28px untuk toolbar padat. `default` 36px dipertahankan supaya halaman
 * yang belum dipindahkan tidak ikut bergeser.
 */
const inputVariants = cva(inputBase, {
  variants: {
    size: {
      xs: 'h-7 rounded-md px-2 text-sm',
      sm: 'h-8 rounded-control px-2.5 text-base',
      default: 'h-9 rounded-md px-2.5 text-base',
    },
  },
  defaultVariants: { size: 'default' },
});

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & VariantProps<typeof inputVariants>;

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, size, ...props }, ref) => (
  <input ref={ref} className={cn(inputVariants({ size }), className)} {...props} />
));

Input.displayName = 'Input';

/** Kelas input ukuran default — dipakai komponen lain yang belum punya prop size. */
const inputClass = cn(inputVariants({ size: 'default' }));

export { Input, inputClass, inputVariants };
export type { InputProps };
