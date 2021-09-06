import { Option } from 'react-select/src/filters';

const getOptionByValue = (options: Omit<Option, 'data'>[], value: unknown): Omit<Option, 'data'> => {
  return options.filter((val) => val.value === value)[0];
};

const createOption = (label: string, value: string): Omit<Option, 'data'> => {
  return {
    label,
    value,
  };
};

export { createOption, getOptionByValue };
