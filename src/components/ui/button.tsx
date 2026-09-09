import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes, forwardRef } from 'react';

import { cn } from '@/lib/cn';

/**
 * Primitive tombol. Semua warna lewat token, jadi ikut berganti di mode gelap
 * tanpa satu pun kelas `dark:`.
 *
 * Tinggi: sm 32px, default 36px, lg 40px. Lebih pendek dari tombol lama
 * (36/44px) sesuai arah design system yang compact — Linear memakai 32px.
 */
const buttonVariants = cva(
  cn(
    'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-semibold',
    'transition-colors duration-fast',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-45',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0'
  ),
  {
    variants: {
      variant: {
        default: 'bg-accent text-accent-foreground shadow-sm hover:bg-accent-hover',
        secondary: 'bg-surface-raised text-foreground hover:bg-surface-sunken',
        outline: 'border border-border-strong bg-surface text-foreground hover:bg-surface-raised',
        ghost: 'text-foreground-muted hover:bg-surface-raised hover:text-foreground',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        'destructive-outline': 'border border-destructive bg-surface text-destructive hover:bg-destructive-subtle',
      },
      size: {
        sm: 'h-8 px-2.5 text-sm [&_svg]:size-3.5',
        default: 'h-9 px-3 text-base [&_svg]:size-4',
        lg: 'h-10 px-4 text-base [&_svg]:size-4',
        icon: 'h-9 w-9 [&_svg]:size-4',
        'icon-sm': 'h-8 w-8 [&_svg]:size-3.5',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    /** Menampilkan spinner dan mematikan tombol supaya aksi tidak terkirim dua kali. */
    loading?: boolean;
  };

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading = false, disabled, children, type, ...props }, ref) => (
    <button
      // Default `submit` milik HTML adalah sumber form ter-submit tanpa sengaja.
      // eslint-disable-next-line react/button-has-type
      type={type ?? 'button'}
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </button>
  )
);

Button.displayName = 'Button';

export { Button, buttonVariants };
export type { ButtonProps };
