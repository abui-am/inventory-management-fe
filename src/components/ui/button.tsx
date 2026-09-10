import Tippy from '@tippyjs/react';
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
        // xs dan sm mengikuti dua tingkat kontrol di berkas desain, persis:
        //   .btn.sm -> 28px, padding 0 9px, 12px, radius 6px
        //   .btn    -> 32px, padding 0 12px, 13px, radius 7px
        // Tingkat 28px ditambahkan untuk area padat (toolbar, sel tabel); default 36px
        // dan lg 40px tetap seperti sebelumnya supaya halaman lain tidak bergeser.
        xs: 'h-7 px-2.25 text-sm [&_svg]:size-3.5',
        sm: 'h-8 rounded-control px-3 text-base [&_svg]:size-3.5',
        default: 'h-9 px-3 text-base [&_svg]:size-4',
        lg: 'h-10 px-4 text-base [&_svg]:size-4',
        icon: 'h-9 w-9 [&_svg]:size-4',
        'icon-sm': 'h-8 w-8 [&_svg]:size-3.5',
        // 26x26 dengan garis tipis — tombol aksi di dalam baris tabel.
        'icon-xs': 'size-[26px] border border-border text-foreground-muted [&_svg]:size-3.5',
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
    /**
     * Teks tooltip. Default: isi `aria-label`.
     *
     * Tombol berukuran ikon tidak punya teks apa pun di layar, jadi satu-satunya
     * penjelasnya adalah `aria-label` — yang hanya terbaca screen reader. Pengguna
     * yang melihat layar tidak punya cara mengetahui fungsinya selain mengklik dan
     * berharap. Karena itu tooltip dipasang otomatis untuk ukuran ikon, bukan
     * diserahkan ke tiap pemanggil untuk diingat.
     *
     * `false` mematikannya — dipakai kalau tombolnya sudah dibungkus Tippy sendiri.
     */
    tooltip?: string | false;
  };

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading = false, disabled, children, type, tooltip, ...props }, ref) => {
    const el = (
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
    );

    const label = tooltip ?? props['aria-label'];
    const ikon = typeof size === 'string' && size.startsWith('icon');
    if (!ikon || tooltip === false || !label) return el;

    return (
      // delay masuk 350ms: tanpa jeda, menyapu kursor melintasi baris tabel akan
      // memuntahkan tooltip beruntun. Keluar tanpa jeda supaya tidak tertinggal.
      <Tippy content={label} placement="top" delay={[350, 0]} offset={[0, 6]}>
        {el}
      </Tippy>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
export type { ButtonProps };
