/* eslint-disable prettier/prettier */
module.exports = {
  mode: 'jit',
  purge: ['./src/pages/**/*.{js,ts,jsx,tsx}', './src/components/**/*.{js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    fontFamily: {
      sans: ['Noto sans'],
    },
    extend: {
      colors: {
        blueGray: {
          50: '#F8FAFC',
          600: '#475569',
          900: '#0F172A',
        },
      },
    },
  },
  variants: {
    extend: {
      backgroundColor: ['checked'],
      borderColor: ['checked'],
    },
  },
  plugins: [],
};
