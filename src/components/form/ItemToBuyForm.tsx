import { useFormik } from 'formik';
import React from 'react';
import toast from 'react-hot-toast';
import { v4 } from 'uuid';

import { Item } from '@/typings/item';
import { validationSchemaItem } from '@/utils/validation/transaction';

import { Button } from '../Button';
import { SelectItemsDetail, TextField, WithLabelAndError } from '../Form';

export type ItemToBuyFormValues = {
  item: { label: string; value: string; data: Item } | null;
  qty: number | '';
  id: string | '';
  maxQty?: number;
};

const ItemToBuyForm: React.FC<{
  initValues?: ItemToBuyFormValues;
  onSave: (values: ItemToBuyFormValues, action: 'create' | 'edit') => void;
  onReset?: () => void;
}> = ({ initValues, onSave, onReset }) => {
  const initialValues = {
    item: initValues?.item || null,
    qty: initValues?.qty || '',
    id: initValues?.id || '',
    maxQty: initValues?.item?.data?.quantity || 0,
  };

  const { values, handleChange, handleSubmit, resetForm, setFieldValue, errors, touched } = useFormik({
    validationSchema: validationSchemaItem,
    initialValues,
    enableReinitialize: !!initValues,
    onSubmit: async (values, { resetForm }) => {
      if ((values.item, values.qty)) {
        if (onSave) {
          if (!values.id) {
            onSave(
              {
                item: values.item,
                qty: +values.qty,
                id: v4(),
              },
              'create'
            );
            toast.success(`${values.qty} ${values?.item?.label} berhasil ditambahkan`);
          } else {
            onSave(
              {
                item: values?.item,
                qty: +values.qty,
                id: values.id,
              },
              'edit'
            );
            toast.success(`Barang ${values?.item?.label} berhasil diedit`);
          }
          resetForm();
        }
      } else {
        toast.error('Isi item dan qty');
      }
    },
  });

  return (
    <div>
      <div className="flex -mx-2 flex-wrap mb-1">
        <div className="mb-3 px-2 w-8/12">
          <WithLabelAndError label="Nama barang" name="item" errors={errors} touched={touched}>
            <SelectItemsDetail
              isDisabled={initValues}
              onChange={(val: never) => {
                const data: { label: string; value: string; data: Item } = val as never;
                setFieldValue(`item`, data);
                setFieldValue('maxQty', data?.data?.quantity);
              }}
              withDetail
              value={values.item}
            />
          </WithLabelAndError>
        </div>

        <div className="w-4/12 mb-3 px-2">
          <WithLabelAndError label="Jumlah yang dibeli" name="qty" errors={errors} touched={touched}>
            <TextField name="qty" value={values.qty} onChange={handleChange} placeholder="0" type="number" />
            <small className="text-gray-600 block">Pastikan jumlah yang dibeli dibawah stock</small>
          </WithLabelAndError>
        </div>
      </div>

      <div className="flex justify-end pt-4 mt-4 border-t border-gray-300">
        <div className="flex">
          <Button
            variant="secondary"
            onClick={() => {
              if (onReset) onReset();
              resetForm();
            }}
            tabIndex={-1}
            className="flex-1 mr-1"
          >
            Batalkan
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              handleSubmit();
            }}
            className="flex-1 ml-1"
          >
            {values.id ? 'Ubah' : 'Tambah'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ItemToBuyForm;
