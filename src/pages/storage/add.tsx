import { useFormik } from 'formik';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React from 'react';
import { object } from 'yup';

import { Button } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { TextField } from '@/components/Form';
import createSchema from '@/utils/validation/formik';

const AddStockPage: NextPage = () => {
  const { back } = useRouter();
  const initialValues = {
    name: '',
    category: '',
    quantity: '',
    unit: '',
    price: '',
  };
  const { values, handleChange, errors, isSubmitting } = useFormik({
    validationSchema: object().shape(createSchema(initialValues)),
    initialValues,
    onSubmit: async () => {
      return '';
    },
  });
  return (
    <CardDashboard title="Tambah Stock Gudang">
      <div className="flex flex-wrap -mx-2 mb-8">
        <div className="w-6/12 px-2 mb-3">
          <div className="mb-3">
            <label className="mb-1 inline-block">Nama barang</label>
            <TextField
              id="name"
              name="name"
              value={values.name}
              placeholder="Nama barang"
              autoComplete="invt-email"
              disabled={isSubmitting}
              onChange={handleChange}
              hasError={!!errors.name}
            />
            {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
          </div>
        </div>
        <div className="w-6/12 px-2 mb-3">
          <div className="mb-3">
            <label className="mb-1 inline-block">Kategori</label>
            <TextField
              id="category"
              name="category"
              value={values.category}
              placeholder="Kategori"
              autoComplete="invt-email"
              disabled={isSubmitting}
              onChange={handleChange}
              hasError={!!errors.category}
            />
            {errors.category && <span className="text-xs text-red-500">{errors.category}</span>}
          </div>
        </div>
        <div className="w-3/12 px-2 mb-3">
          <div className="mb-3">
            <label className="mb-1 inline-block">Jumlah stock</label>
            <TextField
              id="quantity"
              name="quantity"
              value={values.quantity}
              placeholder="Masukan jumlah stock"
              autoComplete="invt-email"
              disabled={isSubmitting}
              onChange={handleChange}
              hasError={!!errors.quantity}
            />
            {errors.quantity && <span className="text-xs text-red-500">{errors.quantity}</span>}
          </div>
        </div>
        <div className="w-3/12 px-2 mb-3">
          <div className="mb-3">
            <label className="mb-1 inline-block">Unit satuan</label>
            <TextField
              id="unit"
              name="unit"
              value={values.unit}
              placeholder="Masukan unit"
              autoComplete="invt-email"
              disabled={isSubmitting}
              onChange={handleChange}
              hasError={!!errors.unit}
            />
            {errors.unit && <span className="text-xs text-red-500">{errors.unit}</span>}
          </div>
        </div>
        <div className="w-6/12 px-2 mb-3">
          <div className="mb-3">
            <label className="mb-1 inline-block">Harga per unit</label>
            <TextField
              id="price"
              name="price"
              value={values.price}
              placeholder="Masukan harga"
              autoComplete="invt-email"
              disabled={isSubmitting}
              onChange={handleChange}
              hasError={!!errors.price}
            />
            {errors.price && <span className="text-xs text-red-500">{errors.price}</span>}
          </div>
        </div>
      </div>
      <div className="mt-8 flex justify-end">
        <div className="flex">
          <Button onClick={() => back()} variant="secondary" className="mr-4">
            Batalkan
          </Button>
          <Button type="submit">Tambah Barang</Button>
        </div>
      </div>
    </CardDashboard>
  );
};

export default AddStockPage;
