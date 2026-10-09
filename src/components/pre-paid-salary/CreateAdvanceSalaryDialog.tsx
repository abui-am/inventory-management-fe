import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { AlertTriangle } from 'lucide-react';
import React from 'react';
import toast from 'react-hot-toast';
import { number, object } from 'yup';

import { CurrencyTextField, DatePickerComponent, ThemedSelect } from '@/components/Form';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { DialogHeading, DialogRow } from '@/components/ui/dialog-summary';
import { Label } from '@/components/ui/label';
import { useCreateAdvancePayrolls } from '@/hooks/mutation/useMutateAdvancePayrolls';
import { useFetchUnpaginatedEmployee } from '@/hooks/query/useFetchEmployee';
import { cn } from '@/lib/cn';
import { EmployeeData } from '@/typings/employee';
import { formatDateYYYYMM, formatNumber } from '@/utils/format';
import reportError from '@/utils/reportError';
import { controlStyle } from '@/utils/style';

type Pilihan = { label: string; value: string } | null;

/**
 * Mencatat gaji yang dibayarkan sebelum tanggal gajian.
 *
 * Ringkasan gajinya ada DI DALAM dialog — gaji sebulan, yang sudah diambil untuk bulan
 * itu, dan sisanya. Dialog lama hanya menulis "Batas maksimal Rp …" dengan warna merah
 * permanen di bawah isian, jadi aturan yang belum dilanggar sudah tampil seperti error,
 * dan berapa yang sudah diambil sebelumnya tidak pernah disebut sama sekali.
 */
export function CreateAdvanceSalaryDialog({
  isOpen,
  onClose,
  onSuccess,
  /** Gaji di muka yang sudah tercatat, dijumlahkan per karyawan untuk bulan yang dipilih. */
  sudahDiambil,
  bulanAwal,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  sudahDiambil: (employeeId: string, bulan: string) => number;
  bulanAwal: Date;
}): JSX.Element {
  const { mutateAsync, isLoading } = useCreateAdvancePayrolls();
  const { data: dataKaryawan } = useFetchUnpaginatedEmployee();

  const karyawan = (dataKaryawan?.data?.employees ?? []).filter((e: EmployeeData) => e.active !== false);
  const pilihan = karyawan.map((e: EmployeeData) => ({
    label: `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim(),
    value: e.id,
  }));

  const { values, errors, touched, handleSubmit, setFieldValue, resetForm } = useFormik({
    initialValues: { employee: null as Pilihan, amount: 0, payrollMonth: bulanAwal },
    enableReinitialize: true,
    validationSchema: object().shape({
      amount: number().moreThan(0, 'Jumlahnya harus lebih dari Rp 0.').required('Jumlah wajib diisi.'),
    }),
    onSubmit: async (nilai) => {
      if (!nilai.employee) return;
      try {
        const res = await mutateAsync({
          employee_id: nilai.employee.value,
          amount: nilai.amount,
          payroll_month: formatDateYYYYMM(nilai.payrollMonth),
        });
        toast.success(res.message);
        resetForm();
        onSuccess?.();
        onClose();
      } catch (e) {
        reportError(e, { form: 'advance-payroll/create' });
      }
    },
  });

  const terpilih = karyawan.find((e: EmployeeData) => e.id === values.employee?.value);
  const gaji = +(terpilih?.salary ?? 0);
  const bulan = formatDateYYYYMM(values.payrollMonth);
  const sudah = values.employee ? sudahDiambil(values.employee.value, bulan) : 0;
  const bisa = Math.max(gaji - sudah, 0);
  const lebih = values.amount > bisa && bisa >= 0 && !!values.employee;
  const sisaSesudah = Math.max(bisa - values.amount, 0);

  const tutup = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={isLoading ? undefined : tutup} bodyClassName="p-4">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2.5">
        <DialogHeading title="Catat gaji di muka">
          Dibayarkan sekarang, lalu terpotong otomatis dari daftar gaji bulan yang dipilih.
        </DialogHeading>

        <div>
          <Label htmlFor="employee" className="mb-1.25" required>
            Karyawan
          </Label>
          <ThemedSelect
            inputId="employee"
            instanceId="employee"
            name="employee"
            isSearchable
            placeholder="Pilih karyawan"
            options={pilihan}
            value={values.employee}
            additionalStyle={controlStyle}
            onChange={(val) => setFieldValue('employee', val ?? null)}
          />
        </div>

        {/* Batasnya diperlihatkan, bukan dihafal: gaji sebulan, yang sudah diambil untuk
            bulan itu, dan sisa yang masih bisa diambil. */}
        <div className="flex flex-col gap-1.25 rounded-lg bg-surface-raised px-3.25 py-2.5">
          <DialogRow label="Gaji per bulan" value={terpilih ? formatNumber(gaji) : '—'} />
          <DialogRow
            label={`Sudah diambil untuk ${dayjs(values.payrollMonth).format('MMM YYYY')}`}
            value={terpilih ? formatNumber(sudah) : '—'}
          />
          <DialogRow label="Bisa diambil" value={terpilih ? formatNumber(bisa) : '—'} strong tone="success" />
        </div>

        <div className="grid grid-cols-1 gap-2.75 sm:grid-cols-2">
          <div>
            <Label htmlFor="amount" className="mb-1.25" required>
              Jumlah
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm text-foreground-subtle">
                Rp
              </span>
              <CurrencyTextField
                prefix=""
                id="amount"
                name="amount"
                placeholder="0"
                disabled={!terpilih}
                value={values.amount}
                onChange={(val) => setFieldValue('amount', val ?? 0)}
                className={cn(
                  'h-8 rounded-control pl-8 text-right font-mono tabular-nums',
                  (lebih || (touched.amount && errors.amount)) && 'border-destructive'
                )}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="payrollMonth" className="mb-1.25" required>
              Bulan gajian
            </Label>
            <DatePickerComponent
              size="sm"
              id="payrollMonth"
              name="payrollMonth"
              selected={values.payrollMonth}
              dateFormat="MMMM yyyy"
              showMonthYearPicker
              onChange={(date) => setFieldValue('payrollMonth', date)}
            />
          </div>
        </div>

        {/* Aturan baru muncul saat dilanggar; selebihnya yang ditampilkan akibatnya. */}
        {lebih ? (
          <span className="flex items-center gap-1.25 text-sm text-destructive" role="alert">
            <AlertTriangle size={13} strokeWidth={2} aria-hidden />
            Melebihi sisa gajinya — paling banyak{' '}
            <span className="font-mono font-semibold tabular-nums">{formatNumber(bisa)}</span>
          </span>
        ) : (
          <span className="text-xs text-foreground-subtle">
            {terpilih && values.amount > 0 ? (
              <>
                Sisa gajinya jadi{' '}
                <span className="font-mono font-semibold text-foreground">{formatNumber(sisaSesudah)}</span>, dibayar
                pada tanggal gajian.
              </>
            ) : (
              'Paling banyak sebesar gajinya sebulan, dikurangi yang sudah diambil untuk bulan itu.'
            )}
          </span>
        )}

        {/* Akibat yang tidak pernah disebut layar lama: uangnya keluar HARI INI. */}
        <div className="flex items-start gap-2 rounded-group bg-warning-subtle px-2.75 py-2.25 text-sm leading-[1.45] text-warning">
          <AlertTriangle size={13} strokeWidth={1.9} aria-hidden className="mt-px shrink-0" />
          <span>
            Kas berkurang <span className="font-mono font-semibold">{formatNumber(values.amount || 0)}</span> dan Beban
            bertambah sebesar itu juga — hari ini, bukan saat gajian.
          </span>
        </div>

        <div className="mt-1 flex justify-end gap-1.75">
          <Button size="sm" variant="outline" onClick={tutup} disabled={isLoading}>
            Batal
          </Button>
          <Button size="sm" type="submit" loading={isLoading} disabled={!terpilih || lebih}>
            Catat gaji di muka
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateAdvanceSalaryDialog;
