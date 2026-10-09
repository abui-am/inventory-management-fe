import { useFormik } from 'formik';
import React from 'react';
import toast from 'react-hot-toast';
import { number, object, string } from 'yup';

import { CurrencyTextField, DatePickerComponent, TextArea } from '@/components/Form';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { DialogDivider, DialogHeading, DialogRow } from '@/components/ui/dialog-summary';
import { Label } from '@/components/ui/label';
import { Segmented } from '@/components/ui/segmented';
import { useCreatePrive } from '@/hooks/mutation/useMutatePrives';
import { useFetchUnpaginatedLedgerAccounts } from '@/hooks/query/useFetchLedgerAccount';
import { cn } from '@/lib/cn';
import { formatDateYYYYMMDD, formatNumber } from '@/utils/format';
import reportError from '@/utils/reportError';

type Metode = 'cash' | 'bank';

const AKUN: Record<Metode, string> = { cash: 'Kas', bank: 'Bank' };

/**
 * Mencatat prive — uang toko yang diambil pemilik.
 *
 * Jurnalnya diperlihatkan sebelum disimpan karena inilah SATU-SATUNYA layar di aplikasi
 * yang mendebit Modal (`CreateLedgerJob::setPriveLedger`): prive mengurangi hak pemilik,
 * bukan laba. Halaman Beban bentuknya mirip tapi artinya berbeda, dan tanpa pratinjau ini
 * keduanya gampang tertukar.
 */
export function CreatePriveDialog({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}): JSX.Element {
  const { mutateAsync, isLoading } = useCreatePrive();
  const { data: dataAkun } = useFetchUnpaginatedLedgerAccounts();

  const saldoAkun = (nama: string) => dataAkun?.data?.ledger_accounts?.find((akun) => akun.name === nama)?.balance ?? 0;

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, resetForm } = useFormik({
    initialValues: { amount: 0, priveDate: new Date(), method: 'cash' as Metode, description: '' },
    validationSchema: object().shape({
      amount: number().moreThan(0, 'Jumlahnya harus lebih dari Rp 0.').required('Jumlah wajib diisi.'),
      description: string().trim().required('Keterangan wajib diisi.'),
    }),
    onSubmit: async (nilai) => {
      try {
        const res = await mutateAsync({
          description: nilai.description,
          amount: nilai.amount,
          prive_date: formatDateYYYYMMDD(nilai.priveDate),
          transaction_method: nilai.method,
        });
        toast.success(res.message);
        resetForm();
        onSuccess?.();
        onClose();
      } catch (e) {
        reportError(e, { form: 'prive/create' });
      }
    },
  });

  const tutup = () => {
    resetForm();
    onClose();
  };

  const saldo = saldoAkun(AKUN[values.method]);
  const sesudah = saldo - (values.amount || 0);
  const salah = (nama: keyof typeof values) => (touched[nama] && errors[nama] ? (errors[nama] as string) : undefined);

  return (
    <Modal isOpen={isOpen} onRequestClose={isLoading ? undefined : tutup} bodyClassName="p-4">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2.5">
        <DialogHeading title="Catat prive">
          Uang toko yang diambil pemilik. Modal berkurang sebesar ini, dan {AKUN[values.method].toLowerCase()} ikut
          berkurang hari ini juga.
        </DialogHeading>

        <div className="grid grid-cols-1 gap-2.75 sm:grid-cols-2">
          <div>
            <Label htmlFor="priveDate" className="mb-1.25" required>
              Tanggal
            </Label>
            <DatePickerComponent
              size="sm"
              id="priveDate"
              name="priveDate"
              selected={values.priveDate}
              maxDate={new Date()}
              onChange={(date) => setFieldValue('priveDate', date)}
            />
          </div>
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
                value={values.amount}
                onChange={(val) => setFieldValue('amount', val ?? 0)}
                className={cn(
                  'h-8 rounded-control pl-8 text-right font-mono tabular-nums',
                  salah('amount') && 'border-destructive'
                )}
              />
            </div>
            {salah('amount') && <p className="mt-1.25 text-xs text-destructive">{salah('amount')}</p>}
          </div>
        </div>

        <div>
          <Label className="mb-1.25" required>
            Dibayar melalui
          </Label>
          <Segmented
            className="self-start"
            aria-label="Dibayar melalui"
            options={[
              { value: 'cash', label: 'Kas', tone: 'success' },
              { value: 'bank', label: 'Bank', tone: 'accent' },
            ]}
            value={values.method}
            onChange={(val) => setFieldValue('method', val)}
          />
          <p className="mt-1.25 text-xs text-foreground-subtle">
            {AKUN[values.method]} sesudah ini{' '}
            <span className={cn('font-mono font-semibold', sesudah < 0 ? 'text-destructive' : 'text-foreground')}>
              {formatNumber(sesudah)}
            </span>
            {sesudah < 0 && ' — saldonya tidak cukup.'}
          </p>
        </div>

        <div>
          <Label htmlFor="description" className="mb-1.25" required>
            Keterangan
          </Label>
          <TextArea
            id="description"
            name="description"
            rows={3}
            placeholder="Biaya sekolah anak"
            value={values.description}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={!!salah('description') || undefined}
            className="min-h-[72px]"
          />
          <p className={cn('mt-1.25 text-xs', salah('description') ? 'text-destructive' : 'text-foreground-subtle')}>
            {salah('description') ?? `Muncul di buku besar sebagai "Prive ${values.description || '…'}".`}
          </p>
        </div>

        {/* Pratinjau jurnal: prive MENDEBIT MODAL, bukan Beban. */}
        <div className="flex flex-col gap-1.25 rounded-lg bg-surface-raised px-3.25 py-2.5">
          <span className="text-xs font-bold text-foreground-subtle">Jurnal yang terbentuk</span>
          <DialogRow label="Modal" value={`Debit ${formatNumber(values.amount || 0)}`} />
          <DialogDivider />
          <DialogRow label={AKUN[values.method]} value={`Kredit ${formatNumber(values.amount || 0)}`} />
        </div>

        <div className="mt-1 flex justify-end gap-1.75">
          <Button size="sm" variant="outline" onClick={tutup} disabled={isLoading}>
            Batal
          </Button>
          <Button size="sm" type="submit" loading={isLoading}>
            Catat prive
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CreatePriveDialog;
