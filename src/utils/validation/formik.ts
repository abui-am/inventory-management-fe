import { date, mixed, number, object, ObjectShape, string } from 'yup';

const schema = (type: string) => {
  switch (type) {
    // Login :
    case 'firstName':
    case 'lastName':
    case 'username':
    case 'password':
    case 'address':
    case 'passwordConfirmation':
      return string().required('Wajib diisi');

    case 'invoiceNumber':
      return string();

    case 'nik':
      return string().min(16, 'Harus 16 angka').max(16, 'Harus 16 angka').required('Wajib diisi');

    case 'paymentDue':
    case 'birthday':
    case 'dateIn':
      return date().required();

    case 'province':
    case 'city':
    case 'subdistrict':
    case 'village':
    case 'gender':
    case 'item':
    case 'paymentMethod':
      return object().shape({ label: string(), value: mixed() }).nullable().required('Wajib diisi');

    case 'email':
      return string().matches(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );

    case 'buyPrice':
    case 'qty':
      return number().moreThan(0, 'Harus lebih dari Rp 0').required('Wajib diisi');
    case 'discount':
      return number().moreThan(0, 'Harus lebih dari Rp 0');

    case 'handphoneNumber':
      return string().min(9, 'Minimal 9 angka').max(16, 'Maksimal 16 angka').required('Wajib diisi');

    default:
      return undefined;
  }
};

const createSchema = <T extends Record<any, any>>(initialValues: T): ObjectShape => {
  const fieldNames = Object.keys(initialValues);
  return !Array.isArray(fieldNames) || fieldNames.length === 0
    ? {}
    : fieldNames.reduce((acc, type) => {
        return {
          ...acc,
          [type]: schema(type),
        };
      }, {});
};

export default createSchema;
