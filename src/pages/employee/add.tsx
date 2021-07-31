import { NextPage } from 'next';
import React from 'react';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { TextArea, TextField } from '@/components/Form';

const Home: NextPage<unknown> = () => {
  return (
    <CardDashboard title="Tambah Karyawan">
      <section className="max-w-4xl mr-auto ml-auto">
        <div className="mb-4">
          <h6 className="mb-3 text-lg font-bold">Informasi Umum</h6>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 inline-block">Nama Awal</label>
              <TextField placeholder="Nama Awal" />
            </div>
            <div>
              <label className="mb-1 inline-block">Nama Akhir</label>
              <TextField placeholder="Nama Akhir" />
            </div>
            <div>
              <label className="mb-1 inline-block">Nomor KTP</label>
              <TextField placeholder="Nomor KTP" />
            </div>
            <div>
              <label className="mb-1 inline-block">Tanggal Lahir</label>
              <TextField placeholder="Tanggal Lahir" />
            </div>
            <div>
              <label className="mb-1 inline-block">Jenis Kelamin</label>
              <TextField placeholder="Jenis Kelamin" />
            </div>
          </div>
        </div>
        <div className="mb-4">
          <h6 className="mb-3 text-lg font-bold">Kontak Pribadi</h6>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 inline-block">Email</label>
              <TextField placeholder="Email" />
            </div>
            <div>
              <label className="mb-1 inline-block">Nomor HP</label>
              <TextField />
            </div>
          </div>
        </div>
        <div className="mb-4">
          <h6 className="mb-3 text-lg font-bold">Tempat Tinggal</h6>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 inline-block">Alamat</label>
              <TextArea placeholder="Alamat" />
            </div>
            <div>
              <label className="mb-1 inline-block">Kecamatan</label>
              <TextField />
            </div>
            <div>
              <label className="mb-1 inline-block">Kelurahan</label>
              <TextField />
            </div>
            <div>
              <label className="mb-1 inline-block">Kota / Kabupaten</label>
              <TextField />
            </div>
            <div>
              <label className="mb-1 inline-block">Provinsi</label>
              <TextField />
            </div>
          </div>
        </div>
      </section>
      <div className="mt-8 flex justify-end">
        <div className="flex">
          <Button variant="secondary" className="mr-4">
            Batalkan
          </Button>
          <Button>Tambah Karyawan</Button>
        </div>
      </div>
    </CardDashboard>
  );
};

export default Home;
