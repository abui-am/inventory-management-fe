import React, { useState } from 'react';

import { CardDashboard } from '@/components/Container';
import { DateRangePicker, ThemedSelect } from '@/components/Form';
import Table from '@/components/Table';
import { useFetchLedgerAccounts } from '@/hooks/query/useFetchLedgerAccount';
import { useLedger } from '@/hooks/table/useLedger';
import { Option } from '@/typings/common';
import { formatToIDR } from '@/utils/format';

// const typeOptions = [
//   {
//     label: 'Kas',
//     value: 'kas',
//   },
// ];

const AuditPage = () => {
  const [fromDate, setFromDate] = React.useState(new Date());
  const [toDate, setToDate] = React.useState(new Date());
  const { data: dataResLedger } = useFetchLedgerAccounts();

  const [type, setType] = useState<Option | null>();
  const typeOptions =
    dataResLedger?.data?.ledger_accounts?.data.map?.(({ name, id, ...props }) => ({
      label: name,
      value: id,
      data: props,
    })) ?? [];
  const { columns, data = [] } = useLedger({
    where: {
      description: type?.label ?? '',
    },
  });

  return (
    <div>
      <section>
        <CardDashboard>
          <Table
            withPagination
            withoutStripe
            search={() => (
              <div className="mt-2 mb-4 flex justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Buku Besar</h2>
                  <span className="text-xl font-bold">Saldo : {formatToIDR(type?.data?.balance ?? 0)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex flex-wrap mb-4 gap-4">
                    {typeOptions?.length > 1 && (
                      <ThemedSelect
                        onChange={(val: any) => {
                          setType(val);
                        }}
                        defaultValue={typeOptions[0]}
                        options={typeOptions}
                        className="w-52"
                      />
                    )}

                    <DateRangePicker
                      values={[fromDate, toDate]}
                      onChangeFrom={(date) => {
                        setFromDate(date);
                      }}
                      onChangeTo={(date) => {
                        setToDate(date);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            columns={columns}
            data={data}
          />
        </CardDashboard>
      </section>
    </div>
  );
};

export default AuditPage;
