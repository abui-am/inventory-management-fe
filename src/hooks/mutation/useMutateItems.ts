import { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { useMutation, UseMutationResult, useQueryClient } from 'react-query';

import { CreateItemsBody, CreateItemsResponse } from '@/typings/item';
import { BackendRes, BackendResError } from '@/typings/request';
import { apiInstanceAdmin } from '@/utils/api';

// eslint-disable-next-line import/prefer-default-export
export const useCreateItems = (): UseMutationResult<
  BackendRes<CreateItemsResponse>,
  unknown,
  CreateItemsBody,
  unknown
> => {
  const query = useQueryClient();
  const mutator = useMutation(
    ['createItems'],
    async (data: CreateItemsBody) => {
      try {
        const res = await apiInstanceAdmin().put<CreateItemsBody, AxiosResponse<BackendRes<CreateItemsResponse>>>(
          '/items',
          data
        );
        return res.data;
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    {
      onSuccess: (data) => {
        toast.success(data.message);
        query.invalidateQueries('ledgers');
      },
      onError: (data: AxiosError<BackendResError<unknown>>) => {
        toast.error(data.response?.data.message ?? '');
      },
    }
  );
  return mutator;
};
