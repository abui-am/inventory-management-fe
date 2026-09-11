import { SaleTransactionsData } from '@/typings/sale';

/**
 * Menyimpan fakturnya sebagai berkas PDF, dibangkitkan seluruhnya di browser.
 *
 * Pembangkitnya diimpor secara dinamis: `@react-pdf/renderer` beserta huruf yang
 * disematkan berukuran beberapa ratus kilobyte dan hanya dibutuhkan saat seseorang
 * benar-benar menekan Download, jadi ia tidak boleh ikut di bundel halaman. Impor
 * dinamis sekaligus menjauhkannya dari render di server, tempat ia tidak bisa jalan.
 *
 * Isinya teks sungguhan, bukan gambar: bisa diseleksi, dicari, dan tetap tajam pada
 * perbesaran berapa pun. Pendekatan sebelumnya memotret DOM dengan html2canvas dan
 * hasilnya raster — itu yang membuat garis tabel dan spasinya meleset dari yang
 * terlihat di layar.
 */
export async function downloadInvoice(transaction: SaleTransactionsData, filename: string): Promise<void> {
  const { buildInvoiceBlob } = await import('@/utils/invoicePdf');
  const blob = await buildInvoiceBlob(transaction);

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Tanpa revoke, blob-nya menetap di memori sampai tab ditutup. Ditunda sebentar supaya
  // unduhannya sempat dimulai.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default downloadInvoice;
