import { UseQueryOptions, UseQueryResult } from 'react-query';

import { CustomerDetailResponse, CustomersResponse } from '@/typings/customer';
import { BackendRes } from '@/typings/request';
import { apiInstanceWithoutBaseUrl, getApiBasedOnRoles } from '@/utils/api';

import { useFetchMyself } from './useFetchEmployee';
import useMyQuery from './useMyQuery';

export const useFetchCustomers = (
  data: Partial<{
    forceUrl: string;
    paginated: boolean;
    per_page: number;
    search: string;
    order_by: Record<string, string>;
    where: Record<string, string>;
  }> = {}
): UseQueryResult<BackendRes<CustomersResponse>> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name) ?? [];
  const fetcher = useMyQuery(['customers', data, roles], async () => {
    const res = data.forceUrl
      ? await apiInstanceWithoutBaseUrl().post(data.forceUrl)
      : await getApiBasedOnRoles(roles, ['superadmin', 'admin']).post('/customers', data);
    return res.data;
  });

  return fetcher;
};

export const useFetchCustomerById = (
  id: string,
  options?: UseQueryOptions<unknown, unknown, BackendRes<CustomerDetailResponse>>
): UseQueryResult<BackendRes<CustomerDetailResponse>> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name);
  const fetcher = useMyQuery(
    ['customer', id],
    async () => {
      const res = await getApiBasedOnRoles(roles ?? [], ['superadmin', 'admin']).get(`/customers/${id}`);
      return res.data;
    },
    options
  );

  return fetcher;
};
