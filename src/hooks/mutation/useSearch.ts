import { useMutation } from 'react-query';

import { CustomersResponse } from '@/typings/customer';
import { ItemsResponse } from '@/typings/item';
import { RegionCitiesRes, RegionProvincesRes, RegionSubdistrictRes, RegionVilageRes } from '@/typings/regions';
import { BackendRes } from '@/typings/request';
import { RolesResponse } from '@/typings/role';
import { SuppliersResponse } from '@/typings/supplier';
import apiInstance, { apiInstanceAdmin, getApiBasedOnRole, getApiBasedOnRoles } from '@/utils/api';

import { useFetchMyself } from '../query/useFetchEmployee';
export type SearchParam = { search: string; where?: { [k: string]: string } };

export const useSearchProvince = () => {
  return useMutation<BackendRes<RegionProvincesRes>, void, SearchParam>(['province'], async (jsonBody) => {
    const { data } = await apiInstance().post('/regions/provinces', jsonBody);
    return data;
  });
};

export const useSearchCity = () => {
  return useMutation<BackendRes<RegionCitiesRes>, void, SearchParam>(['cities'], async (jsonBody) => {
    const { data } = await apiInstance().post('/regions/cities', jsonBody);
    return data;
  });
};

export const useSearchSubdistrict = () => {
  return useMutation<BackendRes<RegionSubdistrictRes>, void, SearchParam>(['subdistricts'], async (jsonBody) => {
    const { data } = await apiInstance().post('/regions/subdistricts', jsonBody);
    return data;
  });
};

export const useSearchVillage = () => {
  return useMutation<BackendRes<RegionVilageRes>, void, SearchParam>(['village'], async (jsonBody) => {
    const { data } = await apiInstance().post('/regions/villages', jsonBody);
    return data;
  });
};

export const useSearchRoles = () => {
  return useMutation<BackendRes<RolesResponse>, void, SearchParam>(['roles'], async (jsonBody) => {
    const { data } = await apiInstanceAdmin().post('/roles', jsonBody);
    return data;
  });
};

export const useSearchItems = () => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data?.user?.roles.map(({ name }) => name) ?? [];
  return useMutation<BackendRes<ItemsResponse>, void, SearchParam>(['items'], async (jsonBody) => {
    const { data } = await getApiBasedOnRoles(roles, ['superadmin', 'admin', 'warehouse-admin']).post(
      '/items',
      jsonBody
    );
    return data;
  });
};

export const useSearchSuppliers = () => {
  const { data: dataSelf } = useFetchMyself();

  return useMutation<BackendRes<SuppliersResponse>, void, SearchParam>(['suppliers'], async (jsonBody) => {
    const { data } = await getApiBasedOnRole(dataSelf?.data?.user?.roles[0]?.name || '').post('/suppliers', jsonBody);
    return data;
  });
};

export const useSearchCustomers = () => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data.user.roles.map(({ name }) => name) ?? [];
  return useMutation<BackendRes<CustomersResponse>, void, SearchParam>(['suppliers'], async (jsonBody) => {
    const { data } = await getApiBasedOnRoles(roles, ['superadmin', 'admin']).post('/customers', jsonBody);
    return data;
  });
};

export const useSearcEmployee = () => {
  const { data: dataSelf } = useFetchMyself();
  const roles = dataSelf?.data?.user?.roles.map(({ name }) => name) ?? [];
  return useMutation<BackendRes<CustomersResponse>, void, SearchParam>(['suppliers'], async (jsonBody) => {
    const { data } = await getApiBasedOnRoles(roles, ['superadmin', 'admin']).post('/employees', jsonBody);
    return data;
  });
};
