import { UseQueryOptions, UseQueryResult } from 'react-query';

import { BackendRes } from '@/typings/request';
import { UserDetailResponse } from '@/typings/user';
import { apiInstanceAdmin } from '@/utils/api';

import useMyQuery from './useMyQuery';

export const useFetchUserById = (
  id: string,
  options?: UseQueryOptions<unknown, unknown, BackendRes<UserDetailResponse>>
): UseQueryResult<BackendRes<UserDetailResponse>> => {
  const fetcher = useMyQuery(
    ['user', id],
    async () => {
      const res = await apiInstanceAdmin().get(`/users/${id}`);
      return res.data;
    },
    options
  );

  return fetcher;
};
