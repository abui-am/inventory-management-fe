import { string } from 'yup';
import { ObjectShape } from 'yup/lib/object';

const schema = (type: string) => {
  switch (type) {
    // Login :
    case 'username':
    case 'password':
      return string().required();

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
