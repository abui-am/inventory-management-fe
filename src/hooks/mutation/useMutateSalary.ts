import { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { useMutation, UseMutationResult, useQueryClient } from 'react-query';

import { BackendRes, BackendResError } from '@/typings/request';
import { CreateSalaryPayload, PayPayrollPayload } from '@/typings/salary';
import { apiInstanceAdmin } from '@/utils/api';

export const useCreateSalary = (): UseMutationResult<BackendRes<any>, unknown, CreateSalaryPayload, unknown> => {
  const query = useQueryClient();
  const mutator = useMutation(
    ['createSalary'],
    async (data: CreateSalaryPayload) => {
      try {
        const res = await apiInstanceAdmin().put<CreateSalaryPayload, AxiosResponse<BackendRes<any>>>(
          '/payrolls',
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
        query.invalidateQueries('salary');
      },
      onError: (data: AxiosError<BackendResError<unknown>>) => {
        toast.error(data.response?.data.message ?? '');
      },
    }
  );
  return mutator;
};

export const useUpdatePayroll = (): UseMutationResult<BackendRes<any>, unknown, PayPayrollPayload, unknown> => {
  const query = useQueryClient();
  const mutator = useMutation(
    ['pay', 'salary'],
    async (data: PayPayrollPayload) => {
      try {
        const res = await apiInstanceAdmin().patch<PayPayrollPayload, AxiosResponse<BackendRes<any>>>(
          `/payrolls/${data?.id}`,
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
        query.invalidateQueries('salary');
      },
      onError: (data: AxiosError<BackendResError<unknown>>) => {
        toast.error(data.response?.data.message ?? '');
      },
    }
  );
  return mutator;
};
