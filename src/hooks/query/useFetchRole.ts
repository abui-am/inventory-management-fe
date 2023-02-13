import { UseQueryResult } from 'react-query';

import { BackendRes } from '@/typings/request';
import { FetchRolesBody, RolesResponseUnpaginated } from '@/typings/role';
import { apiInstanceAdmin } from '@/utils/api';

import keys from '../keys';
import useMyQuery from './useMyQuery';

const useFetchAllRoles = (
  data: Partial<Omit<FetchRolesBody, 'paginated'>> = {}
): UseQueryResult<BackendRes<RolesResponseUnpaginated>> => {
  const fetcher = useMyQuery([keys.roles, data], async () => {
    const res = await apiInstanceAdmin().post('/roles', { ...data, paginated: false });
    return res.data;
  });

  return fetcher;
};

export { useFetchAllRoles };
