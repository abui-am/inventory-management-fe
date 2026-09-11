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
 * Piutang berjalan customer, plus proyeksi setelah transaksi ini disimpan.
 *
 * Ini pertanyaan yang benar-benar dibawa kasir sebelum menekan simpan: boleh tidak
 * orang ini menambah utang lagi. `total_debt` sudah ikut di respons daftar customer
 * yang memang sudah diambil select-nya, jadi kartu ini tidak menambah satu pun request.
 */
export function CustomerReceivableCard({
  name,
  currentDebt,
  creditThisTransaction,
}: {
  name?: string;
  currentDebt: number;
  creditThisTransaction: number;
}): JSX.Element {
  // Kartunya tetap berdiri walau customer belum dipilih. Kalau ia muncul-hilang, rel
  // kanan berubah tinggi tiap kali dan tombol simpan ikut melompat.
  if (!name) {
    return (
      <div className="flex flex-col gap-2.5 rounded-card border border-border bg-surface px-3.75 py-3.25 shadow-sm">
        <span className="text-base font-semibold">Customer</span>
        <span className="text-sm leading-[17px] text-foreground-muted">
          Pilih customer untuk melihat piutang berjalannya.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-card border border-border bg-surface px-3.75 py-3.25 shadow-sm">
      <span className="text-base font-semibold">Customer</span>

      <div className="flex flex-col gap-1.5">
        <div className="text-base">{name}</div>
        <Row label="Piutang berjalan" value={formatNumber(currentDebt)} color="warning" />
        <Row label="Transaksi ini (kredit)" value={`+${formatNumber(creditThisTransaction)}`} />
        <div className="h-px bg-border-subtle" />
        <Row
          label="Total setelah simpan"
          value={formatNumber(currentDebt + creditThisTransaction)}
          color="warning"
          bold
        />
      </div>

      <span className="text-2xs leading-[15px] text-foreground-subtle">
        Hanya bagian yang dibayar Utang atau Giro yang menambah piutang.
      </span>
    </div>
  );
}

export default CustomerReceivableCard;
