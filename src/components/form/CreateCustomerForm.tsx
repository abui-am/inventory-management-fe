import { useFormik } from 'formik';
import React from 'react';
import toast from 'react-hot-toast';

import { useCreateCustomer, useEditCustomer } from '@/hooks/mutation/useMutateCustomer';
import { CreateCustomerBody, CreateCustomerResponse } from '@/typings/customer';

import { Button } from '../Button';
import { PhoneNumberTextField, TextArea, TextField, WithLabelAndError } from '../Form';
import { validationSchemaCustomer } from './constant';

export type CreateCustomerFormValues = {
  fullName: string;
  phoneNumber: string;
  address: string;
};

const CreateCustomerForm: React.FC<{
  customerId?: string;
  initialValues: CreateCustomerFormValues;
  onSave: (data: CreateCustomerResponse) => void;
  onClose: () => void;
}> = ({ onClose, customerId, initialValues: _initValues, onSave }) => {
  const { mutateAsync, isLoading: isLoadingMutate } = useCreateCustomer();
  const { mutateAsync: editCustomer } = useEditCustomer(customerId ?? '');
  const initialValues = {
    fullName: _initValues.fullName ?? '',
    phoneNumber: _initValues.phoneNumber ?? '',
    address: _initValues.address ?? '',
  };

  const isEdit = !!customerId;

  const { values, handleChange, setSubmitting, handleSubmit, setFieldValue, errors, touched } = useFormik({
    validationSchema: validationSchemaCustomer,
    initialValues,
    enableReinitialize: isEdit,
    onSubmit: async (values, { resetForm }) => {
      setSubmitting(true);
      const jsonBody: CreateCustomerBody = {
        full_name: values.fullName,
        phone_number: values.phoneNumber,
        address: values.address,
      };
      const res = isEdit ? await editCustomer(jsonBody) : await mutateAsync(jsonBody);
      setSubmitting(false);
      resetForm();
      onSave?.(res.data);
      toast(res.message);
    },
  });

  return (
    <form onSubmit={handleSubmit} noValidate>
      <section className="max-w-4xl mr-auto ml-auto">
        <div className="mb-4">
          <h6 className="mb-3 text-lg font-bold">Informasi Umum</h6>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <WithLabelAndError touched={touched} errors={errors} name="fullName" label="Nama customer">
                <TextField
                  placeholder="Nama customer"
                  value={values.fullName}
                  name="fullName"
                  onChange={handleChange}
                />
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
          <Button onClick={onClose} variant="secondary" className="mr-4">
            Batalkan
          </Button>
          <Button disabled={isLoadingMutate} type="submit">
            {isEdit ? 'Edit Customer' : 'Tambah Customer'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default CreateCustomerForm;
