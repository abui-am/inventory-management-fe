import { cva, type VariantProps } from 'class-variance-authority';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

/**
 * Label status. Selalu pasangan `*-subtle` sebagai latar dan warna penuh sebagai teks —
 * bukan warna penuh sebagai latar — supaya sebaris tabel penuh badge tidak berubah jadi
 * papan warna dan status yang benar-benar butuh perhatian tetap menonjol.
 */
const badgeVariants = cva(
  // SPEC-35: 11px/600, padding 1px 7px, radius 5px, gap 4px, line-height 18px.
  'inline-flex items-center gap-1 whitespace-nowrap rounded-pill px-1.75 py-px text-xs font-semibold leading-[18px] [&_svg]:size-3',
  {
    variants: {
      variant: {
        neutral: 'bg-surface-raised text-foreground-muted',
        accent: 'bg-accent-subtle text-accent',
        success: 'bg-success-subtle text-success',
        warning: 'bg-warning-subtle text-warning',
        destructive: 'bg-destructive-subtle text-destructive',
        info: 'bg-info-subtle text-info',
      },
    },
    defaultVariants: { variant: 'neutral' },
  }
);

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps): JSX.Element {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
export type { BadgeProps };
