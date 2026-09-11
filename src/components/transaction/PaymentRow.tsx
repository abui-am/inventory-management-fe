import { X } from 'lucide-react';

import { CurrencyTextField, DatePickerComponent, ThemedSelect } from '@/components/Form';
import { Button } from '@/components/ui/button';
import { METHODS_WITH_DUE_DATE, PAYMENT_METHOD_COLOR, PAYMENT_METHOD_OPTIONS } from '@/constants/options';
import { Option } from '@/typings/common';
import { AdditionalStyle, controlStyle } from '@/utils/style';

import { Payment } from './PaymentMethod';

/** `paymentDue` bisa datang sebagai string dari API atau Date dari form. */
const toDate = (value: Date | string | undefined): Date | null => {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
};

const t = (nama: string) => `hsl(var(--${nama}))`;

/**
 * Metode bayar tampil sebagai pill berwarna, bukan kotak select biasa: warnanya
 * menyampaikan akibat pembayaran pada piutang, dan barisnya jadi bisa dipindai
 * tanpa membaca satu kata pun.
 *
 * Chevron-nya tetap ada — tanpa itu pill terlihat seperti label mati dan tidak ada
 * yang tahu metodenya masih bisa diganti.
 */
const pillStyle = (color: string): AdditionalStyle => ({
  ...controlStyle,
  control: (base, state) => ({
    ...(controlStyle.control as (b: unknown, s: unknown) => object)(base, state),
    border: 'none',
    cursor: 'pointer',
    backgroundColor: t(`${color}-subtle`),
    boxShadow: state.isFocused ? `0 0 0 2px hsl(var(--ring) / 0.35)` : 'none',
  }),
  valueContainer: (base) => ({ ...base, padding: '0 0 0 9px' }),
  singleValue: (base) => ({ ...base, color: t(color), fontSize: 12, fontWeight: 600 }),
  dropdownIndicator: (base) => ({
    ...base,
    padding: 4,
    color: t(color),
    '&:hover': { color: t(color) },
  }),
  menu: (base) => ({ ...base, minWidth: 132 }),
});

/**
 * Satu baris pembayaran, padat: metode - jumlah - jatuh tempo - hapus.
 *
 * Menggantikan blok dua kolom lama yang memakai satu kartu penuh per metode. Dua
 * metode di layar itu hal yang lumrah di sini, dan dua kartu besar mendorong ringkasan
 * dan tombol simpan keluar dari layar.
 */
export function PaymentRow({
  value,
  onChange,
  onDelete,
  disabled,
  fixedAmount,
  error,
}: {
  value: Payment;
  onChange: (patch: Partial<Payment>) => void;
  onDelete?: () => void;
  disabled?: boolean;
  /** Diisi saat "Seluruhnya" aktif: jumlahnya mengikuti total dan tidak bisa diketik. */
  fixedAmount?: number;
  error?: string;
}): JSX.Element {
  const method = value.paymentMethod?.value as string;
  const color = PAYMENT_METHOD_COLOR[method] ?? 'success';
  const hasDueDate = METHODS_WITH_DUE_DATE.includes(method);

  return (
    <div className="border-b border-border-subtle px-3.25 py-1.75">
      <div className="flex items-center gap-2.25">
        <ThemedSelect
          className="w-[92px] shrink-0"
          name={`payments-${method}-method`}
          aria-label="Metode pembayaran"
          isDisabled={disabled}
          value={value.paymentMethod}
          options={PAYMENT_METHOD_OPTIONS}
          additionalStyle={pillStyle(color)}
          onChange={(val) => onChange({ paymentMethod: val as Option, paymentDue: new Date() })}
        />

        {fixedAmount === undefined ? (
          <CurrencyTextField
            name={`payments-${method}-amount`}
            aria-label="Jumlah dibayar"
            value={value.payAmount}
            placeholder="0"
            prefix=""
            disabled={disabled}
            aria-invalid={!!error || undefined}
            className="h-8 min-w-0 flex-1 rounded-control px-2.5 text-right font-mono font-semibold"
            onChange={(val) => onChange({ payAmount: val ?? '' })}
          />
        ) : (
          <div className="flex h-8 flex-1 items-center justify-end rounded-control border border-border bg-surface-raised px-2.5 font-mono text-base font-semibold tabular-nums">
            {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(fixedAmount)}
          </div>
        )}

        {hasDueDate ? (
          // Pembungkus lebarnya harus dipatok: `.customDatePickerWidth` milik komponennya
          // adalah `width:100%`, jadi sebagai item flex ia melahap seluruh baris dan kolom
          // jumlah menyusut sampai hilang.
          <div className="w-32 shrink-0">
            <DatePickerComponent
              name={`payments-${method}-due`}
              selected={toDate(value.paymentDue)}
              disabled={disabled}
              className="h-8 rounded-control pl-8 pr-2.5 font-mono text-sm"
              onChange={(date) => onChange({ paymentDue: date as Date })}
            />
          </div>
        ) : (
          // Kotak selebar datepicker walau kosong: tanpa ini kolom jumlah ikut melebar
          // saat metode diganti dari Giro ke Kas, dan seluruh baris bergeser.
          <div className="w-32 shrink-0 text-right text-xs text-foreground-subtle">—</div>
        )}

        {onDelete && (
          <Button size="icon-sm" variant="outline" aria-label="Hapus method pembayaran" onClick={onDelete}>
            <X strokeWidth={2} aria-hidden />
          </Button>
        )}
      </div>

      {error && (
        <span className="mt-1 block text-sm text-destructive" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export default PaymentRow;
