import { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { useMutation, UseMutationResult, useQueryClient } from 'react-query';

import { CreatePrivePayload } from '@/typings/prives';
import { BackendRes, BackendResError } from '@/typings/request';
import { getApiBasedOnRoles } from '@/utils/api';

import { useFetchMyself } from '../query/useFetchEmployee';

export const useCreatePrive = (): UseMutationResult<BackendRes<any>, unknown, any> => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name);
  const query = useQueryClient();
  const mutator = useMutation(
    ['createPrive'],
    async (data: CreatePrivePayload) => {
      try {
        const res = await getApiBasedOnRoles(roles ?? [], ['superadmin']).put<
          CreatePrivePayload,
          AxiosResponse<BackendRes<CreatePrivePayload>>
        >('/prives', data);
        return res.data;
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    {
      onSuccess: (data) => {
        toast.success(data.message);
        query.invalidateQueries('prives');
        query.invalidateQueries('ledgers');
      },
      onError: (data: AxiosError<BackendResError<unknown>>) => {
        toast.error(data.response?.data.message ?? '');
      },
    }
  );
  return mutator;
};
