import { UseQueryResult } from 'react-query';

import { ItemAuditsResponse, ItemUnpaginatedAuditsResponse } from '@/typings/audit';
import { BackendRes } from '@/typings/request';
import { apiInstanceWithoutBaseUrl, getApiBasedOnRoles } from '@/utils/api';

import keys from '../keys';
import { useFetchMyself } from './useFetchEmployee';
import useMyQuery from './useMyQuery';

export const useFetchAudits = (
  data: Partial<{
    forceUrl: string;
    paginated: boolean;
    per_page: number;
    search: string;
    order_by: Record<string, string>;
    where: Record<string, string>;
    with_audits: Record<string, unknown>;
  }> = {}
): UseQueryResult<BackendRes<ItemAuditsResponse>> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name) ?? [];
  const fetcher = useMyQuery([keys.audits, data, roles], async () => {
    const res = data.forceUrl
      ? await apiInstanceWithoutBaseUrl().post(data.forceUrl, data)
      : await getApiBasedOnRoles(roles, ['superadmin', 'warehouse-admin']).post('/items/audits', data);
    return res.data;
  });

  return fetcher;
};

export const useFetchUnpaginatedAudits = (
  data: Partial<{
    forceUrl: string;
    per_page: number;
    search: string;
    order_by: Record<string, string>;
    where: Record<string, string>;
    with_audits: Record<string, unknown>;
  }> = {}
): UseQueryResult<BackendRes<ItemUnpaginatedAuditsResponse>> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name) ?? [];
  const fetcher = useMyQuery(['audits', data, roles], async () => {
    const res = data.forceUrl
      ? await apiInstanceWithoutBaseUrl().post(data.forceUrl, data)
      : await getApiBasedOnRoles(roles, ['superadmin', 'warehouse-admin']).post('/items/audits', {
          ...data,
          paginated: false,
        });
    return res.data;
  });

  return fetcher;
};
