import clsx from 'clsx';
import React, { DetailedHTMLProps, InputHTMLAttributes, TextareaHTMLAttributes, useState } from 'react';
import { Calendar } from 'react-bootstrap-icons';
import DatePicker, { ReactDatePickerProps } from 'react-datepicker';
import NormalSelect, { OptionTypeBase } from 'react-select';
import Select, { Async, Props } from 'react-select/async';

import { useSearchCity, useSearchProvince, useSearchSubdistrict, useSearchVillage } from '@/hooks/mutation/useSearch';
import { useFetchAllRoles } from '@/hooks/query/useFetchRole';
import { AdditionalStyle, getThemedSelectStyle, SelectVariant } from '@/utils/style';

type ThemedSelectProps = Partial<Async<OptionTypeBase>> &
  Props<OptionTypeBase, false | true> & { variant?: SelectVariant; additionalStyle?: AdditionalStyle };

const TextField: React.FC<
  DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
    variant?: 'outlined' | 'contained';
    hasError?: boolean;
    Icon?: JSX.Element;
  }
> = ({ className, hasError, Icon, variant = 'outlined', ...props }) => {
  const variation = variant === 'outlined' ? 'border-gray-300 border' : 'bg-blueGray-100';
  const errorStyle = hasError ? 'ring-red-500 ring-inset border-transparent outline-none ring-2' : '';
  return (
    <div className="relative">
      {Icon && <div className="absolute flex items-center left-3 top-0 bottom-0 m-auto text-blueGray-400">{Icon}</div>}

      <input
        {...props}
        className={clsx(
          Icon ? 'pl-11' : '',
          errorStyle,
          variation,
          'h-11 w-full rounded-md px-3 outline-none',
          'focus:ring-blue-600 focus:ring-inset focus:border-transparent focus:outline-none focus:ring-2',
          'transition-all duration-150 ease-in',
          className
        )}
      />
    </div>
  );
};

const TextArea: React.FC<TextareaHTMLAttributes<unknown>> = ({ className, ...props }) => {
  return (
    <textarea
      {...props}
      rows={3}
      className={clsx(
        'resize-none w-full border-gray-300 border rounded-md px-3 py-2 outline-none',
        'focus:ring-blue-600 focus:ring-inset focus:border-transparent focus:outline-none focus:ring-2',
        'transition-all duration-150 ease-in',
        className
      )}
    />
  );
};

const Checkbox: React.FC<InputHTMLAttributes<unknown>> = ({ children, ...props }) => {
  const [checked, setChecked] = useState(false);
  return (
    <div className="flex relative items-center">
      <input
        onClick={() => setChecked((val) => !val)}
        type="checkbox"
        className={`mr-2 h-4 w-4 border border-gray-300 rounded-sm checked:bg-blue-600 checked:border-transparent focus:outline-none ${
          !checked ? 'appearance-none' : ''
        }`}
        {...props}
      />
      {/* <div className="bg-white border-2 rounded-md border-grey-300 h-4 w-4 flex flex-shrink-0 justify-center items-center mr-2 hover:border-blue-500" /> */}
      {children}
    </div>
  );
};

const DatePickerComponent: React.FC<ReactDatePickerProps> = ({ className, ...props }) => {
  return (
    <div className="relative customDatePickerWidth">
      <DatePicker
        {...props}
        className={clsx(
          'pl-11 border border-gray-300',
          'h-11 w-full rounded-md px-3 outline-none',
          'focus:ring-blue-600 focus:ring-inset focus:border-transparent focus:outline-none focus:ring-2',
          'transition-all duration-150 ease-in',
          className
        )}
      />
      <div className="absolute flex items-center left-3 top-0 bottom-0 m-auto text-blueGray-400">
        <Calendar />
      </div>
    </div>
  );
};

const PhoneNumberTextField: React.FC<
  Omit<DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, 'onChange'> & {
    hasError: boolean;
    onChange: (phoneNumber: string) => void;
  }
> = ({ onChange, className, hasError, value, ...props }) => {
  const errorStyle = hasError ? 'ring-red-500 ring-inset border-transparent outline-none ring-2' : '';
  return (
    <div className="flex">
      <div className="flex items-center top-0 bottom-0 m-auto text-blueGray-400 px-3 border h-11 border-r-0 border-gray-300 rounded-tl-md rounded-bl-md">
        +62
      </div>

      <input
        {...props}
        onChange={(e) => {
          if (onChange) {
            onChange(`62${e.target.value}`);
          }
        }}
        type="number"
        value={value?.toString().slice(2)}
        className={clsx(
          errorStyle,
          'h-11 w-full px-3 outline-none rounded-tr-md rounded-br-md border-gray-300 border',
          'focus:ring-blue-600 focus:ring-inset focus:border-transparent focus:outline-none focus:ring-2',
          'transition-all duration-150 ease-in',
          className
        )}
      />
    </div>
  );
};

const SelectProvince: React.FC<Partial<Async<OptionTypeBase>> & Props<OptionTypeBase, false>> = (props) => {
  const { mutateAsync } = useSearchProvince();

  return (
    <Select
      {...props}
      loadOptions={async (val) => {
        const { data } = await mutateAsync({ search: val });
        return data.provinces.data.map(({ id, name }) => ({ value: id, label: name }));
      }}
    />
  );
};

const SelectCity: React.FC<Partial<Async<OptionTypeBase>> & Props<OptionTypeBase, false> & { provinceId: string }> = (
  props
) => {
  const { mutateAsync } = useSearchCity();
  const { provinceId } = props;
  return (
    <Select
      {...props}
      isDisabled={!provinceId}
      loadOptions={async (val) => {
        const { data } = await mutateAsync({ search: val, where: { province_id: provinceId } });
        return data.cities.data.map(({ id, name }) => ({ value: id, label: name }));
      }}
    />
  );
};

const SelectSubdistrict: React.FC<Partial<Async<OptionTypeBase>> & Props<OptionTypeBase, false> & { cityId: string }> =
  (props) => {
    const { mutateAsync } = useSearchSubdistrict();
    const { cityId } = props;
    return (
      <Select
        {...props}
        isDisabled={!cityId}
        loadOptions={async (val) => {
          const { data } = await mutateAsync({ search: val, where: { city_id: cityId } });
          return data.subdistricts.data.map(({ id, name }) => ({ value: id, label: name }));
        }}
      />
    );
  };

const SelectVillage: React.FC<
  Partial<Async<OptionTypeBase>> & Props<OptionTypeBase, false> & { subdistrictId: string }
> = (props) => {
  const { mutateAsync } = useSearchVillage();
  const { subdistrictId } = props;
  return (
    <Select
      {...props}
      isDisabled={!subdistrictId}
      loadOptions={async (val) => {
        const { data } = await mutateAsync({ search: val, where: { subdistrict_id: subdistrictId } });
        return data.villages.data.map(({ id, name }) => ({ value: id, label: name }));
      }}
    />
  );
};

const SelectRole: React.FC<ThemedSelectProps> = (props) => {
  const { data } = useFetchAllRoles();
  const options = data?.data?.roles?.map(({ name }) => ({ label: name, value: name })) ?? [];
  return <ThemedSelect {...props} options={options} />;
};

const ThemedSelect: React.FC<ThemedSelectProps> = ({ variant = 'outlined', additionalStyle = {}, ...props }) => {
  return <NormalSelect isSearchable={false} styles={getThemedSelectStyle(variant, additionalStyle)} {...props} />;
};

const WithLabelAndError: React.FC<{
  label: string;
  errors: Record<string, unknown>;
  touched: Record<string, unknown>;
  name: string;
}> = ({ label, children, errors, touched, name }) => {
  return (
    <>
      <label className="mb-1 inline-block">{label}</label>
      {children}
      {errors[name] && touched[name] && <span className="text-xs text-red-500">{errors[name] as string}</span>}
    </>
  );
};

export {
  Checkbox,
  DatePickerComponent,
  PhoneNumberTextField,
  SelectCity,
  SelectProvince,
  SelectRole,
  SelectSubdistrict,
  SelectVillage,
  TextArea,
  TextField,
  ThemedSelect,
  WithLabelAndError,
};
