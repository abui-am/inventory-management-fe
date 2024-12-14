import { useFormik } from 'formik';
import React, { Dispatch, SetStateAction } from 'react';
import { Search } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { DatePickerComponent, TextField, WithLabelAndError } from '@/components/Form';
import { validationSchemaConfirmationAudit } from '@/components/form/constant';
import Modal from '@/components/Modal';
import Table from '@/components/Table';
import { useEditAudit } from '@/hooks/mutation/useMutateAudit';
import { ModalConfirmationData, useReportAuditInventory } from '@/hooks/table/useReportAuditInventory';
import { AuditsData, CreateItemsAuditResponse } from '@/typings/audit';
import { formatDateYYYYMMDD } from '@/utils/format';

const AuditPage = () => {
  const [date, setDate] = React.useState(new Date());

  const { columns, data, openModalConfirmationData, setOpenModalConfirmationData } = useReportAuditInventory({
    date: formatDateYYYYMMDD(date),
  });
  return (
    <div>
      <ModalConfirmationAudit
        openModalConfirmationData={openModalConfirmationData}
        setOpenModalConfirmationData={setOpenModalConfirmationData}
      />
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

const ModalConfirmationAudit = ({
  openModalConfirmationData,
  setOpenModalConfirmationData,
}: {
  openModalConfirmationData: ModalConfirmationData;
  setOpenModalConfirmationData: Dispatch<SetStateAction<ModalConfirmationData>>;
}) => {
  return (
    <Modal isOpen={!!openModalConfirmationData} onRequestClose={() => setOpenModalConfirmationData(null)}>
      <ConfirmationAuditForm
        onClose={() => setOpenModalConfirmationData(null)}
        openModalConfirmationData={openModalConfirmationData}
        onSave={() => {
          setOpenModalConfirmationData(null);
        }}
      />
    </Modal>
  );
};

const ConfirmationAuditForm: React.FC<{
  openModalConfirmationData: ModalConfirmationData;
  onSave: (data: CreateItemsAuditResponse) => void;
  onClose: () => void;
}> = ({ openModalConfirmationData, onSave, onClose }) => {
  const { mutateAsync, isLoading: isLoadingMutate } = useEditAudit(openModalConfirmationData?.id ?? '');
  const initialValues = {
    auditQty: openModalConfirmationData?.audit_quantity ?? 0,
  };
  const { values, handleChange, setSubmitting, handleSubmit, errors, touched } = useFormik({
    validationSchema: validationSchemaConfirmationAudit,
    initialValues,
    onSubmit: async (values, { resetForm }) => {
      setSubmitting(true);
      const jsonBody: Partial<AuditsData> = {
        id: openModalConfirmationData?.id,
        update_count: openModalConfirmationData?.update_count,
        is_approved: true,
        audit_quantity: values.auditQty,
        is_valid: true,
        user_id: openModalConfirmationData?.user_id,
      };
      const res = await mutateAsync(jsonBody);
      setSubmitting(false);
      resetForm();
      onSave?.(res.data);
      toast(res.message);
    },
  });

  return (
    <form onSubmit={handleSubmit} noValidate>
      <section className="max-w-4xl mr-auto ml-auto">
        <div className="mb-4">
          <h6 className="mb-3 text-lg font-bold">Konfirmasi Audit</h6>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <WithLabelAndError touched={touched} errors={errors} name="fullName" label="Jumlah Audit Sebenarnya">
                <TextField
                  placeholder="Masukan jumlah audit"
                  value={values.auditQty}
                  name="auditQty"
                  onChange={handleChange}
                />
              </WithLabelAndError>
            </div>
          </div>
        </div>
      </section>
      <div className="mt-8 flex justify-end">
        <div className="flex">
          <Button onClick={onClose} variant="secondary" className="mr-4">
            Batalkan
          </Button>
          <Button disabled={isLoadingMutate} type="submit">
            Simpan Audit
          </Button>
        </div>
      </div>
    </form>
  );
};

export default AuditPage;
