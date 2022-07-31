import React, { forwardRef, LegacyRef, PropsWithChildren } from 'react';
import Select, { components, OptionTypeBase, SingleValueProps } from 'react-select';
import CreatableAsyncSelect from 'react-select/async-creatable';
import CreatableSelect from 'react-select/creatable';

import { useSearchSuppliers } from '@/hooks/mutation/useSearch';
import { useFetchCustomers } from '@/hooks/query/useFetchCustomer';
import { useFetchUnpaginatedEmployee } from '@/hooks/query/useFetchEmployee';
import { useFetchItems } from '@/hooks/query/useFetchItem';
import { Option } from '@/typings/common';
import { Item } from '@/typings/item';
import { formatToIDR } from '@/utils/format';
import { getThemedSelectStyle } from '@/utils/style';

import { ThemedSelectProps } from './Form';
import CreateCustomerForm from './form/CreateCustomerForm';
import CreateSupplierForm from './form/CreateSupplierForm';
import Modal from './Modal';

export const SelectCustomer: React.FC<ThemedSelectProps> = ({
  variant = 'outlined',
  additionalStyle = {},
  onChange,
  ...props
}) => {
  const { data } = useFetchCustomers();
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
        styles={getThemedSelectStyle(variant, additionalStyle)}
        options={data?.data.customers?.data.map(({ full_name, id }) => ({ label: full_name, value: id }))}
        onChange={(e, act) => {
          const data = e as Option<null>;
          if (act.action === 'create-option') {
            setInitValues({ fullName: data?.label, phoneNumber: '', address: '' });
            setIsCreating(true);
          } else {
            onChange?.(e, act);
          }
        }}
      />
      <Modal isOpen={isCreating} onRequestClose={() => setIsCreating(false)}>
        <CreateCustomerForm
          initialValues={initValues}
          onSave={(data) => {
            setIsCreating(false);
            onChange?.({ label: data.customer.full_name, value: data.customer.id }, { action: 'create-option' });
          }}
        />
      </Modal>
    </>
  );
};

export const SelectSender: React.FC<ThemedSelectProps> = ({ variant = 'outlined', additionalStyle = {}, ...props }) => {
  const { data } = useFetchUnpaginatedEmployee();
  return (
    <Select
      {...props}
      styles={getThemedSelectStyle(variant, additionalStyle)}
      options={data?.data.employees.map(({ first_name, last_name, id }) => ({
        label: `${first_name} ${last_name}`,
        value: id,
      }))}
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
          Harga jual : {formatToIDR(data?.data?.sell_price ?? 0)} | stock : {data.data?.quantity}
        </div>
      </div>
    </components.SingleValue>
  );
};

export const SelectItemsSync = forwardRef(
  (
    { withDetail = false, ...props }: PropsWithChildren<ThemedSelectProps>,
    ref: LegacyRef<CreatableSelect<OptionTypeBase, boolean>>
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

export const SelectSupplier: React.FC<ThemedSelectProps> = ({
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
  return (
    <>
      <CreatableAsyncSelect
        {...props}
        styles={getThemedSelectStyle(variant, additionalStyle)}
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
            onChange?.({ label: data.supplier.name, value: data.supplier.id }, { action: 'create-option' });
          }}
        />
      </Modal>
    </>
  );
};
