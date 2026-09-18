import { forwardRef, LabelHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean };

/**
 * Label SELALU `block`, tidak pernah `inline-block`.
 *
 * Sebagai `inline-block` ia duduk di atas garis dasar sebuah baris teks, dan ruang untuk
 * ekor huruf di bawahnya (±4px) ikut terhitung tinggi — jadi kontrol di bawahnya turun
 * sebanyak itu. Selama satu kolom, tidak ada yang sadar. Begitu dua kolom bersebelahan
 * dan salah satunya menambahkan `block` sendiri di kelasnya, keduanya jadi tidak sejajar
 * persis sebanyak ruang ekor huruf itu — yang terjadi pada isian Jumlah dan Sumber dana
 * di dialog "Catat beban".
 *
 * Bintang wajib memakai `aria-hidden`: statusnya sudah disampaikan `aria-required`
 * pada kontrolnya, jadi screen reader tidak perlu membacakan "bintang".
 */
const Label = forwardRef<HTMLLabelElement, LabelProps>(({ className, required, children, ...props }, ref) => (
  <label ref={ref} className={cn('block text-sm font-medium text-foreground-muted', className)} {...props}>
    {children}
    {required && (
      <span className="ml-0.5 text-destructive" aria-hidden="true">
        *
      </span>
    )}
  </label>
));

Label.displayName = 'Label';

export { Label };
