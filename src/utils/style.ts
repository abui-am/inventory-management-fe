import { GroupBase, StylesConfig } from 'react-select';

/**
 * react-select v5 menghapus `OptionTypeBase`; bentuk option kini jadi parameter
 * generik. Alias ini menjaga kelonggaran yang sama seperti v4 supaya migrasi ini
 * murni soal tipe dan tidak mengubah perilaku satu pun select.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SelectOption = Record<string, any>;
export type SelectGroup = GroupBase<SelectOption>;

export type SelectVariant = 'contained' | 'outlined';
export type AdditionalStyle = Partial<StylesConfig<SelectOption, boolean, SelectGroup>>;

/**
 * react-select memasang gayanya sebagai style inline lewat emotion, jadi kelas Tailwind
 * tidak bisa dipakai di sini. Yang dipakai justru CSS variable-nya langsung —
 * `hsl(var(--surface))` diselesaikan browser terhadap variabel yang berlaku di elemen itu,
 * sehingga select ikut berganti saat tema berganti tanpa kode tema apa pun di komponen.
 *
 * Token disimpan sebagai triplet HSL tanpa pembungkus `hsl()` (supaya modifier alpha
 * Tailwind jalan), jadi di sini pembungkusnya ditulis manual.
 */
const t = (name: string, alpha?: number) => (alpha == null ? `hsl(var(${name}))` : `hsl(var(${name}) / ${alpha})`);

const CONTROL_HEIGHT = 36; // sejajar dengan Input dan Button `default`

const base: Partial<StylesConfig<SelectOption, boolean, SelectGroup>> = {
  control: (provided, state) => ({
    ...provided,
    minHeight: CONTROL_HEIGHT,
    height: CONTROL_HEIGHT,
    backgroundColor: t('--surface'),
    borderColor: state.isFocused ? t('--accent') : t('--border-strong'),
    boxShadow: state.isFocused ? `0 0 0 2px ${t('--ring', 0.25)}` : 'none',
    borderRadius: 6,
    transition: 'border-color 120ms, box-shadow 120ms',
    '&:hover': { borderColor: state.isFocused ? t('--accent') : t('--border-strong') },
  }),
  valueContainer: (provided) => ({ ...provided, padding: '0 8px' }),
  input: (provided) => ({ ...provided, color: t('--foreground'), margin: 0, padding: 0 }),
  singleValue: (provided) => ({ ...provided, color: t('--foreground') }),
  placeholder: (provided) => ({ ...provided, color: t('--foreground-subtle') }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: t('--foreground-subtle'),
    padding: 6,
    '&:hover': { color: t('--foreground') },
  }),
  clearIndicator: (provided) => ({
    ...provided,
    color: t('--foreground-subtle'),
    padding: 6,
    '&:hover': { color: t('--destructive') },
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: t('--surface'),
    border: `1px solid ${t('--border')}`,
    borderRadius: 8,
    boxShadow: 'var(--shadow-md)',
    overflow: 'hidden',
    zIndex: 20,
  }),
  menuList: (provided) => ({ ...provided, padding: 4 }),
  // isSelected diperiksa lebih dulu: option terpilih yang sedang di-hover harus tetap
  // terbaca sebagai terpilih, bukan berubah jadi warna hover.
  option: (provided, state) => {
    let backgroundColor = 'transparent';
    if (state.isSelected) {
      backgroundColor = t('--accent');
    } else if (state.isFocused) {
      backgroundColor = t('--surface-raised');
    }
    return {
      ...provided,
      backgroundColor,
      borderRadius: 4,
      cursor: 'pointer',
      padding: '6px 8px',
      color: state.isSelected ? t('--accent-foreground') : t('--foreground'),
      '&:active': { backgroundColor: state.isSelected ? t('--accent') : t('--surface-sunken') },
    };
  },
  noOptionsMessage: (provided) => ({ ...provided, color: t('--foreground-subtle') }),
  loadingMessage: (provided) => ({ ...provided, color: t('--foreground-subtle') }),
  multiValue: (provided) => ({ ...provided, backgroundColor: t('--accent-subtle'), borderRadius: 4 }),
  multiValueLabel: (provided) => ({ ...provided, color: t('--accent') }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: t('--accent'),
    '&:hover': { backgroundColor: t('--destructive-subtle'), color: t('--destructive') },
  }),
  groupHeading: (provided) => ({
    ...provided,
    color: t('--foreground-subtle'),
    fontSize: 11,
    letterSpacing: '0.07em',
  }),
};

/** Gabung dua peta style react-select tanpa membuang salah satunya. */
const merge = (
  a: Partial<StylesConfig<SelectOption, boolean, SelectGroup>>,
  b: Partial<StylesConfig<SelectOption, boolean, SelectGroup>>
): Partial<StylesConfig<SelectOption, boolean, SelectGroup>> => {
  const out: Record<string, unknown> = { ...a };
  Object.keys(b).forEach((key) => {
    const fa = (a as Record<string, ((p: unknown, s: unknown) => object) | undefined>)[key];
    const fb = (b as Record<string, ((p: unknown, s: unknown) => object) | undefined>)[key];
    out[key] =
      fa && fb ? (provided: unknown, state: unknown) => ({ ...fa(provided, state), ...fb(provided, state) }) : fb ?? fa;
  });
  return out as Partial<StylesConfig<SelectOption, boolean, SelectGroup>>;
};

export const getThemedSelectStyle = (
  variant: SelectVariant,
  additionalStyle: AdditionalStyle = {}
): Partial<StylesConfig<SelectOption, boolean, SelectGroup>> | undefined => {
  const variantStyle: Partial<StylesConfig<SelectOption, boolean, SelectGroup>> =
    variant === 'contained'
      ? {
          control: (provided, state) => ({
            ...provided,
            backgroundColor: t('--surface-raised'),
            borderColor: state.isFocused ? t('--accent') : 'transparent',
          }),
          placeholder: (provided) => ({ ...provided, color: t('--foreground-muted') }),
        }
      : {};

  return merge(merge(base, variantStyle), additionalStyle);
};
