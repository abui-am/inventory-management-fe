import { useFormik } from 'formik';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React from 'react';
import Select from 'react-select';
import { object } from 'yup';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { DatePickerComponent, TextArea, TextField } from '@/components/Form';
import { genderOptions } from '@/constants/options';
import { useCreateEmployee } from '@/hooks/query/useFetchEmployee';
import createSchema from '@/utils/validation/formik';

const Home: NextPage<unknown> = () => {
  const { mutateAsync } = useCreateEmployee();

  const initialValues = {
    firstName: '',
    lastName: '',
    noKTP: '',
    birthday: new Date(),
    gender: genderOptions[0],
    email: '',
    handphoneNumber: '',
    address: '',
    province: '',
    city: '',
    district: '',
    village: '',
  };

  const { values, handleChange, isSubmitting, setSubmitting, handleSubmit, setFieldValue } = useFormik({
    validationSchema: object().shape(createSchema(initialValues)),
    initialValues,
    onSubmit: async (values) => {
      setSubmitting(true);
      await mutateAsync(values);
      setSubmitting(false);
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
              <div className="col-span-2">
                <label className="mb-1 inline-block">Alamat</label>
                <TextArea placeholder="Alamat" value={values.address} name="address" onChange={handleChange} />
              </div>
              <div>
                <label className="mb-1 inline-block">Provinsi</label>
                <TextField value={values.province} name="province" onChange={handleChange} />
              </div>
              <div>
                <label className="mb-1 inline-block">Kota / Kabupaten</label>
                <TextField value={values.city} name="city" onChange={handleChange} />
              </div>
              <div>
                <label className="mb-1 inline-block">Kecamatan</label>
                <TextField value={values.district} name="district" onChange={handleChange} />
              </div>
              <div>
                <label className="mb-1 inline-block">Kelurahan</label>
                <TextField value={values.village} name="village" onChange={handleChange} />
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
