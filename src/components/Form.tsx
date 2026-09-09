import clsx from 'clsx';
import React, { forwardRef, LegacyRef, PropsWithChildren, useEffect, useMemo, useState } from 'react';
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
import debounce from '@/utils/debounce';
import { formatToIDR } from '@/utils/format';
import { AdditionalStyle, getThemedSelectStyle, SelectVariant } from '@/utils/style';

import { Checkbox, PhoneNumberTextField, TextArea, TextField, WithLabelAndError } from './TextField';

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

// Di luar DatePickerComponent: react-datepicker merender ini sebagai komponen, jadi kalau
// didefinisikan di dalam render ia punya identitas baru tiap render dan input waktu di-remount —
// fokus dan posisi kursor hilang saat user sedang mengetik jam.
// (Sebelumnya bernama ExampleCustomTimeInput dengan `border: solid 1px pink`, salinan mentah
// dari contoh di dokumentasi react-datepicker.)
const CustomTimeInput = ({ value, onChange }: { value: string; onChange: (e: string) => void }) => (
  <input
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="h-9 w-full rounded-md border border-gray-300 px-2 outline-none focus:ring-2 focus:ring-blue-600"
  />
);

const DatePickerComponent: React.FC<ReactDatePickerProps> = ({ className, showTimeSelect, ...props }) => {
  return (
    <div className="relative customDatePickerWidth">
      <DatePicker
        dateFormat={showTimeSelect ? 'dd/MM/yyy HH:mm:ss' : 'dd/MM/yyyy'}
        popperClassName="!z-10"
        className={clsx(
          'pl-11 border border-gray-300',
          'h-11 w-full rounded-md px-3 outline-none',
          'focus:ring-blue-600 focus:ring-inset focus:border-transparent focus:outline-none focus:ring-2',
          'transition-all duration-150 ease-in',
          className
        )}
        customTimeInput={<CustomTimeInput value="" onChange={() => undefined} />}
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

const SelectProvince: React.FC<Partial<Async<OptionTypeBase>> & Props<OptionTypeBase, false>> = (props) => {
  const { mutateAsync } = useSearchProvince();

  return (
    <Select
      {...props}
      loadOptions={async (val) => {
        const { data } = await mutateAsync({ search: val });
        return data.provinces.data.map(({ id, name }) => ({ value: id, label: name }));
      }}
      isClearable
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
        return data.cities.data.map(({ id, name, type }) => ({ value: id, label: `${type} ${name}` }));
      }}
      isClearable
    />
  );
};

const SelectSubdistrict: React.FC<
  Partial<Async<OptionTypeBase>> & Props<OptionTypeBase, false> & { cityId: string }
> = (props) => {
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
      isClearable
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
      isClearable
    />
  );
};

const SelectRole: React.FC<ThemedSelectProps> = (props) => {
  const { data } = useFetchAllRoles();
  const options = data?.data?.roles?.map(({ name }) => ({ label: name, value: name })) ?? [];
  return <ThemedSelect {...props} options={options} />;
};

// Satu bentuk option barang dipakai SelectItems dan SelectItemsDetail. Sebelumnya fungsi ini
// disalin di dalam masing-masing komponen, jadi ikut dibuat ulang tiap render.
const formatItemsToOption = (items: ItemData[] = []) =>
  items?.map(({ name, id, item_id, ...rest }) => ({
    label: `${name} (ID: ${item_id ?? '-'})`,
    value: id,
    data: { name, id, item_id, ...rest },
  })) ?? [];

const SelectItems: React.FC<Partial<Async<OptionTypeBase>> & Props<OptionTypeBase, false>> = ({
  variant = 'outlined',
  additionalStyle,
  ...props
}) => {
  const { mutateAsync: search } = useSearchItems();
  // Tanpa filter quantity: select ini hanya dipakai di halaman Barang Masuk, dan barang yang
  // stoknya habis justru yang paling perlu bisa dipilih untuk direstock. Filter
  // `where_greater_equal: { quantity: 1 }` menyembunyikannya dan memaksa operator membuat
  // barang duplikat. (SelectItemsDetail — dipakai untuk penjualan — tetap memfilter.)
  const { data } = useFetchItems();

  // debounce() menyimpan timer-nya di closure. Kalau dipanggil langsung di dalam render,
  // tiap re-render menghasilkan closure baru dengan timer baru, sehingga clearTimeout tidak
  // pernah membatalkan timer render sebelumnya dan request tidak benar-benar ter-debounce.
  const loadOptions = useMemo(
    () =>
      debounce(async (val: string) => {
        if (!val) return [];
        const { data: searchData } = await search({ search: val });
        return formatItemsToOption(searchData?.items?.data ?? []);
      }, 300),
    [search]
  );

  return (
    <CreatableAsyncSelect
      {...props}
      styles={getThemedSelectStyle(variant, additionalStyle)}
      defaultOptions={formatItemsToOption(data?.data.items.data ?? [])}
      loadOptions={loadOptions}
      isClearable
    />
  );
};

function SingleValue(props: SingleValueProps<{ label: string; value: string; data: Item }>) {
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
}

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

    const defaultOptions = formatItemsToOption(data?.data.items.data ?? []);

    // Sama seperti di SelectItems: debounce harus dibuat sekali, bukan tiap render.
    const loadOptions = useMemo(
      () =>
        debounce(async (val: string) => {
          const { data: searchData } = await search({
            search: val,
            where_greater_equal: {
              quantity: 1,
            },
          });

          return formatItemsToOption(searchData?.items?.data ?? []);
        }, 300),
      [search]
    );

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
        loadOptions={loadOptions}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        components={withDetail ? { SingleValue: SingleValue as any } : {}}
        isClearable
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
      // react-select merender input-nya sendiri di dalam container, jadi label harus
      // menunjuk ke `inputId` — bukan `id`, yang hanya memberi id ke div pembungkus.
      inputId={props.inputId ?? props.name}
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
        id={props.id ?? props.name}
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
        id={props.id ?? props.name}
        {...props}
      />
    </div>
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
