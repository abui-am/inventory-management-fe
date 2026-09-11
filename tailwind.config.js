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
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    // Tremor mengirim kelas Tailwind di dalam berkas terkompilasinya. Tanpa baris ini
    // kelas-kelas itu tidak pernah ter-generate dan charnya tampil tanpa gaya.
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx,mjs}',
  ],
  theme: {
    // CATATAN PENTING: semua di bawah ini ada di `extend`, BUKAN mengganti `theme`.
    // Menuliskannya langsung di `theme` akan MENGHAPUS skala bawaan Tailwind, dan
    // aplikasi ini masih memakai banyak di antaranya (`text-2xl` 39x, `h-11` 12x,
    // `w-48` 12x, palet `blueGray` 52x). Skala di bawah adalah arah design system;
    // halaman lama tetap jalan sampai dipindahkan di Fase 4.
    extend: {
      // Lima ukuran design system. Kunci xs–xl sengaja ditimpa; 2xl ke atas tetap
      // memakai bawaan Tailwind supaya halaman yang belum dipindahkan tidak rusak.
      fontSize: {
        // Ukuran ke-6, punya peran sendiri: teks uppercase ber-tracking — header kolom
        // tabel, eyebrow, angka di tab. Memaksanya ke xs (11px) membuat header kolom
        // setara teks sekunder dan hierarkinya hilang.
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }], // 10 / 14 — header kolom, eyebrow
        xs: ['0.6875rem', { lineHeight: '1rem' }],      // 11 / 16 — eyebrow, micro
        sm: ['0.75rem', { lineHeight: '1.125rem' }],    // 12 / 18 — sekunder
        base: ['0.8125rem', { lineHeight: '1.25rem' }], // 13 / 20 — teks antarmuka
        lg: ['1rem', { lineHeight: '1.375rem' }],       // 16 / 22 — judul bagian
        xl: ['1.375rem', { lineHeight: '1.75rem' }],    // 22 / 28 — judul halaman, angka

        // Dirujuk Tremor; disamakan dengan skala di atas supaya chart tidak memakai
        // ukuran huruf sendiri yang lebih besar dari sisa aplikasi.
        'tremor-label': ['0.6875rem', { lineHeight: '1rem' }],
        'tremor-default': ['0.8125rem', { lineHeight: '1.25rem' }],
        'tremor-title': ['1rem', { lineHeight: '1.375rem' }],
        'tremor-metric': ['1.375rem', { lineHeight: '1.75rem' }],
      },
      // Desain memakai langkah ganjil yang tidak ada di skala 4px bawaan. Ditambahkan
      // sebagai langkah bernama (n x 4px, konvensi Tailwind sendiri) supaya nilainya
      // persis desain tanpa `[7px]` bertebaran di markup.
      spacing: {
        0.75: '3px',
        1.25: '5px',
        1.75: '7px',
        2.25: '9px',
        2.75: '11px',
        3.25: '13px',
        3.75: '15px',
        4.5: '18px',
      },
      borderRadius: {
        // Desain punya hierarki radius bersarang sendiri: pill < kontrol < grup < kartu.
        // Dinamai menurut perannya, bukan angkanya, supaya tidak bersaing dengan
        // skala sm/md/lg/xl yang diturunkan dari --radius.
        pill: '5px',
        control: '7px',
        group: '9px',
        card: '10px',
        'tremor-small': 'calc(var(--radius) - 4px)',
        'tremor-default': 'calc(var(--radius) - 2px)',
        'tremor-full': '9999px',
        sm: 'calc(var(--radius) - 4px)',
        md: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) + 4px)',
      },
      boxShadow: {
        'tremor-input': 'var(--shadow-sm)',
        'tremor-card': 'var(--shadow-sm)',
        'tremor-dropdown': 'var(--shadow-md)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
      },
      // Tailwind tidak menyediakan varian `aria-invalid` bawaan — daftar bawaannya
      // hanya busy/checked/disabled/expanded/hidden/pressed/readonly/required/selected.
      // Tanpa baris ini `aria-invalid:border-destructive` diam-diam tidak pernah jadi CSS.
      aria: {
        invalid: 'invalid="true"',
      },
      transitionDuration: {
        DEFAULT: '160ms',
        fast: '120ms',
        slow: '200ms',
      },
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

        // Dipakai sebagai latar scrim di belakang dialog. Nilainya berbeda per tema:
        // hitam 40% di atas ground yang sudah gelap nyaris tak terlihat.
        scrim: withAlpha('--scrim'),


        // Tremor merangkai gayanya dari skala warnanya sendiri: `fill-tremor-content`,
        // `stroke-tremor-border`, dan pasangan `dark:*-dark-tremor-*`. Skala itu tidak
        // pernah ada di config ini, jadi kelas-kelas tersebut tidak menghasilkan CSS
        // satu baris pun — label sumbu dan garis grid jatuh ke warna bawaan browser dan
        // tetap gelap di mode gelap.
        //
        // `tremor` dan `dark-tremor` sengaja dipetakan ke token yang SAMA. Token kita
        // sudah bertukar nilai lewat `.dark`, jadi tidak peduli varian mana yang menang —
        // keduanya selalu menghasilkan warna yang benar untuk tema yang sedang aktif.
        tremor: {
          brand: {
            faint: withAlpha('--accent-subtle'),
            muted: withAlpha('--accent-subtle'),
            subtle: withAlpha('--accent'),
            DEFAULT: withAlpha('--accent'),
            emphasis: withAlpha('--accent-hover'),
            inverted: withAlpha('--accent-foreground'),
          },
          background: {
            muted: withAlpha('--surface-sunken'),
            subtle: withAlpha('--surface-raised'),
            DEFAULT: withAlpha('--surface'),
            emphasis: withAlpha('--foreground'),
          },
          border: { DEFAULT: withAlpha('--border') },
          ring: { DEFAULT: withAlpha('--ring') },
          content: {
            subtle: withAlpha('--foreground-subtle'),
            DEFAULT: withAlpha('--foreground-muted'),
            emphasis: withAlpha('--foreground'),
            strong: withAlpha('--foreground'),
            inverted: withAlpha('--background'),
          },
        },

        'dark-tremor': {
          brand: {
            faint: withAlpha('--accent-subtle'),
            muted: withAlpha('--accent-subtle'),
            subtle: withAlpha('--accent'),
            DEFAULT: withAlpha('--accent'),
            emphasis: withAlpha('--accent-hover'),
            inverted: withAlpha('--accent-foreground'),
          },
          background: {
            muted: withAlpha('--surface-sunken'),
            subtle: withAlpha('--surface-raised'),
            DEFAULT: withAlpha('--surface'),
            emphasis: withAlpha('--foreground'),
          },
          border: { DEFAULT: withAlpha('--border') },
          ring: { DEFAULT: withAlpha('--ring') },
          content: {
            subtle: withAlpha('--foreground-subtle'),
            DEFAULT: withAlpha('--foreground-muted'),
            emphasis: withAlpha('--foreground'),
            strong: withAlpha('--foreground'),
            inverted: withAlpha('--background'),
          },
        },

        // Palet lama. Masih dipakai 52x di halaman yang belum dipindahkan ke token;
        // dihapus setelah Fase 4 selesai.
        blueGray: {
          50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1',
          400: '#94A3B8', 500: '#64748B', 600: '#475569', 800: '#1E293B', 900: '#0F172A',
        },
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
  // Tremor merangkai nama kelas warnanya saat runtime (bg-indigo-500, stroke-cyan-500,
  // fill-…), jadi pemindai Tailwind tidak pernah melihatnya di sumber. Tanpa safelist
  // chart tampil abu-abu. Dibatasi pada dua warna yang benar-benar dipakai.
  safelist: [
    {
      pattern: /^(bg|text|border|ring|stroke|fill)-(indigo|cyan)-(50|100|200|300|400|500|600|700|800|900)$/,
      variants: ['hover', 'ui-selected'],
    },
    {
      pattern: /^(bg|text|border|ring|stroke|fill)-(gray|slate)-(50|100|200|300|400|500|600|700|800|900)$/,
    },
  ],
  plugins: [require('tailwindcss-animate')],
};
