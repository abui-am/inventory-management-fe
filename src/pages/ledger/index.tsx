import { useRouter } from 'next/router';
import React, { useEffect, useMemo } from 'react';

import { useFetchUnpaginatedLedgerAccounts } from '@/hooks/query/useFetchLedgerAccount';

const LedgerIndex = () => {
  const { data: dataResLedger } = useFetchUnpaginatedLedgerAccounts();
  const router = useRouter();
  const typeOptions = useMemo(
    () =>
      dataResLedger?.data?.ledger_accounts?.map?.(({ name, id, ...props }) => ({
        label: name,
        value: id,
        data: props,
      })) ?? [],
    [dataResLedger]
  );

  useEffect(() => {
    if (typeOptions?.[0]?.label) router.push(`/ledger/${typeOptions?.[0]?.label}`);
  }, [router, typeOptions]);

  if (!typeOptions?.[0]) {
    return <div>Kosong, harap mengisi data terlebih dahulu</div>;
  }

  return <div>Redirecting...</div>;
};

export default LedgerIndex;
