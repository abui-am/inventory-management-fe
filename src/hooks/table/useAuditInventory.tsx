import Tippy from '@tippyjs/react';
import React from 'react';
import { Check, Pencil, ThreeDots, ThreeDotsVertical } from 'react-bootstrap-icons';

import Bubble from '@/components/Bubble';
import { Button } from '@/components/Button';
import { TextField } from '@/components/Form';
import Modal from '@/components/Modal';
import { formatDate, formatDateYYYYMMDD } from '@/utils/format';

import { useAudit, useEditAudit } from '../mutation/useMutateAudit';
import { useFetchAudits, useFetchUnpaginatedAudits } from '../query/useFetchAudit';

export const useAuditInventory = ({ date }) => {
  const { data: dataRes, ...props } = useFetchUnpaginatedAudits({
    with_audits: {
      where_date: {
        created_at: date ?? formatDateYYYYMMDD(new Date()),
      },
    },
    per_page: 10000,
  });

  const getData = () => {
    return dataRes?.data?.items?.map(({ id, name, unit, audits }) => ({
      name,
      unit,
      qty:
        audits.length > 0 ? (
          <TextFieldEditAudit
            disableEdit={audits[0].update_count > 3}
            isValid={audits[0].is_valid}
            auditId={audits[0].id}
            initialValue={audits[0].audit_quantity}
          />
        ) : (
          <TextFieldAudit itemId={id} initialValue={audits[0]?.audit_quantity} />
        ),
    }));
  };

  const data = getData();
  const columns = React.useMemo(() => {
    const getColumn = () => {
      return [
        {
          Header: 'Nama Barang',
          accessor: 'name', // accessor is the "key" in the data
        },
        {
          Header: 'Unit',
          accessor: 'unit',
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
  disableEdit,
}: {
  auditId: string;
  initialValue: number;
  isValid: boolean;
  disableEdit: boolean;
}) => {
  const { mutateAsync: editAudit } = useEditAudit(auditId);
  const [isEditing, setIsEditing] = React.useState(false);
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
