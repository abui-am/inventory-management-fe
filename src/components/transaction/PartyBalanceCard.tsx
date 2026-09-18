import { cn } from '@/lib/cn';

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

function Row({
  label,
  value,
  color,
  bold,
}: {
  label: string;
  value: string;
  color?: 'warning';
  bold?: boolean;
}): JSX.Element {
  return (
    <div className="flex items-baseline justify-between text-sm">
      <span className="text-foreground-muted">{label}</span>
      <span
        className={cn(
          'font-mono tabular-nums',
          bold ? 'font-semibold' : 'font-medium',
          color === 'warning' && 'text-warning'
        )}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Dua sisi dari kartu yang sama. Penjualan meninggalkan PIUTANG pada customer, barang
 * masuk meninggalkan UTANG pada kita — angkanya dihitung persis sama, hanya arah dan
 * namanya yang berbeda, jadi kartunya satu.
 */
const KATA = {
  customer: {
    judul: 'Customer',
    kosong: 'Pilih customer untuk melihat piutang berjalannya.',
    berjalan: 'Piutang berjalan',
    transaksi: 'Transaksi ini (kredit)',
    catatan: 'Hanya bagian yang dibayar Utang atau Giro yang menambah piutang.',
  },
  supplier: {
    judul: 'Supplier',
    kosong: 'Pilih supplier untuk melihat utang berjalannya.',
    berjalan: 'Utang berjalan',
    transaksi: 'Barang masuk ini (kredit)',
    catatan: 'Hanya bagian yang dibayar Utang atau Giro yang menambah utang.',
  },
} as const;

/**
 * Saldo berjalan lawan transaksi, plus proyeksi setelah transaksi ini disimpan.
 *
 * Ini pertanyaan yang benar-benar dibawa orang sebelum menekan simpan: boleh tidak
 * menambah utang lagi pada pihak ini. Angkanya sudah ikut di respons daftar yang memang
 * sudah diambil select-nya, jadi kartu ini tidak menambah satu pun request.
 */
export function PartyBalanceCard({
  variant,
  name,
  currentDebt,
  creditThisTransaction,
}: {
  variant: 'customer' | 'supplier';
  name?: string;
  currentDebt: number;
  creditThisTransaction: number;
}): JSX.Element {
  const kata = KATA[variant];

  // Kartunya tetap berdiri walau pihaknya belum dipilih. Kalau ia muncul-hilang, rel
  // kanan berubah tinggi tiap kali dan tombol simpan ikut melompat.
  if (!name) {
    return (
      <div className="flex flex-col gap-2.5 rounded-card border border-border bg-surface px-3.75 py-3.25 shadow-sm">
        <span className="text-base font-semibold">{kata.judul}</span>
        <span className="text-sm leading-[17px] text-foreground-muted">{kata.kosong}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-card border border-border bg-surface px-3.75 py-3.25 shadow-sm">
      <span className="text-base font-semibold">{kata.judul}</span>

      <div className="flex flex-col gap-1.5">
        <div className="text-base">{name}</div>
        <Row label={kata.berjalan} value={formatNumber(currentDebt)} color="warning" />
        <Row label={kata.transaksi} value={`+${formatNumber(creditThisTransaction)}`} />
        <div className="h-px bg-border-subtle" />
        <Row
          label="Total setelah simpan"
          value={formatNumber(currentDebt + creditThisTransaction)}
          color="warning"
          bold
        />
      </div>

      <span className="text-2xs leading-[15px] text-foreground-subtle">{kata.catatan}</span>
    </div>
  );
}

export default PartyBalanceCard;
