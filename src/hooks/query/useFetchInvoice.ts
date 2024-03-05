import { UseQueryOptions, UseQueryResult } from 'react-query';

import { getApiBasedOnRoles } from '@/utils/api';

import keys from '../keys';
import { useFetchMyself } from './useFetchEmployee';
import useMyQuery from './useMyQuery';

export const useFetchInvoice = (
  id: string,
  options?: UseQueryOptions<unknown, unknown, string>
): UseQueryResult<string> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name);
  const fetcher = useMyQuery(
    [keys.invoice, id],
    async () => {
      const res = await getApiBasedOnRoles(roles ?? [], ['superadmin', 'admin']).get(`/transactions/${id}/export-pdf`, {
        responseType: 'blob',
      });
      return res.data;
    },
    options
  );

  return fetcher;
};

export default useFetchInvoice;
