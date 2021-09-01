import { GroupTypeBase, OptionTypeBase, Styles } from 'react-select';

export type SelectVariant = 'contained' | 'outlined';

export const getThemedSelectStyle = (
  variant: SelectVariant
): Partial<Styles<OptionTypeBase, false, GroupTypeBase<OptionTypeBase>>> | undefined => {
  switch (variant) {
    case 'outlined':
      return {
        control: (provided) => ({
          ...provided,
          height: 44,
        }),
      };
    case 'contained':
      return {
        control: (provided) => ({
          ...provided,
          height: 44,
          background: '#F1F5F9',
          width: 122,
          border: 0,
          padding: '2px 16px',
        }),
        valueContainer: (provided) => ({ ...provided, padding: '2px 0px' }),
        placeholder: (provided) => ({
          ...provided,
          color: '#1E293B',
        }),
        dropdownIndicator: (provided) => ({
          ...provided,
          color: '#3F3F46',
          '&:hover': {
            color: '#0F172A',
          },
        }),
        indicatorSeparator: () => {
          return {};
        },
      };
    default:
      return {};
  }
};
