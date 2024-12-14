import Tippy from '@tippyjs/react';
import React from 'react';
import { Check } from 'react-bootstrap-icons';

import Bubble from '@/components/Bubble';
import { Button } from '@/components/Button';
import { formatDateYYYYMMDD } from '@/utils/format';

import { useFetchUnpaginatedAudits } from '../query/useFetchAudit';

export type ModalConfirmationData = {
  id: string;
  user_id: string;
  update_count: number;
  audit_quantity: number;
} | null;

export const useReportAuditInventory = ({ date }: { date: string }) => {
  const { data: dataRes } = useFetchUnpaginatedAudits({
    where: {
      audit_date: date ?? formatDateYYYYMMDD(new Date()),
    },

    per_page: 10000,
  });

  const [openModalConfirmationData, setOpenModalConfirmationData] = React.useState<ModalConfirmationData>(null);

  const getData = () => {
    return (
      dataRes?.data.item_audits.map(
        ({
          id,
          user_id,
          item_name,
          item_quantity,
          item_unit,
          audit_quantity,
          is_valid,
          update_count,
          is_approved,
        }) => ({
          item_name,
          item_unit,
          qty: <div className="flex justify-end">{item_quantity}</div>,
          auditStock: (
            <div className="flex justify-end">
              <span className="mr-2">{audit_quantity}</span>
              <Bubble isValid={is_valid || is_approved} />
            </div>
          ),
          diffValue: <div className="flex justify-end">{audit_quantity - item_quantity}</div>,
          action:
            !is_valid && !is_approved ? (
              <ButtonChecklist
                onClick={() => {
                  setOpenModalConfirmationData({
                    id,
                    user_id,
                    update_count,
                    audit_quantity,
                  });
                }}
              />
            ) : null,
        })
      ) ?? []
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
          flexEnd: true,
        },
        {
          Header: 'Stock hasil audit',
          accessor: 'auditStock',
          flexEnd: true,
        },
        {
          Header: 'Nilai perbedaan',
          accessor: 'diffValue',
          flexEnd: true,
        },
        {
          Header: 'Aksi',
          accessor: 'action',
        },
      ];
    };

    return getColumn();
  }, []);

  return { data, columns, dataRes, openModalConfirmationData, setOpenModalConfirmationData };
};

export const ButtonChecklist = ({ onClick }: { onClick: () => void }) => {
  return (
    <div className="flex">
      <Tippy content="Setujui hasil audit">
        <Button
          size="small"
          className="mr-2"
          onClick={() => {
            onClick?.();
          }}
        >
          <Check width={24} height={24} />
        </Button>
      </Tippy>

      {/* <Tippy content="Reset kesempatan audit">
        <Button
          size="small"
          className="mr-2"
          onClick={() => {
            mutateAsync({
              id: auditId,
              update_count: 0,
              user_id: userId,
            });
          }}
        >
          <ArrowIcon width={24} height={24} />
        </Button>
      </Tippy> */}
    </div>
  );
};
