import { forwardRef, LabelHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean };

/**
 * Bintang wajib memakai `aria-hidden`: statusnya sudah disampaikan `aria-required`
 * pada kontrolnya, jadi screen reader tidak perlu membacakan "bintang".
 */
const Label = forwardRef<HTMLLabelElement, LabelProps>(({ className, required, children, ...props }, ref) => (
  <label ref={ref} className={cn('inline-block text-sm font-medium text-foreground-muted', className)} {...props}>
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
