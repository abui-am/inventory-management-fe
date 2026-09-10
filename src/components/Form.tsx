import clsx from 'clsx';
import { id as localeId } from 'date-fns/locale';
import React, { forwardRef, PropsWithChildren, Ref, useEffect, useMemo, useState } from 'react';
import { Calendar, SortAlphaDownAlt, SortDown } from 'react-bootstrap-icons';
import DatePicker, { ReactDatePickerProps, registerLocale, setDefaultLocale } from 'react-datepicker';
import NumberFormat, { NumberFormatProps, NumberFormatValues } from 'react-number-format';
import NormalSelect, { components, SelectInstance, SingleValueProps, ValueContainerProps } from 'react-select';
import Select, { AsyncProps } from 'react-select/async';
import CreatableAsyncSelect from 'react-select/async-creatable';

import { inputClass } from '@/components/ui/input';
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
import useMounted from '@/hooks/useMounted';
import { cn } from '@/lib/cn';
import { Item, ItemData } from '@/typings/item';
import debounce from '@/utils/debounce';
import { formatToIDR } from '@/utils/format';
import { AdditionalStyle, getThemedSelectStyle, SelectGroup, SelectOption, SelectVariant } from '@/utils/style';

import { Checkbox, PhoneNumberTextField, TextArea, TextField, WithLabelAndError } from './TextField';

const ValueContainerSortBy: React.FC<PropsWithChildren<ValueContainerProps<SelectOption, boolean, SelectGroup>>> = ({
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

const ValueContainer: React.FC<PropsWithChildren<ValueContainerProps<SelectOption, boolean, SelectGroup>>> = ({
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

export type ThemedSelectProps = Partial<AsyncProps<SelectOption, boolean, SelectGroup>> & {
  variant?: SelectVariant;
  additionalStyle?: AdditionalStyle;
  disableMargin?: boolean;
  withDetail?: boolean;
};

// react-datepicker memakai date-fns, bukan dayjs — jadi `dayjs.locale('id')` di _app tidak
// menyentuhnya dan kalender menampilkan "Su Mo Tu" serta "September" dalam bahasa Inggris
// di antarmuka yang seluruhnya berbahasa Indonesia. date-fns sudah ikut sebagai dependensi
// react-datepicker, jadi ini tidak menambah paket.
registerLocale('id', localeId);
setDefaultLocale('id');

// Di luar DatePickerComponent: react-datepicker merender ini sebagai komponen, jadi kalau
// didefinisikan di dalam render ia punya identitas baru tiap render dan input waktu di-remount —
// fokus dan posisi kursor hilang saat user sedang mengetik jam.
// (Sebelumnya bernama ExampleCustomTimeInput dengan `border: solid 1px pink`, salinan mentah
// dari contoh di dokumentasi react-datepicker.)
const CustomTimeInput = ({ value, onChange }: { value: string; onChange: (e: string) => void }) => (
  <input value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
);

const DatePickerComponent: React.FC<PropsWithChildren<ReactDatePickerProps>> = ({
  className,
  showTimeSelect,
  selected,
  ...props
}) => {
  // Tanggal baru ditampilkan setelah mount. Halaman-halaman ini dibangkitkan jadi HTML
  // statis saat build, jadi merender `selected` di server akan membekukan tanggal build
  // ke dalam HTML — dan sejak React 18 ketidakcocokan teks itu membuat seluruh pohon SSR
  // dibuang lalu di-render ulang di client. Struktur DOM-nya tidak berubah, hanya nilainya,
  // sehingga hidrasinya bersih.
  const mounted = useMounted();

  return (
    <div className="relative customDatePickerWidth">
      <DatePicker
        selected={mounted ? selected : null}
        dateFormat={showTimeSelect ? 'dd/MM/yyy HH:mm:ss' : 'dd/MM/yyyy'}
        popperClassName="!z-10"
        className={cn(inputClass, 'pl-8', className)}
        customTimeInput={<CustomTimeInput value="" onChange={() => undefined} />}
        showTimeSelect={showTimeSelect}
        {...props}
      />
      <div className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-foreground-subtle">
        <Calendar size={16} aria-hidden />
      </div>
    </div>
  );
};

const DateRangePicker: React.FC<
  PropsWithChildren<{
    values: [Date, Date];
    onChangeFrom: (date: Date) => void;
    onChangeTo: (date: Date) => void;
    showTimeSelect?: boolean;
  }>
> = ({ values, onChangeFrom, onChangeTo, showTimeSelect }) => {
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

const SelectProvince: React.FC<PropsWithChildren<ThemedSelectProps>> = (props) => {
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

const SelectCity: React.FC<PropsWithChildren<ThemedSelectProps & { provinceId: string }>> = (props) => {
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

const SelectSubdistrict: React.FC<PropsWithChildren<ThemedSelectProps & { cityId: string }>> = (props) => {
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

const SelectVillage: React.FC<PropsWithChildren<ThemedSelectProps & { subdistrictId: string }>> = (props) => {
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

const SelectRole: React.FC<PropsWithChildren<ThemedSelectProps>> = (props) => {
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

const SelectItems: React.FC<PropsWithChildren<ThemedSelectProps>> = ({
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
    ref: Ref<SelectInstance<SelectOption, boolean, SelectGroup>>
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

const ThemedSelect: React.FC<PropsWithChildren<ThemedSelectProps>> = ({
  variant = 'outlined',
  additionalStyle = {},
  styles,
  ...props
}) => {
  const [portal, setPortal] = useState<HTMLElement>();

  useEffect(() => {
    setPortal(document?.body);
  }, []);

  // `styles` sengaja DIKELUARKAN dari sebaran props.
  //
  // Sebelumnya `{...props}` disebar setelah `styles=`, jadi begitu pemanggil mengirim
  // `styles` — walau hanya untuk satu bagian seperti `control` — seluruh tema
  // react-select terbuang dan select kembali ke warna bawaannya yang biru. Itu juga
  // membuang `menuPortal` zIndex di bawah, sehingga menu tertimpa elemen lain.
  // Sekarang ketiganya digabung, tema tetap jadi dasarnya.
  const merged = {
    menuPortal: (base: Record<string, unknown>) => ({ ...base, zIndex: 9999 }),
    ...getThemedSelectStyle(variant, additionalStyle),
    ...(styles ?? {}),
  } as ThemedSelectProps['styles'];

  return (
    <NormalSelect
      menuShouldScrollIntoView
      menuPortalTarget={portal}
      isSearchable={false}
      styles={merged}
      // react-select merender input-nya sendiri di dalam container, jadi label harus
      // menunjuk ke `inputId` — bukan `id`, yang hanya memberi id ke div pembungkus.
      inputId={props.inputId ?? props.name}
      {...props}
    />
  );
};

const SelectSortBy: React.FC<PropsWithChildren<ThemedSelectProps>> = ({ disableMargin, ...props }) => {
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

const SelectSortType: React.FC<PropsWithChildren<ThemedSelectProps>> = (props) => {
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
const CurrencyTextField: React.FC<PropsWithChildren<CurrencyTextFieldProps>> = ({
  prefix = 'IDR',
  placeholder = '',
  thousandSeparator = '.',
  decimalSeparator = ',',
  isNumericString = true,
  errorStyle,
  onChange,
  className,
  ...props
}) => {
  const customOnChange = (e: NumberFormatValues) => {
    onChange(e.floatValue);
  };

  const field = (
    <NumberFormat
      // errorStyle bertipe objek gaya di tipe lamanya, tapi setiap pemanggil mengirim
      // string kelas. Tidak diubah tipenya di sini supaya pemanggil lain tidak ikut pecah.
      className={cn(inputClass, prefix && 'rounded-l-none', errorStyle as unknown as string, className)}
      placeholder={placeholder}
      isNumericString={isNumericString}
      thousandSeparator={thousandSeparator}
      decimalSeparator={decimalSeparator}
      onValueChange={customOnChange}
      id={props.id ?? props.name}
      {...props}
    />
  );

  // `prefix` kosong berarti tanpa kotak awalan sama sekali — dipakai di tempat sempit
  // seperti rel ringkasan POS, di mana label di sebelah kiri sudah menyatakan satuannya.
  if (!prefix) return field;

  return (
    <div className="flex">
      <span className="inline-flex h-9 items-center rounded-l-md border border-r-0 border-border-strong bg-surface-raised px-2.5 text-base text-foreground-muted">
        {prefix}
      </span>
      {field}
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
