import CreatableAsyncSelect from 'react-select/async-creatable';

import { useSearchCustomers } from '@/hooks/mutation/useSearch';
import { getThemedSelectStyle } from '@/utils/style';

import { ThemedSelectProps } from './Form';

export const SelectCustomer: React.FC<ThemedSelectProps> = ({
  variant = 'outlined',
  additionalStyle = {},
  ...props
}) => {
  const { mutateAsync: search } = useSearchCustomers();
  return (
    <CreatableAsyncSelect
      {...props}
      styles={getThemedSelectStyle(variant, additionalStyle)}
      loadOptions={async (val) => {
        const { data } = await search({ search: val });
        return data.customers.data.map(({ id, full_name }) => ({ value: id, label: full_name }));
      }}
    />
  );
};
