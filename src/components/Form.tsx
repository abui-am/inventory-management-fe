import clsx from 'clsx';
import React, {
  DetailedHTMLProps,
  forwardRef,
  InputHTMLAttributes,
  LegacyRef,
  PropsWithChildren,
  TextareaHTMLAttributes,
  useEffect,
  useState,
} from 'react';
import { Calendar, SortAlphaDownAlt, SortDown } from 'react-bootstrap-icons';
import DatePicker, { ReactDatePickerProps } from 'react-datepicker';
import NumberFormat, { NumberFormatProps, NumberFormatValues } from 'react-number-format';
import NormalSelect, { CommonProps, components, GroupTypeBase, OptionTypeBase, SingleValueProps } from 'react-select';
import Select, { Async, Props } from 'react-select/async';
import CreatableAsyncSelect from 'react-select/async-creatable';

import { SORT_TYPE_OPTIONS } from '@/constants/options';
import {
  useSearchCity,
  useSearchItems,
  useSearchProvince,
  useSearchSubdistrict,
  useSearchVillage,
} from '@/hooks/mutation/useSearch';
import { useFetchItems } from '@/hooks/query/useFetchItem';
import { useFetchAllRoles } from '@/hooks/query/useFetchRole';
import { Item, ItemData } from '@/typings/item';
import debounce from '@/utils/decounce';
import { formatToIDR } from '@/utils/format';
import { AdditionalStyle, getThemedSelectStyle, SelectVariant } from '@/utils/style';

import Label from './Label';

const ValueContainerSortBy: React.FC<CommonProps<OptionTypeBase, boolean, GroupTypeBase<OptionTypeBase>>> = ({
  children,
  ...props
}) => {
  return (
    components.ValueContainer && (
      <components.ValueContainer {...props}>
        {!!children && <SortAlphaDownAlt className="absolute left-3 opacity-80" />}
        {children}
      </components.ValueContainer>
    )
  );
};

const ValueContainer: React.FC<CommonProps<OptionTypeBase, boolean, GroupTypeBase<OptionTypeBase>>> = ({
  children,
  ...props
}) => {
  return (
    components.ValueContainer && (
      <components.ValueContainer {...props}>
        {!!children && <SortDown className="absolute left-3 opacity-80" />}
        {children}
      </components.ValueContainer>
    )
  );
};

export type ThemedSelectProps = Partial<Async<OptionTypeBase>> &
  Props<OptionTypeBase, false | true> & {
    variant?: SelectVariant;
    additionalStyle?: AdditionalStyle;
    disableMargin?: boolean;
  };

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
    <div className="relative h-11">
      {Icon && (
        <div className="absolute h-4 flex items-center left-3 top-0 bottom-0 m-auto text-blueGray-400">{Icon}</div>
      )}

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
    <div className="flex relative items-center text-sm">
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

const DatePickerComponent: React.FC<ReactDatePickerProps> = ({ className, showTimeSelect, ...props }) => {
  const ExampleCustomTimeInput = ({ value, onChange }: { value: string; onChange: (e: string) => void }) => (
    <input value={value} onChange={(e) => onChange(e.target.value)} style={{ border: 'solid 1px pink' }} />
  );
  return (
    <div className="relative customDatePickerWidth">
      <DatePicker
        dateFormat={showTimeSelect ? 'dd/MM/yyy HH:mm:ss' : 'dd/MM/yyyy'}
        className={clsx(
          'pl-11 border border-gray-300',
          'h-11 w-full rounded-md px-3 outline-none',
          'focus:ring-blue-600 focus:ring-inset focus:border-transparent focus:outline-none focus:ring-2',
          'transition-all duration-150 ease-in',
          className
        )}
        customTimeInput={ExampleCustomTimeInput}
        showTimeSelect={showTimeSelect}
        {...props}
      />
      <div className="absolute flex items-center left-3 top-0 bottom-0 m-auto text-blueGray-400">
        <Calendar />
      </div>
    </div>
  );
};

const DateRangePicker: React.FC<{
  values: [Date, Date];
  onChangeFrom: (date: Date) => void;
  onChangeTo: (date: Date) => void;
  showTimeSelect?: boolean;
}> = ({ values, onChangeFrom, onChangeTo, showTimeSelect }) => {
  return (
    <div className="flex">
      <DatePickerComponent
        selected={values[0]}
        onChange={(date: Date) => {
          onChangeFrom(date);
        }}
        timeIntervals={showTimeSelect ? 1 : undefined}
        showTimeSelect={showTimeSelect}
      />
      <span className="ml-2 mr-2 h-full flex items-center">-</span>
      <DatePickerComponent
        onChange={(date: Date) => {
          onChangeTo(date);
        }}
        selected={values[1]}
        showTimeSelect={showTimeSelect}
      />
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

const SelectItems: React.FC<Partial<Async<OptionTypeBase>> & Props<OptionTypeBase, false>> = ({
  variant = 'outlined',
  additionalStyle,
  ...props
}) => {
  const { mutateAsync: search } = useSearchItems();
  return (
    <CreatableAsyncSelect
      {...props}
      styles={getThemedSelectStyle(variant, additionalStyle)}
      loadOptions={debounce(async (val) => {
        if (val) {
          const { data } = await search({ search: val });
          return data.items.data.map(({ id, item_id, name, ...rest }) => ({
            value: id,
            label: `${name} (ID:${item_id ?? '-'})`,
            data: { item_id, ...rest },
          }));
        }

        return [];
      }, 300)}
    />
  );
};

const SingleValue = (props: SingleValueProps<{ label: string; value: string; data: Item }>) => {
  const { data, children } = props;

  return (
    <components.SingleValue {...props}>
      <div>
        <div className="font-bold">{children}</div>
        {/* <div style={{ fontSize: 10, color: 'rgba(0, 0, 0, 0.6)' }}>{`${nip} | Gol ${golongan} | ${jabatan}`}</div> */}
        <div>
          Harga jual : {formatToIDR(data?.data?.sell_price ?? 0)} | stock : {data.data?.quantity} | id :
          {data?.data?.item_id ?? '-'}
        </div>
      </div>
    </components.SingleValue>
  );
};

export const SelectItemsDetail = forwardRef(
  (
    { withDetail = false, ...props }: PropsWithChildren<ThemedSelectProps>,
    ref: LegacyRef<Select<OptionTypeBase, boolean>>
  ): JSX.Element => {
    const { mutateAsync: search } = useSearchItems();
    const { data } = useFetchItems({
      where_greater_equal: {
        quantity: 1,
      },
    });

    const formatItemsToOption = (items: ItemData[]) => {
      return items?.map(({ name, id, item_id, ...props }) => ({
        label: `${name} (ID: ${item_id ?? '-'})`,
        value: id,
        data: { name, id, item_id, ...props },
      }));
    };
    const defaultOptions = formatItemsToOption(data?.data.items.data ?? []);

    return (
      <Select
        {...props}
        defaultOptions={defaultOptions}
        ref={ref}
        styles={{
          valueContainer: (base) => ({
            ...base,
            height: 64,
          }),
        }}
        loadOptions={debounce(async (val) => {
          const { data } = await search({
            search: val,
            where_greater_equal: {
              quantity: 1,
            },
          });

          return formatItemsToOption(data?.items?.data);
          // return data.items.data.map(({ id, name, ...rest }) => ({ value: id, label: name, data: rest }));
        }, 300)}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        components={withDetail ? { SingleValue: SingleValue as any } : {}}
      />
    );
  }
);

const ThemedSelect: React.FC<ThemedSelectProps> = ({ variant = 'outlined', additionalStyle = {}, ...props }) => {
  const [portal, setPortal] = useState<HTMLElement>();
  const extraProps = {
    styles: { menuPortal: (base: any) => ({ ...base, zIndex: 9999 }) },
    menuShouldScrollIntoView: true,
    menuPortalTarget: portal,
  };

  useEffect(() => {
    setPortal(document?.body);
  }, []);

  return (
    <NormalSelect
      {...extraProps}
      isSearchable={false}
      styles={getThemedSelectStyle(variant, additionalStyle)}
      {...props}
    />
  );
};

const SelectSortBy: React.FC<ThemedSelectProps> = ({ disableMargin, ...props }) => {
  const styles = {
    valueContainer: (base: Record<string, unknown>) => ({
      ...base,
      paddingLeft: 32,
    }),
  };

  return (
    <ThemedSelect
      variant="outlined"
      additionalStyle={styles}
      components={{ ValueContainer }}
      className={clsx('w-full sm:w-72', !disableMargin && 'sm:mr-4 mb-4')}
      {...props}
    />
  );
};

const SelectSortType: React.FC<ThemedSelectProps> = (props) => {
  const styles = {
    valueContainer: (base: Record<string, unknown>) => ({
      ...base,
      paddingLeft: 32,
    }),
  };
  return (
    <ThemedSelect
      variant="outlined"
      additionalStyle={styles}
      components={{ ValueContainer: ValueContainerSortBy }}
      className="w-full sm:w-48 sm:mr-4 mb-4"
      options={SORT_TYPE_OPTIONS}
      {...props}
    />
  );
};

type CurrencyTextFieldProps = Omit<NumberFormatProps, 'onChange'> & {
  prefix?: string;
  errorStyle?: Record<string, any>;
  onChange: (val: number | undefined) => void;
};
const CurrencyTextField: React.FC<CurrencyTextFieldProps> = ({
  prefix = 'IDR',
  placeholder = '',
  thousandSeparator = '.',
  decimalSeparator = ',',
  isNumericString = true,
  errorStyle,
  onChange,
  ...props
}) => {
  const customOnChange = (e: NumberFormatValues) => {
    onChange(e.floatValue);
  };
  if (!prefix) {
    return (
      <NumberFormat
        className={clsx(
          errorStyle,
          'h-11 w-full px-3 outline-none rounded-md border-gray-300 border',
          'focus:ring-blue-600 focus:ring-inset focus:border-transparent focus:outline-none focus:ring-2',
          'transition-all duration-150 ease-in'
        )}
        placeholder={placeholder}
        isNumericString={isNumericString}
        thousandSeparator={thousandSeparator}
        decimalSeparator={decimalSeparator}
        onValueChange={customOnChange}
        {...props}
      />
    );
  }

  return (
    <div className="flex">
      <div className="flex items-center top-0 bottom-0 m-auto text-blueGray-400 px-3 border h-11 border-r-0 border-gray-300 rounded-tl-md rounded-bl-md">
        {prefix}
      </div>
      <NumberFormat
        className={clsx(
          errorStyle,
          'h-11 w-full px-3 outline-none rounded-tr-md rounded-br-md border-gray-300 border',
          'focus:ring-blue-600 focus:ring-inset focus:border-transparent focus:outline-none focus:ring-2',
          'transition-all duration-150 ease-in'
        )}
        onValueChange={customOnChange}
        placeholder={placeholder}
        isNumericString={isNumericString}
        thousandSeparator={thousandSeparator}
        decimalSeparator={decimalSeparator}
        {...props}
      />
    </div>
  );
};

const WithLabelAndError: React.FC<{
  label: string;
  errors: Record<string, unknown>;
  touched: Record<string, unknown>;
  name: string;
  required?: boolean;
}> = ({ label, children, errors, touched, name, required }) => {
  return (
    <>
      <Label required={required}>{label}</Label>
      {children}
      {errors[name] && touched[name] && <span className="text-xs text-red-500">{errors[name] as string}</span>}
    </>
  );
};

export {
  Checkbox,
  CurrencyTextField,
  DatePickerComponent,
  DateRangePicker,
  PhoneNumberTextField,
  SelectCity,
  SelectItems,
  SelectProvince,
  SelectRole,
  SelectSortBy,
  SelectSortType,
  SelectSubdistrict,
  SelectVillage,
  TextArea,
  TextField,
  ThemedSelect,
  WithLabelAndError,
};
