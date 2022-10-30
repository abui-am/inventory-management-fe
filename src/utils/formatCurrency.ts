type Props = {
  value: number;
  locale?: string;
  prefix?: string;
};

const formatCurrency = ({ value, locale = 'id', prefix = 'IDR' }: Props) => {
  if (!value && value !== 0) return '';
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${prefix !== 'none' ? `${prefix} ` : ''}${formatted}`;
};

export default formatCurrency;
