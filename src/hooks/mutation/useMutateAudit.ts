import { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { useMutation, UseMutationResult, useQueryClient } from 'react-query';

import { AuditsData, CreateItemsAuditBody, CreateItemsAuditResponse } from '@/typings/audit';
import { BackendRes, BackendResError } from '@/typings/request';
import { apiInstanceAdmin } from '@/utils/api';

export const useAudit = (): UseMutationResult<BackendRes<CreateItemsAuditResponse>, unknown, CreateItemsAuditBody> => {
  const query = useQueryClient();

  const mutator = useMutation(
    ['createAudit'],
    async (data: CreateItemsAuditBody) => {
      try {
        const res = await apiInstanceAdmin().put<
          CreateItemsAuditBody,
          AxiosResponse<BackendRes<CreateItemsAuditResponse>>
        >('/items/audits', data);
        query.invalidateQueries(['audits']);

        return res.data;
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    {
      onSuccess: (data) => {
        toast.success(data.message);
      },
      onError: (data: AxiosError<BackendResError<unknown>>) => {
        toast.error(data.response?.data.message ?? '');
      },
    }
  );
  return mutator;
};

export const useEditAudit = (
  editId: string
): UseMutationResult<BackendRes<CreateItemsAuditResponse>, unknown, Partial<AuditsData>, unknown> => {
  const query = useQueryClient();

  const mutator = useMutation(['editAudit', editId], async (data: Partial<AuditsData>) => {
    const res = await apiInstanceAdmin().patch(`/items/audits/${editId}`, data);
    query.invalidateQueries(['audits']);
    return res.data;
  });

  return mutator;
};
