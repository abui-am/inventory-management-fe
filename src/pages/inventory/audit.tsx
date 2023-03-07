import React from 'react';
import { Search } from 'react-bootstrap-icons';

import { Button, ButtonWithModal } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { DatePickerComponent, TextField } from '@/components/Form';
import { ModalActionWrapper } from '@/components/Modal';
import Table from '@/components/Table';
import { useAudit } from '@/hooks/mutation/useMutateAudit';
import { useAuditInventory } from '@/hooks/table/useAuditInventory';
import { formatDateYYYYMMDD } from '@/utils/format';

const AuditPage = () => {
  const [date, setDate] = React.useState(new Date());

  const { columns, data = [] } = useAuditInventory({ date: formatDateYYYYMMDD(date as Date) });
  return (
    <div>
      <section className="flex justify-between items-center mb-4    ">
        <h2 className="text-2xl font-bold">Audit barang harian</h2>
        <div className="flex items-center">
          <label className="mr-2">Tanggal:</label>
          <DatePickerComponent
            onChange={(value) => {
              setDate(value as any);
            }}
            selected={date}
          />
        </div>
      </section>

      <section>
        <CardDashboard>
          {data.length === 0 ? (
            <CreateNewAudit date={date} />
          ) : (
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
          )}
        </CardDashboard>
      </section>
    </div>
  );
};

const CreateNewAudit = ({ date }: { date: Date }) => {
  const { mutateAsync, isLoading } = useAudit();

  const handleClick = () => {
    mutateAsync({
      audit_date: formatDateYYYYMMDD(date),
    });
  };
  return (
    <section className="h-96 flex items-center flex-col justify-center">
      <h3 className="text-xl block mb-4">Anda belum membuat audit untuk {formatDateYYYYMMDD(date)}</h3>

      <ButtonWithModal text="Buat Audit">
        {({ handleClose }) => {
          return (
            <>
              <h2 className="text-xl font-bold mb-4">Konfirmasi</h2>
              <p>Pastikan barang tidak ada yang masuk lagi untuk hari ini.</p>
              <p>Semua barang yang ada di sistem akan tercatat sebagai barang yang harus dilaporkan.</p>
              <ModalActionWrapper>
                <Button variant="secondary" onClick={handleClose} className="mr-2">
                  Batalkan
                </Button>
                <Button disabled={isLoading} onClick={handleClick}>
                  Buat Audit
                </Button>
              </ModalActionWrapper>
            </>
          );
        }}
      </ButtonWithModal>
    </section>
  );
};

export default AuditPage;
