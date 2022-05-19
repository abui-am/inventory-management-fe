import React from 'react';

import { CardDashboard } from '@/components/Container';
import { DateRangePicker } from '@/components/Form';
import Table from '@/components/Table';
import { useGeneralLedger } from '@/hooks/table/useGeneralLedger';

const AuditPage = () => {
  const [fromDate, setFromDate] = React.useState(new Date());
  const [toDate, setToDate] = React.useState(new Date());
  const { columns, data = [] } = useGeneralLedger();
  return (
    <div>
      <section>
        <CardDashboard>
          <Table
            withPagination
            withoutStripe
            search={() => (
              <div className="mt-2 mb-4 flex justify-between">
                <h2 className="text-2xl font-bold">Jurnal Umum</h2>
                <div className="flex flex-col items-end">
                  <div className="flex flex-wrap mb-4">
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
