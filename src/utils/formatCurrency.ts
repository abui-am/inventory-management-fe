type Props = {
  value: number;
  locale?: string;
  prefix?: string;
};

const formatCurrency = ({ value, locale = 'id', prefix = 'IDR' }: Props) => {
  if (!value) return '';
  const formatted = new Intl.NumberFormat(locale).format(value);
  return `${prefix !== 'none' ? `${prefix} ` : ''}${formatted}`;
};

export default formatCurrency;
