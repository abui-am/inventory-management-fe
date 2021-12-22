import Tippy from '@tippyjs/react';
import React from 'react';
import { Check, Pencil } from 'react-bootstrap-icons';

import Bubble from '@/components/Bubble';
import { Button } from '@/components/Button';
import { TextField } from '@/components/Form';
import { formatDateYYYYMMDD } from '@/utils/format';

import { useAudit, useEditAudit } from '../mutation/useMutateAudit';
import { useFetchUnpaginatedAudits } from '../query/useFetchAudit';

export const useAuditInventory = ({ date }) => {
  const { data: dataRes, ...props } = useFetchUnpaginatedAudits({
    where: {
      audit_date: date ?? formatDateYYYYMMDD(new Date()),
    },
    per_page: 10000,
  });

  const getData = () => {
    return dataRes?.data?.item_audits?.map(({ id, item_name, item_unit, update_count, is_valid, audit_quantity }) => ({
      item_name,
      item_unit,
      qty: (
        <TextFieldEditAudit
          forceEdit={update_count === 0}
          disableEdit={update_count > 3}
          isValid={is_valid}
          auditId={id}
          initialValue={audit_quantity}
        />
      ),
    }));
  };

  const data = getData();
  const columns = React.useMemo(() => {
    const getColumn = () => {
      return [
        {
          Header: 'Nama Barang',
          accessor: 'item_name', // accessor is the "key" in the data
        },
        {
          Header: 'Unit',
          accessor: 'item_unit',
        },
        {
          Header: 'Stock tersedia',
          accessor: 'qty',
        },
      ];
    };

    return getColumn();
  }, []);

  return { data, columns, ...props };
};

const TextFieldAudit = ({ itemId, initialValue }: { itemId: string; initialValue: number }) => {
  const { mutateAsync } = useAudit();

  const [value, setValue] = React.useState(initialValue);
  return (
    <div style={{ minHeight: 58 }} className="flex w-full items-center max-w-sm">
      <div className="max-w-none flex-1">
        <TextField
          value={value}
          onChange={(e) => {
            setValue(+e.target.value);
          }}
        />
      </div>

      <Button
        size="small"
        className="ml-2"
        onClick={() => {
          mutateAsync({ item_id: itemId, audit_quantity: value });
        }}
      >
        <Check width={24} height={24} />
      </Button>
    </div>
  );
};

const TextFieldEditAudit = ({
  auditId,
  initialValue,
  isValid,
  forceEdit,
  disableEdit,
}: {
  auditId: string;
  initialValue: number;
  isValid: boolean;
  forceEdit: boolean;
  disableEdit: boolean;
}) => {
  const { mutateAsync: editAudit } = useEditAudit(auditId);
  const [isEditing, setIsEditing] = React.useState(forceEdit);
  const [value, setValue] = React.useState(initialValue);
  const [isHover, setIsHover] = React.useState(false);
  return !isEditing ? (
    <div
      className="flex w-full items-center max-w-sm"
      style={{ minHeight: 58 }}
      onMouseEnter={() => {
        setIsHover(true);
      }}
      onMouseLeave={() => {
        setIsHover(false);
      }}
    >
      <span className="text-xl font-bold">{initialValue}</span>
      <div className="flex-1 ml-2">
        <Bubble isValid={isValid} />
      </div>
      {!isValid && !disableEdit && isHover && (
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            setIsEditing((isEdit) => !isEdit);
          }}
        >
          <Pencil width={24} height={24} />
        </Button>
      )}
    </div>
  ) : (
    <div className="flex w-full items-center max-w-sm" style={{ minHeight: 58 }}>
      <div className="max-w-none flex-1">
        <TextField
          className="max-w-none flex-1"
          value={value}
          onChange={(e) => {
            setValue(+e.target.value);
          }}
        />
      </div>

      <Button
        size="small"
        className="ml-2"
        onClick={() => {
          editAudit({ audit_quantity: value });
          setIsEditing(false);
        }}
      >
        <Check width={24} height={24} />
      </Button>
    </div>
  );
};
