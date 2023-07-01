import { TrashFill } from 'react-bootstrap-icons';

import { PAYMENT_METHOD_OPTIONS } from '@/constants/options';
import { Option } from '@/typings/common';
import { formatToIDR } from '@/utils/format';

import { Button } from '../Button';
import { Checkbox, CurrencyTextField, DatePickerComponent, ThemedSelect } from '../Form';
import Label from '../Label';

export type Payment = {
  paymentMethod: Option;
  paymentDue: Date | string;
  payAmount: number | '';
};

const PaymentMethod: React.FC<{
  index: number;
  values: any;
  withPayFull?: boolean;
  totalPrice?: number;
  setFieldValue: (key: string, val: any) => void;
  isSubmitting: boolean;
  errors: Record<string, any>;
  touched: Record<string, any>;
}> = ({ index, values, setFieldValue, isSubmitting, withPayFull, errors, touched, totalPrice }) => {
  const value = values.payments[index];

  const handleDelete = () => {
    setFieldValue(
      'payments',
      values.payments.filter((_: any, i: number) => i !== index)
    );
  };

  return (
    <>
      <div className="w-1/2 inline mb-2">
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
      <div className="w-1/2 inline mb-2">
        {!values.payFull && (
          <Button variant="secondary" className="ml-auto block mt-4" onClick={handleDelete}>
            <TrashFill className="text-red-600 w-4 h-4" />
          </Button>
        )}
      </div>
      <div className="w-full">
        {(values.payments[index].paymentMethod?.value === PAYMENT_METHOD_OPTIONS[1].value ||
          values.payments[index].paymentMethod?.value === PAYMENT_METHOD_OPTIONS[2].value) && (
          <div className="mb-2">
            <label className="mb-1 block">Tanggal jatuh tempo</label>
            <DatePickerComponent
              name={`payments.[${index}].paymentDue`}
              selected={values.payments[index].paymentDue}
              onChange={(date) => setFieldValue(`payments.[${index}].paymentDue`, date)}
            />
          </div>
        )}
      </div>

      <div className="w-full">
        <Label required>Jumlah</Label>
        {values?.payFull ? (
          <div className="h-16 border rounded-md py-4 px-4 w-full">
            <span className="text-xl text-gray-900 font-bold block">
              <span className="text-gray-500 mr-3">IDR</span>
              {formatToIDR(totalPrice ?? 0)}
            </span>
          </div>
        ) : (
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
        )}
        {withPayFull && values?.payments.length === 1 && (
          <div className="flex mt-2 items-center mb-2">
            <Checkbox
              checked={values.payFull}
              name="payFull"
              onChange={(e: any) => {
                setFieldValue('payFull', e.target?.checked);
              }}
            />
            <label className="text-base ml-1">Lunas</label>
          </div>
        )}
        {errors.payments?.[index]?.payAmount && touched.payments?.[index]?.payAmount && (
          <span className="text-xs text-red-500">{errors.payments[index].payAmount}</span>
        )}
      </div>
    </>
  );
};

export default PaymentMethod;
