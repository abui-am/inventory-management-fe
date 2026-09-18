import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { rutaAkun } from '@/components/ledger/LedgerView';
import { useFetchUnpaginatedLedgerAccounts } from '@/hooks/query/useFetchLedgerAccount';
import { ThemeablePage } from '@/typings/page';

/**
 * Buku besar selalu dibuka pada satu akun, jadi halaman ini hanya mengarahkan ke akun
 * pertama — persis perilaku halaman lama. Akunnya diambil dari backend, bukan ditulis
 * di sini, supaya tidak ada nama akun yang di-hardcode.
 */
const LedgerIndexPage: NextPage & ThemeablePage = () => {
  const { replace } = useRouter();
  const { data } = useFetchUnpaginatedLedgerAccounts();
  const pertama = data?.data?.ledger_accounts?.[0]?.name;

  useEffect(() => {
    if (pertama) replace(rutaAkun(pertama));
  }, [pertama, replace]);

  return null;
};

LedgerIndexPage.themeable = true;

export default LedgerIndexPage;
