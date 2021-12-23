import { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { useMutation, UseMutationResult, useQueryClient } from 'react-query';

import { AuditsData, CreateItemsAuditBody, CreateItemsAuditResponse } from '@/typings/audit';
import { BackendRes, BackendResError } from '@/typings/request';
import { apiInstanceAdmin, getApiBasedOnRoles } from '@/utils/api';

import { useFetchMyself } from '../query/useFetchEmployee';

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

        return res.data;
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    {
      onSuccess: (data) => {
        query.invalidateQueries(['audits']);
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
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name);

  const mutator = useMutation(
    ['editAudit', editId],
    async (data: Partial<AuditsData>) => {
      const res = await getApiBasedOnRoles(roles ?? [], ['superadmin', 'admin']).patch(`/items/audits/${editId}`, data);
      return res.data;
    },
    {
      onSuccess: (data) => {
        query.invalidateQueries(['audits']);
        toast.success(data.message);
      },
    }
  );
  return mutator;
};
