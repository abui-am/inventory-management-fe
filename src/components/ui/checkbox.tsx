import { Check } from 'lucide-react';
import { forwardRef, InputHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

/**
 * Checkbox tanpa state internal. Yang lama menyimpan `checked`-nya sendiri sambil
 * tetap menerima `checked` dari pemanggil, jadi dua sumber kebenaran yang bisa
 * berbeda; centangnya juga cuma "kotak biru" tanpa tanda centang.
 *
 * Di sini `<input>` asli tetap dipakai (fokus, keyboard, form, dan `indeterminate`
 * ikut gratis), hanya tampilannya diganti — tanda centang muncul lewat `peer-checked`.
 */
const Checkbox = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>>(
  ({ className, ...props }, ref) => (
    <span className="relative inline-flex shrink-0">
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          'peer size-4 cursor-pointer appearance-none rounded-sm border border-border-strong bg-surface',
          'transition-colors duration-fast',
          'checked:border-accent checked:bg-accent',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
          // opacity, bukan ganti warna latar: menimpa `checked:bg-accent` dengan warna
          // terang membuat tanda centang putih hilang di state disabled+checked.
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
      <Check
        className="pointer-events-none absolute inset-0 m-auto size-3 text-accent-foreground opacity-0 peer-checked:opacity-100"
        strokeWidth={3}
        aria-hidden
      />
    </span>
  )
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
