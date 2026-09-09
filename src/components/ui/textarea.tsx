import { forwardRef, TextareaHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

import { inputClass } from './input';

const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 3, ...props }, ref) => (
    // `h-9` dari inputClass diganti tinggi otomatis; twMerge yang memenangkan kelas terakhir.
    <textarea ref={ref} rows={rows} className={cn(inputClass, 'h-auto resize-y py-2', className)} {...props} />
  )
);

Textarea.displayName = 'Textarea';

export { Textarea };
