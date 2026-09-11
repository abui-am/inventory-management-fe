import React, { forwardRef, PropsWithChildren, Ref } from 'react';
import Select, { components, SelectInstance, SingleValueProps } from 'react-select';
import CreatableAsyncSelect from 'react-select/async-creatable';
import CreatableSelect from 'react-select/creatable';

import { useSearchSuppliers } from '@/hooks/mutation/useSearch';
import { useFetchCustomers } from '@/hooks/query/useFetchCustomer';
import { useFetchUnpaginatedEmployee } from '@/hooks/query/useFetchEmployee';
import { useFetchItems } from '@/hooks/query/useFetchItem';
import { Option } from '@/typings/common';
import { Item } from '@/typings/item';
import { formatToIDR } from '@/utils/format';
import { getThemedSelectStyle, SelectGroup, SelectOption } from '@/utils/style';

import { ThemedSelectProps, useMenuAnimation } from './Form';
import CreateCustomerForm from './form/CreateCustomerForm';
import CreateSupplierForm from './form/CreateSupplierForm';
import Modal from './Modal';

export const SelectCustomer: React.FC<PropsWithChildren<ThemedSelectProps>> = ({
  variant = 'outlined',
  additionalStyle = {},
  onChange,
  ...props
}) => {
  const [search, setSearch] = React.useState('');
  const animation = useMenuAnimation();
  const { data } = useFetchCustomers({ search });
  const [isCreating, setIsCreating] = React.useState(false);
  const [initValues, setInitValues] = React.useState({
    fullName: '',
    phoneNumber: '',
    address: '',
  });

  return (
    <>
      <CreatableSelect
        {...props}
        // Tanpa id tetap, id internal react-select berbeda antara server dan client dan
        // React 18 membuang seluruh pohon SSR. Lihat catatan di Form.tsx.
        instanceId={props.instanceId ?? props.name}
        styles={getThemedSelectStyle(variant, { ...additionalStyle, ...animation.menuAnimationStyle })}
        // `data` ikut dibawa supaya kartu piutang di /transaction/add bisa membaca
        // total_debt tanpa satu pun permintaan tambahan — angkanya memang sudah ikut
        // di respons daftar customer yang select ini ambil.
        options={data?.data.customers?.data.map((customer) => ({
          label: customer.full_name,
          value: customer.id,
          data: customer,
        }))}
        onChange={(e, act) => {
          const data = e as Option<null>;
          if (act.action === 'create-option') {
            setInitValues({ fullName: data?.label, phoneNumber: '', address: '' });
            setIsCreating(true);
          } else {
            onChange?.(e, act);
          }
        }}
        onInputChange={(val) => {
          setSearch(val);
        }}
        menuIsOpen={animation.menuIsOpen}
        onMenuOpen={animation.onMenuOpen}
        onMenuClose={animation.onMenuClose}
      />
      <Modal isOpen={isCreating} onRequestClose={() => setIsCreating(false)}>
        <CreateCustomerForm
          onClose={() => setIsCreating(false)}
          initialValues={initValues}
          onSave={(data) => {
            setIsCreating(false);
            const created = { label: data.customer.full_name, value: data.customer.id };
            onChange?.(created, { action: 'create-option', option: created });
          }}
        />
      </Modal>
    </>
  );
};

export const SelectSender: React.FC<PropsWithChildren<ThemedSelectProps>> = ({
  variant = 'outlined',
  additionalStyle = {},
  ...props
}) => {
  const { data } = useFetchUnpaginatedEmployee();
  const animation = useMenuAnimation();
  return (
    <Select
      {...props}
      menuIsOpen={animation.menuIsOpen}
      onMenuOpen={animation.onMenuOpen}
      onMenuClose={animation.onMenuClose}
      instanceId={props.instanceId ?? props.name}
      styles={getThemedSelectStyle(variant, { ...additionalStyle, ...animation.menuAnimationStyle })}
      // Template literal menempelkan "null" apa adanya ketika last_name kosong, dan
      // daftar pengirim tampil sebagai "Admin2 null". Bagian yang kosong dibuang dulu.
      options={data?.data.employees.map(({ first_name, last_name, id }) => ({
        label: [first_name, last_name].filter(Boolean).join(' ').trim(),
        value: id,
      }))}
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
          Harga jual : {formatToIDR(data?.data?.sell_price ?? 0)} | stock : {data.data?.quantity}
        </div>
      </div>
    </components.SingleValue>
  );
}

export const SelectItemsSync = forwardRef(
  (
    { withDetail = false, ...props }: PropsWithChildren<ThemedSelectProps>,
    ref: Ref<SelectInstance<SelectOption, boolean, SelectGroup>>
  ): JSX.Element => {
    const { data } = useFetchItems();
    return (
      <CreatableSelect
        {...props}
        ref={ref}
        styles={{
          valueContainer: (base) => ({
            ...base,
            height: 64,
          }),
        }}
        options={data?.data.items?.data.map(({ name, id, ...props }) => ({
          label: name,
          value: id,
          data: { name, id, ...props },
        }))}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        components={withDetail ? { SingleValue: SingleValue as any } : {}}
      />
    );
  }
);

export const SelectSupplier: React.FC<PropsWithChildren<ThemedSelectProps>> = ({
  variant = 'outlined',
  additionalStyle = {},
  onChange,
  ...props
}) => {
  const { mutateAsync: search } = useSearchSuppliers();
  const [isCreating, setIsCreating] = React.useState(false);
  const [initValues, setInitValues] = React.useState({
    name: '',
    phoneNumber: '',
    address: '',
  });
  const animation = useMenuAnimation();
  return (
    <>
      <CreatableAsyncSelect
        {...props}
        instanceId={props.instanceId ?? props.name}
        menuIsOpen={animation.menuIsOpen}
        onMenuOpen={animation.onMenuOpen}
        onMenuClose={animation.onMenuClose}
        styles={getThemedSelectStyle(variant, { ...additionalStyle, ...animation.menuAnimationStyle })}
        loadOptions={async (val) => {
          const { data } = await search({ search: val });
          return data.suppliers.data.map(({ id, name }) => ({ value: id, label: name }));
        }}
        onChange={(e, act) => {
          const data = e as Option<null>;
          if (act.action === 'create-option') {
            setInitValues({ name: data?.label, phoneNumber: '', address: '' });
            setIsCreating(true);
          } else {
            onChange?.(e, act);
          }
        }}
      />
      <Modal isOpen={isCreating} onRequestClose={() => setIsCreating(false)}>
        <CreateSupplierForm
          disableBack
          initialValues={initValues}
          onSave={(data) => {
            setIsCreating(false);
            const created = { label: data.supplier.name, value: data.supplier.id };
            onChange?.(created, { action: 'create-option', option: created });
          }}
        />
      </Modal>
    </>
  );
};
