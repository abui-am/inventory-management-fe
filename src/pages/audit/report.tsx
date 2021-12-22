import Link from 'next/link';
import React from 'react';
import { Calculator, Search } from 'react-bootstrap-icons';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { DatePickerComponent, TextField } from '@/components/Form';
import Pagination from '@/components/Pagination';
import Table from '@/components/Table';
import { useReportAuditInventory } from '@/hooks/table/useReportAuditInventory';
import { formatDateYYYYMMDD } from '@/utils/format';

const AuditPage = () => {
  const [paginationUrl, setPaginationUrl] = React.useState('');
  const [date, setDate] = React.useState(new Date());

  const { columns, data } = useReportAuditInventory({ date: formatDateYYYYMMDD(date) });
  return (
    <div>
      <section className="flex justify-between items-center mb-4    ">
        <h2 className="text-2xl font-bold">Laporan audit barang harian</h2>
        <div className="flex items-center">
          <label className="mr-2">Tanggal:</label>
          <DatePickerComponent
            onChange={(value) => {
              setDate(value as Date);
            }}
            selected={date}
          />
        </div>
      </section>

      <section>
        <CardDashboard>
          <Table
            withPagination
            search={({ setGlobalFilter }) => (
              <div className="mt-2 mb-6 flex justify-between">
                <TextField
                  Icon={<Search />}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  variant="contained"
                  placeholder="Cari nama barang"
                />
                <div className="flex">
                  {/* <Link href="/stock-in/add">
                    <a>
                      <Button className="ml-3" Icon={<Calculator className="w-4" />}>
                        Tambah
                      </Button>
                    </a>
                  </Link> */}
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
