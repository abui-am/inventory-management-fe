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

function apiInstanceAdmin({ token }: { token?: string } = {}): AxiosInstance {
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_SUPERADMIN_URL,
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

export { apiInstanceAdmin, apiInstanceGeneral, apiInstanceWithoutBaseUrl };
export default apiInstance;
