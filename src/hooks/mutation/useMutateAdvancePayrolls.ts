import { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { useMutation, UseMutationResult, useQueryClient } from 'react-query';

import { CreateAdvancePayrollsPayload } from '@/typings/advance-payrolls';
import { BackendRes, BackendResError } from '@/typings/request';
import { CreateSaleBody } from '@/typings/sale';
import { apiInstanceAdmin } from '@/utils/api';

export const useCreateAdvancePayrolls = (): UseMutationResult<
  BackendRes<any>,
  unknown,
  CreateAdvancePayrollsPayload,
  unknown
> => {
  const query = useQueryClient();
  const mutator = useMutation(
    ['createAdvancePayrolls'],
    async (data: CreateAdvancePayrollsPayload) => {
      try {
        const res = await apiInstanceAdmin().put<CreateSaleBody, AxiosResponse<BackendRes<any>>>(
          '/advance-payrolls',
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

        query.invalidateQueries('advance-payrolls');
        query.invalidateQueries('ledgers');
      },
      onError: (data: AxiosError<BackendResError<unknown>>) => {
        toast.error(data.response?.data.message ?? '');
      },
    }
  );
  return mutator;
};
