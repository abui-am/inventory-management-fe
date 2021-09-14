import { UseQueryResult } from 'react-query';

import { BackendRes } from '@/typings/request';
import { FetchRolesBody, RolesRespondUnpaginated } from '@/typings/role';
import { apiInstanceAdmin } from '@/utils/api';

import useMyQuery from './useMyQuery';

const useFetchAllRoles = (
  data: Partial<Omit<FetchRolesBody, 'paginated'>> = {}
): UseQueryResult<BackendRes<RolesRespondUnpaginated>> => {
  const fetcher = useMyQuery(['roles', data], async () => {
    const res = await apiInstanceAdmin().post('/roles', { ...data, paginated: false });
    return res.data;
  });

  return fetcher;
};

export { useFetchAllRoles };
