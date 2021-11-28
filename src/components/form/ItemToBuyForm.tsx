import { useFormik } from 'formik';
import React from 'react';
import toast from 'react-hot-toast';
import { v4 } from 'uuid';
import { object } from 'yup';

import { Item } from '@/typings/item';
import createSchema from '@/utils/validation/formik';

import { Button } from '../Button';
import { TextField, WithLabelAndError } from '../Form';
import { SelectItemsSync } from '../Select';

export type ItemToBuyFormValues = {
  item: { label: string; value: string; data: Item };
  discount: number | '';
  qty: number | '';
  id: string | '';
};

const ItemToBuyForm: React.FC<{
  initValues: ItemToBuyFormValues;
  onSave: (values: ItemToBuyFormValues, action: 'create' | 'edit') => void;
}> = ({ initValues, onSave }) => {
  const initialValues = {
    item: initValues.item || '',
    discount: initValues.discount || '',
    qty: initValues.qty || '',
    id: initValues.id || '',
  };

  const { values, handleChange, handleSubmit, resetForm, setFieldValue, errors, touched } = useFormik({
    validationSchema: object().shape(createSchema(initialValues)),
    initialValues,
    enableReinitialize: !!initValues,
    onSubmit: async (values, { resetForm }) => {
      if (onSave) {
        if (!values.id) {
          onSave(
            {
              discount: +values.discount,
              item: values.item,
              qty: +values.qty,
              id: v4(),
            },
            'create'
          );
          toast.success(`${values.qty} ${values.item.label} berhasil ditambahkan`);
        } else {
          onSave(
            {
              discount: +values.discount,
              item: values.item,
              qty: +values.qty,
              id: values.id,
            },
            'edit'
          );
          toast.success(`Barang ${values.item.label} berhasil diedit`);
        }
        resetForm();
      }
    },
  });

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex -mx-2 flex-wrap mb-1">
        <div className="mb-3 px-2 w-full">
          <WithLabelAndError label="Nama barang" name="item" errors={errors} touched={touched}>
            <SelectItemsSync
              onChange={(val: never) => {
                const data: { label: string; value: string; data: Item } = val as never;
                setFieldValue(`item`, data);
              }}
              withDetail
              value={values.item}
            />
          </WithLabelAndError>
        </div>

        <div className="w-9/12 mb-3 px-2">
          <WithLabelAndError label="Jumlah yang dibeli" name="qty" errors={errors} touched={touched}>
            <TextField name="qty" value={values.qty} onChange={handleChange} placeholder="0" type="number" />
            <small className="text-gray-600">Pastikan jumlah yang dibeli dibawah stock</small>
          </WithLabelAndError>
        </div>
        <div className="w-3/12 mb-3 px-2">
          <WithLabelAndError label="Diskon" name="discount" errors={errors} touched={touched}>
            <TextField
              name="discount"
              tabIndex={-1}
              value={values.discount}
              onChange={handleChange}
              placeholder="0"
              type="number"
            />
            <small className="text-gray-600">Masukan angka (bukan persen)</small>
          </WithLabelAndError>
        </div>
      </div>

      <div className="flex justify-end pt-4 mt-4 border-t border-gray-300">
        <div className="flex">
          <Button variant="secondary" onClick={() => resetForm()} tabIndex={-1} className="flex-1 mr-1">
            Batalkan
          </Button>
          <Button variant="primary" type="submit" className="flex-1 ml-1">
            {values.id ? 'Ubah' : 'Tambah'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ItemToBuyForm;
