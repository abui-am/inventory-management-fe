/* eslint-disable prettier/prettier */
/**
 * Tailwind 3. Semua warna dipetakan ke CSS variable di src/styles/tokens.css —
 * tidak ada nilai warna literal di berkas ini, dan komponen tidak boleh memakai
 * palet bawaan Tailwind (`bg-blue-600`, `text-gray-500`).
 *
 * `<alpha-value>` membuat modifier opacity tetap jalan: `bg-accent/10`,
 * `border-border/50`, dan seterusnya.
 */
const withAlpha = (v) => `hsl(var(${v}) / <alpha-value>)`;

module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    // Skala tipografi: lima ukuran, tidak lebih. Padat — base 13px, bukan 16px.
    fontSize: {
      xs: ['0.6875rem', { lineHeight: '1rem' }],      // 11 / 16 — eyebrow, micro
      sm: ['0.75rem', { lineHeight: '1.125rem' }],    // 12 / 18 — sekunder
      base: ['0.8125rem', { lineHeight: '1.25rem' }], // 13 / 20 — teks antarmuka
      lg: ['1rem', { lineHeight: '1.375rem' }],       // 16 / 22 — judul bagian
      xl: ['1.375rem', { lineHeight: '1.75rem' }],    // 22 / 28 — judul halaman, angka besar
    },
    // Skala spasi: kelipatan 4 sampai 24, lalu melompat. Cukup untuk UI padat.
    spacing: {
      0: '0', px: '1px',
      0.5: '0.125rem', 1: '0.25rem', 1.5: '0.375rem', 2: '0.5rem', 2.5: '0.625rem',
      3: '0.75rem', 4: '1rem', 5: '1.25rem', 6: '1.5rem', 8: '2rem', 10: '2.5rem',
      12: '3rem', 16: '4rem', 20: '5rem', 24: '6rem', 32: '8rem',
    },
    borderRadius: {
      none: '0',
      sm: 'calc(var(--radius) - 4px)',
      md: 'calc(var(--radius) - 2px)',
      lg: 'var(--radius)',
      xl: 'calc(var(--radius) + 4px)',
      full: '9999px',
    },
    boxShadow: {
      none: 'none',
      sm: 'var(--shadow-sm)',
      md: 'var(--shadow-md)',
    },
    transitionDuration: {
      DEFAULT: '160ms',
      fast: '120ms',
      slow: '200ms',
    },
    extend: {
      colors: {
        background: withAlpha('--background'),
        surface: {
          DEFAULT: withAlpha('--surface'),
          raised: withAlpha('--surface-raised'),
          sunken: withAlpha('--surface-sunken'),
        },
        border: {
          DEFAULT: withAlpha('--border'),
          subtle: withAlpha('--border-subtle'),
          strong: withAlpha('--border-strong'),
        },
        foreground: {
          DEFAULT: withAlpha('--foreground'),
          muted: withAlpha('--foreground-muted'),
          subtle: withAlpha('--foreground-subtle'),
        },
        accent: {
          DEFAULT: withAlpha('--accent'),
          foreground: withAlpha('--accent-foreground'),
          subtle: withAlpha('--accent-subtle'),
          hover: withAlpha('--accent-hover'),
        },
        success: {
          DEFAULT: withAlpha('--success'),
          foreground: withAlpha('--success-foreground'),
          subtle: withAlpha('--success-subtle'),
        },
        warning: {
          DEFAULT: withAlpha('--warning'),
          foreground: withAlpha('--warning-foreground'),
          subtle: withAlpha('--warning-subtle'),
        },
        destructive: {
          DEFAULT: withAlpha('--destructive'),
          foreground: withAlpha('--destructive-foreground'),
          subtle: withAlpha('--destructive-subtle'),
        },
        info: {
          DEFAULT: withAlpha('--info'),
          foreground: withAlpha('--info-foreground'),
          subtle: withAlpha('--info-subtle'),
        },
        ring: withAlpha('--ring'),
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
