import { useFormik } from 'formik';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React from 'react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { Option } from 'react-select/src/filters';
import { object } from 'yup';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import {
  DatePickerComponent,
  SelectCity,
  SelectProvince,
  SelectSubdistrict,
  SelectVillage,
  TextArea,
  TextField,
} from '@/components/Form';
import { genderOptions } from '@/constants/options';
import { useCreateEmployee } from '@/hooks/query/useFetchEmployee';
import createSchema from '@/utils/validation/formik';

const Home: NextPage<unknown> = () => {
  const { mutateAsync } = useCreateEmployee();
  const { push } = useRouter();

  const initialValues = {
    firstName: '',
    lastName: '',
    noKTP: '',
    birthday: new Date(),
    gender: genderOptions[0],
    email: '',
    handphoneNumber: '',
    address: '',
    province: {} as Partial<Option>,
    city: {} as Partial<Option>,
    subdistrict: {} as Partial<Option>,
    village: {} as Partial<Option>,
  };

  const { values, handleChange, setSubmitting, handleSubmit, setFieldValue } = useFormik({
    validationSchema: object().shape(createSchema(initialValues)),
    initialValues,
    onSubmit: async (values) => {
      setSubmitting(true);
      const res = await mutateAsync(values);
      setSubmitting(false);
      toast(res.message);
      push('/employee');
    },
  });

  const { back } = useRouter();

  return (
    <CardDashboard title="Tambah Karyawan">
      <form onSubmit={handleSubmit}>
        <section className="max-w-4xl mr-auto ml-auto">
          <div className="mb-4">
            <h6 className="mb-3 text-lg font-bold">Informasi Umum</h6>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 inline-block">Nama Awal</label>
                <TextField placeholder="Nama Awal" value={values.firstName} name="firstName" onChange={handleChange} />
              </div>
              <div>
                <label className="mb-1 inline-block">Nama Akhir</label>
                <TextField placeholder="Nama Akhir" value={values.firstName} name="firstName" onChange={handleChange} />
              </div>
              <div>
                <label className="mb-1 inline-block">Nomor KTP</label>
                <TextField placeholder="Nomor KTP" />
              </div>
              <div>
                <label className="mb-1 inline-block">Tanggal Lahir</label>
                <DatePickerComponent
                  selected={values.birthday}
                  onChange={(val) => {
                    setFieldValue('birthday', val);
                  }}
                />
              </div>
              <div>
                <label className="mb-1 inline-block">Jenis Kelamin</label>
                <Select
                  options={genderOptions}
                  value={values.gender}
                  styles={{
                    valueContainer: (base) => ({
                      minHeight: 44,
                      ...base,
                    }),
                  }}
                />
              </div>
            </div>
          </div>
          <div className="mb-4">
            <h6 className="mb-3 text-lg font-bold">Kontak Pribadi</h6>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 inline-block">Email</label>
                <TextField placeholder="Email" value={values.email} name="email" onChange={handleChange} />
              </div>
              <div>
                <label className="mb-1 inline-block">Nomor HP</label>
                <TextField
                  placeholder="Nomor HP"
                  value={values.handphoneNumber}
                  name="handphoneNumber"
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          <div className="mb-4">
            <h6 className="mb-3 text-lg font-bold">Tempat Tinggal</h6>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 inline-block">Provinsi</label>
                <SelectProvince
                  value={values.province}
                  name="province"
                  onChange={(val) => setFieldValue('province', val)}
                />
              </div>
              <div>
                <label className="mb-1 inline-block">Kota / Kabupaten</label>
                <SelectCity
                  provinceId={values.province?.value as string}
                  value={values.city}
                  name="city"
                  onChange={(val) => setFieldValue('city', val)}
                />
              </div>
              <div>
                <label className="mb-1 inline-block">Kecamatan</label>
                <SelectSubdistrict
                  cityId={values.city?.value as string}
                  value={values.subdistrict}
                  name="subdistrict"
                  onChange={(val) => setFieldValue('subdistrict', val)}
                />
              </div>
              <div>
                <label className="mb-1 inline-block">Kelurahan</label>
                <SelectVillage
                  subdistrictId={values.subdistrict?.value as string}
                  value={values.village}
                  name="village"
                  onChange={(val) => setFieldValue('village', val)}
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 inline-block">Alamat</label>
                <TextArea placeholder="Alamat" value={values.address} name="address" onChange={handleChange} />
              </div>
            </div>
          </div>
        </section>
        <div className="mt-8 flex justify-end">
          <div className="flex">
            <Button onClick={() => back()} variant="secondary" className="mr-4">
              Batalkan
            </Button>
            <Button type="submit"> Tambah Karyawan</Button>
          </div>
        </div>
      </form>
    </CardDashboard>
  );
};

export default Home;
