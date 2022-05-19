import React from 'react';

import { CardDashboard } from '@/components/Container';
import { DateRangePicker, ThemedSelect } from '@/components/Form';
import Table from '@/components/Table';
import { useLedger } from '@/hooks/table/useLedger';
import { formatToIDR } from '@/utils/format';

const typeOptions = [
  {
    label: 'Kas',
    value: 'kas',
  },
];

const AuditPage = () => {
  const [fromDate, setFromDate] = React.useState(new Date());
  const [toDate, setToDate] = React.useState(new Date());
  const { columns, data = [] } = useLedger();
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
                  <span className="text-xl font-bold">Saldo : {formatToIDR(1000000)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex flex-wrap mb-4 gap-4">
                    <ThemedSelect defaultValue={typeOptions[0]} options={typeOptions} className="w-52" />
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
