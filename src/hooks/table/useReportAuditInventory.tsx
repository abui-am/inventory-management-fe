import React from 'react';
import { Check, X } from 'react-bootstrap-icons';

import Bubble from '@/components/Bubble';
import { Button } from '@/components/Button';
import { formatDateYYYYMMDD } from '@/utils/format';

import { useEditAudit } from '../mutation/useMutateAudit';
import { useFetchUnpaginatedAudits } from '../query/useFetchAudit';

export const useReportAuditInventory = ({ date }: { date: string }) => {
  const { data: dataRes } = useFetchUnpaginatedAudits({
    with_audits: {
      where_date: {
        created_at: date ?? formatDateYYYYMMDD(new Date()),
      },
    },
    per_page: 10000,
  });

  const getData = () => {
    return (
      dataRes?.data.items.map(({ name, unit, audits }) => ({
        name,
        unit,
        qty: <div className="flex justify-end">{0}</div>,
        auditStock: (
          <div className="flex justify-end">
            <span className="mr-2">{audits[0]?.audit_quantity}</span>
            <Bubble isValid={audits[0]?.is_valid || audits[0]?.is_approved} />
          </div>
        ),
        diffValue: <div className="flex justify-end">{0}</div>,
        action: <ButtonChecklist auditId={audits[0]?.id} auditQty={audits[0]?.audit_quantity} />,
      })) ?? []
    );
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
        {
          Header: 'Stock hasil audit',
          accessor: 'auditStock',
        },
        {
          Header: 'Nilai perbedaan',
          accessor: 'diffValue',
        },
        {
          Header: 'Aksi',
          accessor: 'action',
        },
      ];
    };

    return getColumn();
  }, []);

  return { data, columns };
};

export const ButtonChecklist = ({ auditId, auditQty }) => {
  const { mutateAsync } = useEditAudit(auditId);
  return (
    <Button
      size="small"
      className="mr-2"
      onClick={() => {
        mutateAsync({
          is_approved: true,
          audit_quantity: auditQty,
        });
      }}
    >
      <Check width={24} height={24} />
    </Button>
  );
};
