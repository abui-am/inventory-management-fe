import React from 'react';
import { Check } from 'react-bootstrap-icons';

import Bubble from '@/components/Bubble';
import { Button } from '@/components/Button';
import { formatDateYYYYMMDD } from '@/utils/format';

import { useEditAudit } from '../mutation/useMutateAudit';
import { useFetchUnpaginatedAudits } from '../query/useFetchAudit';

export const useReportAuditInventory = ({ date }: { date: string }) => {
  const { data: dataRes } = useFetchUnpaginatedAudits({
    where: {
      audit_date: date ?? formatDateYYYYMMDD(new Date()),
    },

    per_page: 10000,
  });

  const getData = () => {
    return (
      dataRes?.data.item_audits.map(({ item_id, item_name, item_unit, audit_quantity, is_valid, is_approved }) => ({
        item_name,
        item_unit,
        qty: <div className="flex justify-end">{0}</div>,
        auditStock: (
          <div className="flex justify-end">
            <span className="mr-2">{audit_quantity}</span>
            <Bubble isValid={is_valid || is_approved} />
          </div>
        ),
        diffValue: <div className="flex justify-end">{0}</div>,
        action: <ButtonChecklist auditId={item_id} auditQty={audit_quantity} />,
      })) ?? []
    );
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

  return { data, columns, dataRes };
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
