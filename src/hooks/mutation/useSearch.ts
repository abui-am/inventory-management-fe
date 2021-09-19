import { useMutation } from 'react-query';

import { RegionCitiesRes, RegionProvincesRes, RegionSubdistrictRes, RegionVilageRes } from '@/typings/regions';
import { BackendRes } from '@/typings/request';
import { RolesResponse } from '@/typings/role';
import apiInstance, { apiInstanceAdmin } from '@/utils/api';
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
