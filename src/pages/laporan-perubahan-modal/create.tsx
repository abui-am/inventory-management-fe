import dayjs from 'dayjs';
import { AlertTriangle, ArrowLeft, Lock } from 'lucide-react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';

import CapitalCard from '@/components/capital-report/CapitalCard';
import { bacaAngka, formatAngka, formatUtuh, modalAkhirBerjalan } from '@/components/capital-report/rows';
import { CurrencyTextField } from '@/components/Form';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { DialogDivider, DialogHeading, DialogRow } from '@/components/ui/dialog-summary';
import { Label } from '@/components/ui/label';
import { useCreateCapitalReport } from '@/hooks/mutation/useMutateCapitalReport';
import { useFetchCapitalReportInfo } from '@/hooks/query/useFetchCapitalReportDate';
import { ThemeablePage } from '@/typings/page';
import reportError from '@/utils/reportError';

/**
 * Tutup buku — satu-satunya layar di aplikasi ini yang MENGUNCI periode.
 *
 * Layar lama menampilkan lima baris angka lalu satu tombol yang berubah jadi "Konfirmasi"
 * tanpa pernah menyebut apa yang terjadi saat ditekan. Yang sebenarnya terjadi di
 * `CapitalReportController::storeReport()`: laba periode ditulis sebagai baris Laba
 * Ditahan, laba yang diambil pemilik jadi baris Laba Diambil Owner,
 * `CreateLedgerFromCapitalReportsJob` menulis jurnalnya, saldonya pindah ke akun Modal —
 * dan periodenya terkunci, sehingga pembatalan, retur, dan penolakan barang masuk di
 * dalam periode itu semuanya ditolak dengan "period_closed".
 */
const TutupBukuPage: NextPage & ThemeablePage = () => {
  const router = useRouter();
  const { data, isLoading } = useFetchCapitalReportInfo({});
  const { mutateAsync, isLoading: menyimpan } = useCreateCapitalReport();

  const [diambil, setDiambil] = useState<number | undefined>(undefined);
  const [konfirmasi, setKonfirmasi] = useState(false);

  const info = data?.data;
  const angka = useMemo(() => bacaAngka(info?.capital_reports ?? []), [info]);

  // Nilai awal diambil dari jawaban backend, sama seperti layar lama.
  useEffect(() => {
    setDiambil(angka.diambil || undefined);
  }, [angka.diambil]);

  const jumlahDiambil = +(diambil ?? 0);

  // Batasnya dijepit di 0: periode yang RUGI punya `labaDitahan` negatif, dan
  // membandingkan langsung dengannya membuat 0 pun dianggap "lebih besar dari laba" —
  // periode rugi jadi tidak pernah bisa ditutup sama sekali.
  const batasDiambil = Math.max(angka.labaDitahan, 0);
  const lebih = jumlahDiambil > batasDiambil;
  const negatif = jumlahDiambil < 0;
  const bisaSimpan = !lebih && !negatif && !isLoading;

  const modalAkhir = modalAkhirBerjalan(angka, jumlahDiambil);

  const mulai = info?.start_date;
  const sampai = info?.end_date ?? new Date().toISOString();
  const periodeTeks = mulai
    ? `${dayjs(mulai).format('D MMM YYYY')} — ${dayjs(sampai).format('D MMM YYYY')}`
    : dayjs(sampai).format('D MMM YYYY');

  const tutup = async () => {
    try {
      await mutateAsync({ taken_profit: jumlahDiambil });
      setKonfirmasi(false);
      router.push('/laporan-perubahan-modal');
    } catch (error) {
      reportError(error, { action: 'createCapitalChangeReport' });
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="min-w-0">
          <h1 className="text-lg font-bold">Tutup buku</h1>
          <p className="mt-0.5 text-sm text-foreground-subtle">
            Hasil periode {periodeTeks} dipindahkan ke akun Modal lewat jurnal, dan periodenya dikunci.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.75">
          <Button size="sm" variant="outline" onClick={() => router.push('/laporan-perubahan-modal')}>
            <ArrowLeft strokeWidth={1.9} aria-hidden /> Kembali
          </Button>
          <Button size="sm" disabled={!bisaSimpan} onClick={() => setKonfirmasi(true)}>
            <Lock strokeWidth={1.9} aria-hidden /> Tutup buku
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[1.6fr_1fr]">
        <CapitalCard
          judul="Kalau ditutup sekarang"
          ket={`${periodeTeks} · belum ditutup`}
          angka={{ ...angka, diambil: jumlahDiambil }}
          modalAkhir={modalAkhir}
          loading={isLoading}
          denganDiambil={jumlahDiambil > 0}
        />

        <div className="flex flex-col gap-3 rounded-card border border-border bg-surface px-4.5 py-4 shadow-sm">
          <span className="text-base font-bold">Laba diambil pemilik</span>

          <div>
            <Label htmlFor="laba-diambil" className="mb-1">
              Jumlah yang diambil
            </Label>
            <CurrencyTextField
              id="laba-diambil"
              name="diambil"
              prefix="Rp"
              placeholder="0"
              value={diambil ?? ''}
              disabled={isLoading || menyimpan}
              aria-invalid={lebih || negatif}
              onChange={setDiambil}
            />
            {lebih && (
              <span className="mt-1 block text-xs text-destructive">
                {batasDiambil === 0
                  ? 'Periode ini merugi, jadi tidak ada laba yang bisa diambil.'
                  : `Tidak boleh lebih besar dari laba periode ini (${formatAngka(batasDiambil)}).`}
              </span>
            )}
            {negatif && <span className="mt-1 block text-xs text-destructive">Jumlahnya tidak boleh negatif.</span>}
            {!lebih && !negatif && (
              <span className="mt-1 block text-xs text-foreground-subtle">
                {batasDiambil === 0
                  ? 'Periode ini merugi — isian ini tetap 0, dan seluruh ruginya mengurangi Modal.'
                  : 'Boleh 0 kalau labanya ditahan seluruhnya. Sisanya masuk ke Modal.'}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-0.5 rounded-group bg-surface-raised px-2.75 py-2.25">
            <DialogRow
              label={angka.labaDitahan < 0 ? 'Rugi periode ini' : 'Laba periode ini'}
              value={formatUtuh(angka.labaDitahan)}
              tone={angka.labaDitahan < 0 ? undefined : 'success'}
            />
            <DialogRow label="Diambil pemilik" value={formatUtuh(jumlahDiambil)} tone="warning" />
            <DialogDivider />
            <DialogRow
              label={angka.labaDitahan - jumlahDiambil < 0 ? 'Mengurangi modal' : 'Ditahan jadi modal'}
              value={formatUtuh(angka.labaDitahan - jumlahDiambil)}
              strong
            />
          </div>
        </div>
      </div>

      <p className="flex items-start gap-1.75 rounded-lg bg-destructive-subtle px-3.25 py-2.5 text-sm leading-[18px] text-destructive">
        <AlertTriangle size={14} strokeWidth={1.9} className="mt-0.5 shrink-0" aria-hidden />
        <span>
          Sesudah ditutup, transaksi bertanggal <b>{periodeTeks}</b> tidak bisa lagi dibatalkan, diretur, atau ditolak.
          Jurnal penutupnya sudah terbit dan tidak dihitung ulang.
        </span>
      </p>

      <Modal
        isOpen={konfirmasi}
        onRequestClose={menyimpan ? undefined : () => setKonfirmasi(false)}
        bodyClassName="p-4"
      >
        <div className="flex flex-col gap-2.5">
          <DialogHeading title="Tutup buku periode ini?">
            {angka.labaDitahan < 0
              ? 'Rugi periode ini dipindahkan ke akun Modal lewat jurnal, dan periodenya dikunci.'
              : 'Laba periode ini dipindahkan ke akun Modal lewat jurnal, dan periodenya dikunci.'}
          </DialogHeading>

          <div className="flex flex-col gap-0.5 rounded-group bg-surface-raised px-2.75 py-2.25">
            <DialogRow
              label="Modal sebelum tutup buku"
              value={formatUtuh(angka.modalAwal + angka.modalDisetor + angka.prive)}
            />
            <DialogRow
              label={angka.labaDitahan < 0 ? 'Rugi periode ini' : 'Laba ditahan'}
              value={formatUtuh(angka.labaDitahan - jumlahDiambil)}
              tone={angka.labaDitahan - jumlahDiambil < 0 ? undefined : 'success'}
            />
            <DialogRow label="Laba diambil pemilik" value={formatUtuh(jumlahDiambil)} tone="warning" />
            <DialogDivider />
            <DialogRow label="Modal akhir" value={formatUtuh(modalAkhir)} strong />
          </div>

          <p className="flex items-start gap-1.5 rounded-lg bg-destructive-subtle px-2.75 py-2 text-sm leading-[17px] text-destructive">
            <AlertTriangle size={14} strokeWidth={1.9} className="mt-0.5 shrink-0" aria-hidden />
            <span>
              Sesudah ditutup, transaksi bertanggal <b>{periodeTeks}</b> tidak bisa lagi dibatalkan, diretur, atau
              ditolak.
            </span>
          </p>

          <div className="mt-1 flex justify-end gap-1.75">
            <Button size="sm" variant="outline" onClick={() => setKonfirmasi(false)} disabled={menyimpan}>
              Batal
            </Button>
            <Button size="sm" variant="destructive" loading={menyimpan} onClick={tutup}>
              Tutup buku
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

TutupBukuPage.themeable = true;

export default TutupBukuPage;
