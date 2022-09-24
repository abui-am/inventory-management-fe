import { TrashFill } from 'react-bootstrap-icons';

import { PAYMENT_METHOD_OPTIONS } from '@/constants/options';
import { Option } from '@/typings/common';

import { Button } from '../Button';
import { CurrencyTextField, DatePickerComponent, ThemedSelect } from '../Form';
import Label from '../Label';

export type Payment = {
  paymentMethod: Option;
  paymentDue: Date | string;
  payAmount: number | null;
};

const PaymentMethod: React.FC<{
  index: number;
  values: any;

  setFieldValue: (key: string, val: any) => void;
  isSubmitting: boolean;
  errors: Record<string, any>;
  touched: Record<string, any>;
}> = ({ index, values, setFieldValue, isSubmitting, errors, touched }) => {
  const value = values.payments[index];

  const handleDelete = () => {
    setFieldValue(
      'payments',
      values.payments.filter((_: any, i: number) => i !== index)
    );
  };

  return (
    <>
      <div className="w-1/2 inline mb-4">
        <label className="mb-1 block">Metode pembayaran</label>
        <div className="flex">
          <ThemedSelect
            className="mr-4"
            variant="contained"
            name={`payments.[${index}].paymentMethod`}
            onChange={(val) => {
              setFieldValue(`payments.[${index}].paymentMethod`, val);
            }}
            value={value.paymentMethod}
            additionalStyle={{
              control: (provided) => ({ ...provided, minWidth: 240 }),
            }}
            options={PAYMENT_METHOD_OPTIONS}
          />
        </div>
      </div>

      <div className="w-1/2 inline mb-4">
        <Button variant="secondary" className="ml-auto block mt-4" onClick={handleDelete}>
          <TrashFill className="text-red-600 w-4 h-4" />
        </Button>
      </div>
      <div className="w-full">
        {(values.payments[index].paymentMethod?.value === PAYMENT_METHOD_OPTIONS[1].value ||
          values.payments[index].paymentMethod?.value === PAYMENT_METHOD_OPTIONS[2].value) && (
          <DatePickerComponent
            name={`payments.[${index}].paymentDue`}
            selected={values.payments[index].paymentDue}
            onChange={(date) => setFieldValue(`payments.[${index}].paymentDue`, date)}
          />
        )}
      </div>

      <div className="w-full  mb-3">
        <Label required>Uang yang dibayarkan</Label>
        <CurrencyTextField
          id="payAmount"
          name={`payments.[${index}].payAmount`}
          value={value.payAmount}
          placeholder="Masukan jumlah bayaran"
          disabled={isSubmitting}
          onChange={(val) => {
            setFieldValue(`payments.[${index}].payAmount`, val);
          }}
        />
        {errors.payments?.[index]?.payAmount && touched.payments?.[index]?.payAmount && (
          <span className="text-xs text-red-500">{errors.payments[index].payAmount}</span>
        )}
      </div>
    </>
  );
};

export default PaymentMethod;
