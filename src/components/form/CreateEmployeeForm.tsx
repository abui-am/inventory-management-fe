/* eslint-disable react-hooks/rules-of-hooks */
import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { useRouter } from 'next/router';
import React, { useMemo } from 'react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { Option } from 'react-select/src/filters';
import { object } from 'yup';

import { Button } from '@/components/Button';
import {
  DatePickerComponent,
  PhoneNumberTextField,
  SelectCity,
  SelectProvince,
  SelectSubdistrict,
  SelectVillage,
  TextArea,
  TextField,
} from '@/components/Form';
import { genderOptions } from '@/constants/options';
import { useCreateEmployee, useEditEmployee, useFetchEmployeeById } from '@/hooks/query/useFetchEmployee';
import { CreateEmployeePutBody } from '@/typings/employee';
import { createOption, getOptionByValue } from '@/utils/options';
import createSchema from '@/utils/validation/formik';

const CreateEmployeeForm: React.FC<{ isEdit?: boolean; editId?: string }> = ({ editId, isEdit = false }) => {
  const { mutateAsync } = useCreateEmployee();
  const { mutateAsync: editEmployee } = useEditEmployee(editId ?? '');
  const { data, isLoading } = useFetchEmployeeById(editId ?? '', { enabled: isEdit });
  const editingEmployee = data?.data?.employee;
  const homeAddress = editingEmployee?.addresses.filter((val) => val.title === 'Alamat Rumah')[0];
  const village = homeAddress?.village;
  const subdistrict = village?.subdistrict;
  const city = subdistrict?.city;
  const province = city?.province;
  const { back } = useRouter();

  const initialValues =
    isEdit && !isLoading
      ? {
          firstName: editingEmployee?.first_name ?? '',
          lastName: editingEmployee?.last_name ?? '',
          nik: editingEmployee?.nik ?? '',
          birthday: dayjs(editingEmployee?.birth_date).toDate() ?? new Date(),
          gender: editingEmployee?.gender ? getOptionByValue(genderOptions, editingEmployee?.gender) : genderOptions[0],
          email: editingEmployee?.email ?? '',
          handphoneNumber: editingEmployee?.phone_number ?? '',
          address: editingEmployee?.addresses ? homeAddress?.complete_address : '',
          position: editingEmployee?.position ?? '',
          province: homeAddress
            ? createOption(province?.name ?? '', province?.id?.toString() ?? '')
            : ({} as Partial<Option>),
          city: city ? createOption(city?.name ?? '', city?.id?.toString() ?? '') : ({} as Partial<Option>),
          subdistrict: subdistrict
            ? createOption(subdistrict?.name ?? '', subdistrict?.id?.toString() ?? '')
            : ({} as Partial<Option>),
          village: village ? createOption(village?.name ?? '', village?.id?.toString() ?? '') : ({} as Partial<Option>),
        }
      : {
          firstName: '',
          lastName: '',
          nik: '',
          birthday: new Date(),
          gender: genderOptions[0],
          email: '',
          handphoneNumber: '',
          address: '',
          position: '',
          province: {} as Partial<Option>,
          city: {} as Partial<Option>,
          subdistrict: {} as Partial<Option>,
          village: {} as Partial<Option>,
        };

  const validationSchema = useMemo(() => object().shape(createSchema(initialValues)), [initialValues]);

  const { values, handleChange, setSubmitting, handleSubmit, setFieldValue, errors, touched } = useFormik({
    validationSchema,
    initialValues,
    enableReinitialize: isEdit,
    onSubmit: async (values) => {
      const { firstName, lastName, nik, birthday, gender, email, handphoneNumber, position, village, address } = values;
      setSubmitting(true);

      const jsonBody: CreateEmployeePutBody = {
        first_name: firstName,
        last_name: lastName,
        nik,
        birth_date: dayjs(birthday).format('YYYY-MM-DD'),
        gender: gender?.value ?? '',
        email,
        phone_number: handphoneNumber,
        position,
        addresses: [
          {
            village_id: +(village?.value ?? 0),
            title: 'Alamat Rumah',
            complete_address: address ?? '',
          },
        ],
      };
      const res = isEdit ? await editEmployee(jsonBody) : await mutateAsync(jsonBody);
      setSubmitting(false);
      toast(res.message);
      back();
    },
  });

  if (isLoading && isEdit) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <section className="max-w-4xl mr-auto ml-auto">
        <div className="mb-4">
          <h6 className="mb-3 text-lg font-bold">Informasi Umum</h6>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 inline-block">Nama Awal</label>
              <TextField placeholder="Nama Awal" value={values.firstName} name="firstName" onChange={handleChange} />
              {errors.firstName && touched.firstName && (
                <span className="text-xs text-red-500">{errors.firstName}</span>
              )}
            </div>
            <div>
              <label className="mb-1 inline-block">Nama Akhir</label>
              <TextField placeholder="Nama Akhir" value={values.lastName} name="lastName" onChange={handleChange} />
              {errors.lastName && touched.lastName && <span className="text-xs text-red-500">{errors.lastName}</span>}
            </div>
            <div>
              <label className="mb-1 inline-block">Nomor KTP</label>
              <TextField placeholder="Nomor KTP" name="nik" onChange={handleChange} value={values.nik} />
              {errors.nik && touched.nik && <span className="text-xs text-red-500">{errors.nik}</span>}
            </div>
            <div>
              <label className="mb-1 inline-block">Tanggal Lahir</label>
              <DatePickerComponent
                selected={values.birthday}
                onChange={(val) => {
                  setFieldValue('birthday', val);
                }}
              />
              {errors.birthday && touched.birthday && <span className="text-xs text-red-500">{errors.birthday}</span>}
            </div>
            <div>
              <label className="mb-1 inline-block">Jenis Kelamin</label>
              <Select
                options={genderOptions}
                value={values.gender}
                onChange={(gender) => setFieldValue('gender', gender)}
                styles={{
                  valueContainer: (base) => ({
                    minHeight: 44,
                    ...base,
                  }),
                }}
              />
              {errors.gender && touched.gender && <span className="text-xs text-red-500">{errors.gender}</span>}
            </div>
            <div>
              <label className="mb-1 inline-block">Jabatan</label>
              <TextField placeholder="Jabatan" onChange={handleChange} name="position" value={values.position} />
              {errors.position && touched.position && <span className="text-xs text-red-500">{errors.position}</span>}
            </div>
          </div>
        </div>
        <div className="mb-4">
          <h6 className="mb-3 text-lg font-bold">Kontak Pribadi</h6>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 inline-block">Email</label>
              <TextField placeholder="Email" value={values.email} name="email" onChange={handleChange} />
              {errors.email && touched.email && <span className="text-xs text-red-500">{errors.email}</span>}
            </div>
            <div>
              <label className="mb-1 inline-block">Nomor HP</label>
              <PhoneNumberTextField
                placeholder="Nomor HP"
                value={values.handphoneNumber}
                name="handphoneNumber"
                hasError={!!errors.handphoneNumber}
                onChange={(handphoneNumber) => setFieldValue('handphoneNumber', handphoneNumber)}
              />
              {errors.handphoneNumber && touched.handphoneNumber && (
                <span className="text-xs text-red-500">{errors.handphoneNumber}</span>
              )}
            </div>
          </div>
        </div>
        <div className="mb-4">
          <h6 className="mb-3 text-lg font-bold">Tempat Tinggal</h6>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 inline-block">Provinsi</label>
              <SelectProvince
                value={values.province}
                name=""
                onChange={(val) => {
                  setFieldValue('province', val);
                  setFieldValue('city', {});
                  setFieldValue('subdistrict', {});
                  setFieldValue('village', {});
                }}
              />
              {errors.province && touched.province && <span className="text-xs text-red-500">{errors.province}</span>}
            </div>
            <div>
              <label className="mb-1 inline-block">Kota / Kabupaten</label>
              <SelectCity
                provinceId={values.province?.value as string}
                value={values.city}
                name="city"
                onChange={(val) => {
                  setFieldValue('city', val);
                  setFieldValue('subdistrict', {});
                  setFieldValue('village', {});
                }}
              />
              {errors.city && touched.city && <span className="text-xs text-red-500">{errors.city}</span>}
            </div>
            <div>
              <label className="mb-1 inline-block">Kecamatan</label>
              <SelectSubdistrict
                cityId={values.city?.value as string}
                value={values.subdistrict}
                name="subdistrict"
                onChange={(val) => {
                  setFieldValue('subdistrict', val);
                  setFieldValue('village', {});
                }}
              />
              {errors.subdistrict && touched.subdistrict && (
                <span className="text-xs text-red-500">{errors.subdistrict}</span>
              )}
            </div>
            <div>
              <label className="mb-1 inline-block">Kelurahan</label>
              <SelectVillage
                subdistrictId={values.subdistrict?.value as string}
                value={values.village}
                name="village"
                onChange={(val) => setFieldValue('village', val)}
              />
              {errors.village && touched.village && <span className="text-xs text-red-500">{errors.village}</span>}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 inline-block">Alamat</label>
              <TextArea placeholder="Alamat" value={values.address} name="address" onChange={handleChange} />
              {errors.address && touched.address && <span className="text-xs text-red-500">{errors.address}</span>}
            </div>
          </div>
        </div>
      </section>
      <div className="mt-8 flex justify-end">
        <div className="flex">
          <Button onClick={() => back()} variant="secondary" className="mr-4">
            Batalkan
          </Button>
          <Button type="submit">{isEdit ? 'Edit Karyawan' : 'Tambah Karyawan'}</Button>
        </div>
      </div>
    </form>
  );
};

export default CreateEmployeeForm;
