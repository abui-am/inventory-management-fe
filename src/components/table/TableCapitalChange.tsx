// import Link from 'next/link';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useCreateCapitalReport } from '@/hooks/mutation/useMutateCapitalReport';
import { useFetchCapitalReportInfo } from '@/hooks/query/useFetchCapitalReportDate';
import { useFetchUnpaginatedLedgerAccounts } from '@/hooks/query/useFetchLedgerAccount';
import formatCurrency from '@/utils/formatCurrency';

import { Button } from '../Button';
import Divider from '../Divider';
import { TextField } from '../Form';

const TableIncomeReport: React.FC<{ isView?: boolean; startDate?: string; endDate?: string }> = ({
  isView = false,
  startDate,
  endDate,
}) => {
  const [takeProfit, setTakeProfit] = useState(0);
  const { data } = useFetchCapitalReportInfo({
    start_date: startDate,
    end_date: endDate,
  });
  const [isConfirmed, setIsConfirmed] = useState(false);
  const { data: dataLedgerAcc } = useFetchUnpaginatedLedgerAccounts({});
  const dataModal = dataLedgerAcc?.data?.ledger_accounts?.find((val) => val.name === 'Modal');
  const { mutateAsync } = useCreateCapitalReport();
  const router = useRouter();
  const handleClick = async () => {
    if (takeProfit >= 0) {
      await mutateAsync({
        taken_profit: takeProfit,
      });
      setIsConfirmed(false);
      toast.success('Berhasil membuat laporan perubahan modal');
      router.push('/laporan-perubahan-modal');
    }
  };

  const currentCapital =
    startDate && endDate
      ? data?.data?.capital_reports?.find((val) => val.title === 'Modal Awal')?.amount ?? 0
      : +(dataModal?.balance ?? 0);
  const capitalStored = data?.data?.capital_reports?.find((val) => val.title === 'Modal Disetor')?.amount ?? 0;

  const capitalDitahan = data?.data?.capital_reports?.find((val) => val.title === 'Laba Ditahan')?.amount ?? 0;
  const prive = data?.data?.capital_reports?.find((val) => val.title === 'Prive')?.amount ?? 0;

  useEffect(() => {
    setTakeProfit(data?.data?.capital_reports?.find((val) => val.title === 'Laba Diambil Owner')?.amount ?? 0);
  }, [data]);
  return (
    <>
      <section className="flex justify-center">
        <div className="max-w-4xl w-full">
          <label className="mb-4 block">
            <span className="text-gray-900 font-bold">Periode:</span>
          </label>
          <h2>
            {dayjs(data?.data?.start_date).format('DD MMMM YYYY HH:mm:ss')} -{' '}
            {dayjs(data?.data?.end_date ?? new Date()).format('DD MMMM YYYY HH:mm:ss')}
          </h2>
        </div>
      </section>
      <Divider />
      <section className="flex justify-center">
        <div className="max-w-4xl w-full rounded-md border p-6">
          <div>
            <div className="flex justify-between w-full mb-2">
              <h1 className="text-lg text-gray-900 font-bold mb-2">Modal Awal</h1>
              <span>
                <b>{formatCurrency({ value: currentCapital })}</b>
              </span>
            </div>
            <Divider />

            <div className="mb-4">
              <div className="flex justify-between w-full mb-2">
                <label>Modal disetor: </label>
                <span>
                  <b>
                    {formatCurrency({
                      value: capitalStored,
                    })}
                  </b>
                </span>
              </div>
              <div className="flex justify-between w-full mb-2">
                <label>Laba ditahan:</label>
                <span>
                  <b>
                    {formatCurrency({
                      value: capitalDitahan,
                    })}
                  </b>
                </span>
              </div>
              <div className="flex justify-between w-full mb-2">
                <label>Prive: </label>
                <span>
                  <b>
                    {formatCurrency({
                      value: prive,
                    })}
                  </b>
                </span>
              </div>
              {isView && (
                <div className="flex justify-between w-full mb-2">
                  <label>Laba diambil owner: </label>
                  <span>
                    <b>
                      {formatCurrency({
                        value: takeProfit,
                      })}
                    </b>
                  </span>
                </div>
              )}
            </div>

            {!isView ? (
              <div className="flex justify-between w-full mb-2 p-2 rounded-lg items-center bg-gray-50 border">
                <label>Laba diambil owner: </label>
                <TextField
                  placeholder="Masukan laba diambil"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(+e.target.value)}
                />
              </div>
            ) : null}

            <div className="mt-8">
              <div className="flex justify-between w-full mb-2">
                <label className="text-lg">
                  <b>Modal Akhir:</b>{' '}
                </label>
                <span className="text-lg">
                  <b>
                    {isView
                      ? formatCurrency({
                          // takeProfit udah minus kalau view, prive juga
                          value: currentCapital + capitalDitahan + capitalStored + prive + takeProfit ?? 0,
                        })
                      : formatCurrency({
                          value: currentCapital + capitalDitahan + capitalStored + prive - takeProfit ?? 0,
                        })}
                  </b>
                </span>
              </div>
            </div>
            {isConfirmed && <div className="text-red-500">Pastikan semua data terisi dengan benar*</div>}
            {!isView && (
              <div className="mt-8">
                {isConfirmed ? (
                  <Button onClick={handleClick} type="button" fullWidth>
                    Konfirmasi
                  </Button>
                ) : (
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      setIsConfirmed(true);
                    }}
                    fullWidth
                  >
                    Buat Laporan Perubahan Modal
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default TableIncomeReport;
