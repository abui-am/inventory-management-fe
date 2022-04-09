import { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { useMutation, UseMutationResult, useQueryClient } from 'react-query';

import { PayDebtPayload } from '@/typings/debts';
import { BackendRes, BackendResError } from '@/typings/request';
import { apiInstanceAdmin } from '@/utils/api';

export const useUpdateDebt = (): UseMutationResult<BackendRes<any>, unknown, PayDebtPayload, unknown> => {
  const query = useQueryClient();
  const mutator = useMutation(
    ['pay', 'debt'],
    async (data: PayDebtPayload) => {
      try {
        const res = await apiInstanceAdmin().patch<PayDebtPayload, AxiosResponse<BackendRes<any>>>(
          `/debts/${data?.id}`,
          data?.data
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
        query.invalidateQueries('debts');
      },
      onError: (data: AxiosError<BackendResError<unknown>>) => {
        toast.error(data.response?.data.message ?? '');
      },
    }
  );
  return mutator;
};
