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

/** Tinggi lama 36px — masih dipakai halaman yang belum dipindahkan ke design system. */
const LEGACY_CONTROL_HEIGHT = 36;

const base: Partial<StylesConfig<SelectOption, boolean, SelectGroup>> = {
  control: (provided, state) => ({
    ...provided,
    // Kotaknya bisa diklik untuk membuka menu, jadi kursornya harus mengatakan begitu.
    // Bawaan react-select `default` membuatnya terlihat seperti teks mati.
    cursor: 'pointer',
    minHeight: LEGACY_CONTROL_HEIGHT,
    height: LEGACY_CONTROL_HEIGHT,
    backgroundColor: t('--surface'),
    borderColor: state.isFocused ? t('--accent') : t('--border-strong'),
    boxShadow: state.isFocused ? `0 0 0 2px ${t('--ring', 0.25)}` : 'none',
    borderRadius: 6,
    transition: 'border-color 120ms, box-shadow 120ms',
    '&:hover': { borderColor: state.isFocused ? t('--accent') : t('--border-strong') },
  }),
  valueContainer: (provided) => ({ ...provided, padding: '0 8px', cursor: 'pointer' }),
  // 13px dinyatakan tegas di ketiganya. Kalau diwariskan, teks di dalam select ikut
  // apa pun yang kebetulan berlaku di tempat ia berdiri — dan placeholder jadi lebih
  // besar dari label di atasnya.
  input: (provided) => ({
    ...provided,
    color: t('--foreground'),
    margin: 0,
    padding: 0,
    fontSize: 13,
    cursor: 'pointer',
  }),
  singleValue: (provided) => ({ ...provided, color: t('--foreground'), fontSize: 13 }),
  placeholder: (provided) => ({ ...provided, color: t('--foreground-subtle'), fontSize: 13 }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (provided) => ({
    ...provided,
    cursor: 'pointer',
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
    // 13px, sama dengan `text-base`. Menu diportal keluar dari <main class="font-sans">,
    // jadi ukurannya dinyatakan di sini — kalau diwariskan ia jatuh ke 14px milik <body>.
    fontSize: 13,
    backgroundColor: t('--surface'),
    border: `1px solid ${t('--border')}`,
    borderRadius: 8,
    boxShadow: 'var(--shadow-md)',
    overflow: 'hidden',
    zIndex: 20,
  }),
  menuList: (provided) => ({ ...provided, padding: 4 }),
  // Berpasangan dengan `menuPortalTarget`: menu yang dirender di tempat akan terpotong
  // begitu select berdiri di dalam elemen ber-overflow — sel tabel, kartu `overflow-hidden`,
  // wadah `overflow-x-auto`. Di /transaction/add menunya hilang seluruhnya karena itu.
  menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
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

/**
 * Gabung dua peta style react-select tanpa membuang salah satunya.
 *
 * Keduanya DIRANTAI, bukan di-spread berdampingan. Tiap fungsi style react-select
 * ditulis sebagai `(base) => ({ ...base, ...perubahan })`, jadi `{ ...fa(p), ...fb(p) }`
 * membuat `...base` milik fb — yang isinya bawaan react-select yang belum bertema —
 * menimpa balik seluruh hasil fa. Satu `additionalStyle` sesederhana
 * `control: (base) => ({ ...base, height: 28 })` sudah cukup untuk mengembalikan select
 * ke putih-biru bawaannya, dan itulah yang terjadi pada baris entri di /transaction/add.
 *
 * Dengan dirantai, `base` yang diterima fb adalah hasil fa yang sudah bertema.
 *
 * KONSEKUENSINYA untuk pemanggil: tiap fungsi di `additionalStyle` HARUS menyebar
 * argumennya — `(base) => ({ ...base, ... })`. Fungsi yang mengabaikan argumen dan
 * mengembalikan objek telanjang kini membuang seluruh tema, bukan cuma menimpanya.
 */
const merge = (
  a: Partial<StylesConfig<SelectOption, boolean, SelectGroup>>,
  b: Partial<StylesConfig<SelectOption, boolean, SelectGroup>>
): Partial<StylesConfig<SelectOption, boolean, SelectGroup>> => {
  const out: Record<string, unknown> = { ...a };
  Object.keys(b).forEach((key) => {
    const fa = (a as Record<string, ((p: unknown, s: unknown) => object) | undefined>)[key];
    const fb = (b as Record<string, ((p: unknown, s: unknown) => object) | undefined>)[key];
    out[key] = fa && fb ? (provided: unknown, state: unknown) => fb(fa(provided, state), state) : fb ?? fa;
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

/**
 * SATU tinggi kontrol untuk halaman yang sudah dipindahkan ke design system: 32px,
 * sejajar dengan `Input size="sm"` dan `Button size="sm"`.
 *
 * Sebelum ini /transaction/add memakai lima tinggi berbeda dalam satu layar — 24px
 * untuk pill metode, 26px untuk diskon, 28px untuk baris tabel, 32px untuk tanggal,
 * 36px untuk select bawaan. Tiap angka masuk akal sendiri-sendiri, tapi bersama-sama
 * tidak ada satu garis pun yang sejajar.
 *
 * Dipakai lewat konstanta ini, bukan diketik ulang per komponen. Lihat aturan di CLAUDE.md.
 */
export const CONTROL_HEIGHT = 32;

/** Gaya react-select untuk kontrol setinggi `CONTROL_HEIGHT`. */
export const controlStyle: AdditionalStyle = {
  control: (base) => ({ ...base, minHeight: CONTROL_HEIGHT, height: CONTROL_HEIGHT, borderRadius: 7 }),
  valueContainer: (base) => ({ ...base, padding: '0 0 0 10px' }),
  // 100%, BUKAN CONTROL_HEIGHT.
  //
  // Control-nya `border-box` setinggi 32px dengan garis 1px, jadi kotak isinya 30px.
  // Memberi wadah indikator tinggi 32px membuatnya melebihi baris flex sebesar 2px dan
  // menyeret seluruh baris — termasuk nilai yang terpilih — turun 2px dari tengah.
  // Terukur: 7.25px di atas vs 5.25px di bawah; dengan 100% keduanya jadi 6.25px.
  indicatorsContainer: (base) => ({ ...base, height: '100%' }),
  dropdownIndicator: (base) => ({ ...base, padding: 5 }),
};
