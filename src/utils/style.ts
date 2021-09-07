import { GroupTypeBase, OptionTypeBase, Styles } from 'react-select';

export type SelectVariant = 'contained' | 'outlined';
export type AdditionalStyle = Partial<Styles<OptionTypeBase, false, GroupTypeBase<OptionTypeBase>>>;

export const getThemedSelectStyle = (
  variant: SelectVariant,
  additionalStyle: AdditionalStyle = {}
): Partial<Styles<OptionTypeBase, false, GroupTypeBase<OptionTypeBase>>> | undefined => {
  switch (variant) {
    case 'outlined':
      return {
        control: (provided, ctrl) => ({
          ...provided,
          height: 44,
          ...(additionalStyle?.control?.(provided, ctrl) ?? {}),
        }),
      };
    case 'contained':
      return {
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
