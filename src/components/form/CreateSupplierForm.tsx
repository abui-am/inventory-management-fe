/* eslint-disable react-hooks/rules-of-hooks */

import { useFormik } from 'formik';
import { useRouter } from 'next/router';
import React from 'react';
import toast from 'react-hot-toast';

import { Button } from '@/components/Button';
import { PhoneNumberTextField, TextArea, TextField, WithLabelAndError } from '@/components/Form';
import { useCreateSupplier, useEditSupplier, useFetchSupplierById } from '@/hooks/query/useFetchSupplier';
import { CreateSupplierBody, CreateSupplierResponse } from '@/typings/supplier';

import { validationSchemaSupplier } from './constant';

const CreateSupplierForm: React.FC<{
  isEdit?: boolean;
  editId?: string;
  onSave?: (data: CreateSupplierResponse) => void;
  initialValues?: {
    name: string;
    address: string;
    phoneNumber: string;
  };
  disableBack?: boolean;
}> = ({ editId, isEdit = false, onSave, disableBack, initialValues: initVal }) => {
  const { mutateAsync, isLoading: isLoadingMutate } = useCreateSupplier();
  const { mutateAsync: editSupplier } = useEditSupplier(editId ?? '');
  const { back } = useRouter();

  const { data, isLoading } = useFetchSupplierById(editId ?? '', { enabled: isEdit });
  const { name, address, phone_number } = data?.data?.supplier ?? {};
  const initialValues =
    isEdit && !isLoading
      ? {
          name,
          address,
          phoneNumber: phone_number,
        }
      : {
          name: initVal?.name ?? '',
          address: initVal?.address ?? '',
          phoneNumber: initVal?.phoneNumber ?? '',
        };

  const { values, handleChange, setSubmitting, handleSubmit, setFieldValue, errors, touched } = useFormik({
    validationSchema: validationSchemaSupplier,
    initialValues,
    enableReinitialize: isEdit,
    onSubmit: async (values) => {
      setSubmitting(true);

      const jsonBody: CreateSupplierBody = {
        name: values.name ?? '',
        address: values.address ?? '',
        phone_number: values.phoneNumber ?? '',
      };
      const res = isEdit ? await editSupplier(jsonBody) : await mutateAsync(jsonBody);
      setSubmitting(false);
      toast(res.message);
      onSave?.(res.data);
      if (!disableBack) {
        back();
      }
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
              <WithLabelAndError touched={touched} errors={errors} name="name" label="Nama supplier">
                <TextField placeholder="Nama supplier" value={values.name} name="name" onChange={handleChange} />
              </WithLabelAndError>
            </div>
            <div>
              <WithLabelAndError touched={touched} errors={errors} name="phoneNumber" label="Nomor Telepon">
                <PhoneNumberTextField
                  hasError={!!touched.phoneNumber && !!errors.phoneNumber}
                  placeholder="Masukan nomor telepon"
                  value={values.phoneNumber}
                  name="phoneNumber"
                  onChange={(number) => setFieldValue('phoneNumber', number)}
                />
              </WithLabelAndError>
            </div>
            <div className="sm:col-span-2">
              <WithLabelAndError touched={touched} errors={errors} name="address" label="Alamat">
                <TextArea placeholder="Masukan alamat" value={values.address} name="address" onChange={handleChange} />
              </WithLabelAndError>
            </div>
          </div>
        </div>
      </section>
      <div className="mt-8 flex justify-end">
        <div className="flex">
          <Button onClick={() => back()} variant="secondary" className="mr-4">
            Batalkan
          </Button>
          <Button disabled={isLoadingMutate} type="submit">
            {isEdit ? 'Edit Supplier' : 'Tambah Supplier'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default CreateSupplierForm;
