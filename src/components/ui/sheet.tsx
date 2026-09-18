import { ArrowLeft, X } from 'lucide-react';
import { ReactNode } from 'react';
import ReactModal from 'react-modal';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

/** Lama animasi keluar di globals.css — react-modal harus menunggu sepanjang itu. */
const CLOSE_DURATION = 220;

/**
 * Panel yang meluncur dari kanan.
 *
 * Diangkat dari `TransactionDetailSheet`, yang tadinya memegang sendiri seluruh
 * cangkangnya. Begitu sheet kedua dibutuhkan (ayat jurnal), menyalin cangkang itu berarti
 * merawat dua salinan aturan yang sama — dan aturannya tidak sepele: `closeTimeoutMS`
 * harus >= durasi transisi, `className` HARUS berbentuk objek (dengan string, react-modal
 * merangkai nama kelas penandanya dari seluruh string kelas Tailwind, yang mustahil
 * ditulis di CSS), dan datanya baru boleh dibuang setelah `onAfterClose`.
 *
 * Sheet kanan, bukan kotak di tengah: daftar di belakangnya tetap terlihat, dan isi
 * sepanjang apa pun bergulir di dalam sheet tanpa mengubah ukurannya.
 */
export function Sheet({
  open,
  onClose,
  onClosed,
  title,
  subtitle,
  badge,
  actions,
  toolbar,
  footer,
  width = 'w-[480px]',
  children,
}: {
  open: boolean;
  /** Dipanggil saat pengguna menutup — sheet mulai menggeser keluar. */
  onClose: () => void;
  /** Dipanggil setelah animasi keluar selesai; di sinilah datanya baru boleh dibuang. */
  onClosed?: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  /**
   * Tombol di kepala, sebelum tombol tutup. Tempatnya aksi yang tersedia pada SEMUA
   * keadaan sheet — mis. Download. Aksi yang bergantung keadaan (mengubah status)
   * tempatnya di `toolbar`, supaya keduanya tidak terbaca setara.
   */
  actions?: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  width?: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <ReactModal
      isOpen={open}
      onRequestClose={onClose}
      closeTimeoutMS={CLOSE_DURATION}
      onAfterClose={onClosed}
      overlayClassName="modal-overlay"
      className={{
        base: cn(
          'sheet fixed inset-y-0 right-0 z-50 flex max-w-full flex-col border-l border-border bg-surface shadow-md outline-none',
          width
        ),
        afterOpen: 'sheet--open',
        beforeClose: 'sheet--closing',
      }}
    >
      <div className="flex h-12 flex-shrink-0 items-center justify-between gap-3 border-b border-border px-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {badge ? (
              <>
                {title}
                {badge}
              </>
            ) : (
              title
            )}
          </div>
          {subtitle && <div className="text-xs text-foreground-subtle">{subtitle}</div>}
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.25">
          {actions}
          {/* Di layar sempit sheet mengisi seluruh layar, dan yang benar di sana adalah
              panah kembali — silang berarti "tutup lapisan di atas", padahal tidak ada
              lagi yang terlihat di belakangnya. */}
          <Button size="icon-xs" variant="ghost" aria-label="Tutup" onClick={onClose}>
            <ArrowLeft strokeWidth={2} aria-hidden className="md:hidden" />
            <X strokeWidth={2} aria-hidden className="hidden md:block" />
          </Button>
        </div>
      </div>

      {toolbar && (
        <div className="flex flex-shrink-0 items-center gap-1.25 border-b border-border px-4 py-1.75">{toolbar}</div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

      {footer}
    </ReactModal>
  );
}

export default Sheet;
