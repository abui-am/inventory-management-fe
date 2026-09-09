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

export const getThemedSelectStyle = (
  variant: SelectVariant,
  additionalStyle: AdditionalStyle = {}
): Partial<StylesConfig<SelectOption, boolean, SelectGroup>> | undefined => {
  switch (variant) {
    case 'outlined':
      return {
        ...additionalStyle,
        indicatorSeparator: () => ({}),
        control: (provided, ctrl) => ({
          ...provided,
          height: 44,
          ...(additionalStyle?.control?.(provided, ctrl) ?? {}),
        }),
        valueContainer: (provided, ctrl) => ({
          ...provided,
          ...(additionalStyle?.valueContainer?.(provided, ctrl) ?? {}),
        }),
      };
    case 'contained':
      return {
        ...additionalStyle,
        control: (provided, ctrl) => ({
          ...provided,
          height: 44,
          background: '#F1F5F9',
          width: '100%',
          border: 0,
          padding: '2px 16px',
          ...(additionalStyle?.control?.(provided, ctrl) ?? {}),
        }),
        valueContainer: (provided, ctrl) => ({
          ...provided,
          padding: '2px 0px',
          ...(additionalStyle?.valueContainer?.(provided, ctrl) ?? {}),
        }),
        placeholder: (provided, ctrl) => ({
          ...provided,
          color: '#1E293B',
          ...(additionalStyle?.placeholder?.(provided, ctrl) ?? {}),
        }),
        dropdownIndicator: (provided, ctrl) => ({
          ...provided,
          color: '#3F3F46',
          '&:hover': {
            color: '#0F172A',
          },
          ...(additionalStyle?.dropdownIndicator?.(provided, ctrl) ?? {}),
        }),
        indicatorSeparator: (provided, ctrl) => {
          return { ...(additionalStyle?.indicatorSeparator?.(provided, ctrl) ?? {}) };
        },
      };
    default:
      return {};
  }
};
