import { date, mixed, object, string } from 'yup';
import { ObjectShape } from 'yup/lib/object';

const schema = (type: string) => {
  switch (type) {
    // Login :
    case 'email':
    case 'username':
    case 'password':
    case 'passwordConfirmation':
      return string().required('Wajib diisi');

    case 'birthday':
      return date().required();

    case 'province':
    case 'city':
    case 'subdistrict':
    case 'village':
      return object().shape({ label: string(), value: mixed() });

    default:
      return undefined;
  }
};

const createSchema = <T>(initialValues: T): ObjectShape => {
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
