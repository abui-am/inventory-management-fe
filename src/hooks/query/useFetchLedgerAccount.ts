import { UseQueryResult } from 'react-query';

import { GetLedgerAccountsResponse, GetUnpaginatedLedgerAccountsResponse } from '@/typings/ledger-accounts';
import { BackendRes } from '@/typings/request';
import { apiInstanceWithoutBaseUrl, getApiBasedOnRoles } from '@/utils/api';

import keys from '../keys';
import { useFetchMyself } from './useFetchEmployee';
import useMyQuery from './useMyQuery';

export const useFetchLedgerAccounts = (
  data: Partial<{
    forceUrl: string;
    paginated: boolean;
    per_page: number;
    search: string;
    where_greater_equal: Record<string, string>;
    where_lower_equal: Record<string, string>;
  }> = {}
): UseQueryResult<BackendRes<GetLedgerAccountsResponse>> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name) ?? [];
  const fetcher = useMyQuery([keys.ledgerAccounts, data, roles], async () => {
    const res = data.forceUrl
      ? await apiInstanceWithoutBaseUrl().post(data.forceUrl, data)
      : await getApiBasedOnRoles(roles, ['superadmin', 'admin']).post('/ledger-accounts', data);
    return res.data;
  });

  return fetcher;
};

export const useFetchUnpaginatedLedgerAccounts = (
  data: Partial<{
    forceUrl: string;
    search: string;
    where_greater_equal: Record<string, string>;
    where_lower_equal: Record<string, string>;
  }> = {}
): UseQueryResult<BackendRes<GetUnpaginatedLedgerAccountsResponse>> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name) ?? [];
  const fetcher = useMyQuery([keys.ledgerAccounts, data, roles], async () => {
    const res = data.forceUrl
      ? await apiInstanceWithoutBaseUrl().post(data.forceUrl, data)
      : await getApiBasedOnRoles(roles, ['superadmin']).post('/ledger-accounts', { ...data, paginated: false });
    return res.data;
  });

  return fetcher;
};
