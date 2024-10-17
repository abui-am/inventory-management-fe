import axios, { AxiosInstance } from 'axios';

import { getCookie } from './cookies';

function apiInstance({ token }: { token?: string } = {}): AxiosInstance {
  console.log(process.env);
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    params: {
      key: token || getCookie('INVT_TOKEN'),
    },
  });
}

function getApiBasedOnRole(role: string): AxiosInstance {
  return getApiByName(role);
}

function getApiBasedOnRoles(roles: string[], hierarchy: string[]): AxiosInstance {
  let api = apiInstance();
  let isChosen = false;
  hierarchy.forEach((list) => {
    if (roles.includes(list) && !isChosen) {
      api = getApiByName(list);
      isChosen = true;
    }
  });

  return api;
}

function getApiByName(role: string) {
  if (role === 'superadmin') {
    return apiInstanceAdmin();
  }
  if (role === 'admin') {
    return apiInstanceBasicAdmin();
  }
  if (role === 'warehouse-admin') {
    return apiInstanceWarehouseAdmin();
  }
  return apiInstance();
}

function apiInstanceAdmin({ token }: { token?: string } = {}): AxiosInstance {
  console.log('TEST', process.env.NEXT_PUBLIC_SUPERADMIN_URL);
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_SUPERADMIN_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token ?? getCookie('INVT-TOKEN')}`,
    },
  });
}

function apiInstanceBasicAdmin({ token }: { token?: string } = {}): AxiosInstance {
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_ADMIN_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token ?? getCookie('INVT-TOKEN')}`,
    },
  });
}

function apiInstanceWarehouseAdmin({ token }: { token?: string } = {}): AxiosInstance {
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_WAREHOUSE_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token ?? getCookie('INVT-TOKEN')}`,
    },
  });
}

function apiInstanceGeneral({ token }: { token?: string } = {}): AxiosInstance {
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_GENERAL_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token ?? getCookie('INVT-TOKEN')}`,
    },
  });
}

function apiInstanceWithoutBaseUrl({ token }: { token?: string } = {}): AxiosInstance {
  return axios.create({
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token ?? getCookie('INVT-TOKEN')}`,
    },
  });
}

export { apiInstanceAdmin, apiInstanceGeneral, apiInstanceWithoutBaseUrl, getApiBasedOnRole, getApiBasedOnRoles };
export default apiInstance;
