import { UseQueryOptions, UseQueryResult } from 'react-query';

import { ItemResponse, ItemsResponse } from '@/typings/item';
import { BackendRes } from '@/typings/request';
import { apiInstanceWithoutBaseUrl, getApiBasedOnRoles } from '@/utils/api';

import { useFetchMyself } from './useFetchEmployee';
import useMyQuery from './useMyQuery';

const useFetchItemById = (id: string): UseQueryResult<BackendRes<ItemResponse>> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name);
  const fetcher = useMyQuery(['itemById', id, roles], async () => {
    const res = await getApiBasedOnRoles(roles ?? [], ['superadmin', 'admin', 'warehouse-admin']).get(`/items/${id}`);
    return res.data;
  });

  return fetcher;
};

const useFetchItems = <TQueryFnData = unknown, TError = unknown>(
  data: Partial<{
    forceUrl: string;
    paginated: boolean;
    per_page: number;
    search: string;
    order_by: Record<string, string>;
    where: Record<string, unknown>;
  }> = {},
  options?: UseQueryOptions<TQueryFnData, TError, BackendRes<ItemsResponse>>
): UseQueryResult<BackendRes<ItemsResponse>> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name);
  const fetcher = useMyQuery(
    ['items', data, roles],
    async () => {
      const res = data.forceUrl
        ? await apiInstanceWithoutBaseUrl().post(data.forceUrl, data)
        : await getApiBasedOnRoles(roles ?? [], ['superadmin', 'warehouse-admin']).post('/items', data);
      return res.data;
    },
    {
      enabled: !!roles,
      ...options,
    }
  );

  return fetcher;
};

export { useFetchItemById, useFetchItems };
