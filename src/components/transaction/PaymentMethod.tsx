import { FormikErrors, FormikTouched } from 'formik';
import { PropsWithChildren } from 'react';
import { TrashFill } from 'react-bootstrap-icons';

import { PAYMENT_METHOD_OPTIONS } from '@/constants/options';
import { useApp } from '@/context/app-context';
import { Option } from '@/typings/common';
import { formatToIDR } from '@/utils/format';

import { Button } from '../Button';
import { Checkbox, CurrencyTextField, DatePickerComponent, ThemedSelect } from '../Form';
import Label from '../Label';

// `paymentDue` bisa datang sebagai string dari API atau Date dari form.
const toDate = (value: Date | string | undefined): Date | null => {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
};

export type Payment = {
  paymentMethod: Option;
  paymentDue: Date | string;
  payAmount: number | '';
};

type PaymentMethodValues = {
  payments: Payment[];
  payFull?: boolean;
};

const PaymentMethod: React.FC<
  PropsWithChildren<{
    index: number;
    values: PaymentMethodValues;
    withPayFull?: boolean;
    totalPrice?: number;
    setFieldValue: (key: string, val: unknown) => void;
    isSubmitting: boolean;
    errors: FormikErrors<PaymentMethodValues>;
    touched: FormikTouched<PaymentMethodValues>;
  }>
> = ({ index, values, setFieldValue, isSubmitting, withPayFull, errors, touched, totalPrice }) => {
  const value = values.payments[index];
  const { paymentDue } = value;
  const {
    state: { hideLabel },
  } = useApp();
  // Formik mengetik error tiap baris array sebagai `string | FormikErrors<Payment>`.
  const paymentError = errors.payments?.[index];
  const payAmountError = typeof paymentError === 'string' ? paymentError : paymentError?.payAmount;
  const handleDelete = () => {
    setFieldValue(
      'payments',
      values.payments.filter((_, i) => i !== index)
    );
  };

  return (
    <>
      <div className="w-1/2 inline mb-2">
        <label className="mb-1 block">Metode pembayaran</label>
        <div className="flex">
          <ThemedSelect
            className="mr-4 !w-full"
            variant="contained"
            name={`payments.[${index}].paymentMethod`}
            onChange={(val) => {
              setFieldValue(`payments.[${index}].paymentMethod`, val);
            }}
            value={value.paymentMethod}
            additionalStyle={{
              control: (provided) => ({ ...provided, minWidth: hideLabel ? 120 : 240 }),
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
              selected={toDate(paymentDue)}
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
          <Checkbox
            checked={values.payFull}
            name="payFull"
            onChange={(e) => {
              setFieldValue(`payments.[${index}].payAmount`, totalPrice);
              setFieldValue('payFull', e.target?.checked);
            }}
          >
            Seluruhnya
          </Checkbox>
        )}
        {payAmountError && touched.payments?.[index]?.payAmount && (
          <span className="text-xs text-red-500">{payAmountError}</span>
        )}
      </div>
    </>
  );
};

export default PaymentMethod;
