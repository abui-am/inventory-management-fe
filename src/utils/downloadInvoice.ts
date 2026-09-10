/**
 * Menyimpan blob PDF sebagai berkas.
 *
 * `printInvoice` di sebelah namanya menyesatkan: tombolnya bertuliskan "Download
 * Invoice" tapi kode unduhnya dikomentari, jadi yang jalan hanya dialog cetak.
 * Sekarang keduanya terpisah — Print membuka dialog cetak, Download menyimpan berkas.
 */
const downloadInvoice = (file: string, filename: string): void => {
  const url = window.URL.createObjectURL(new Blob([file], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Tanpa revoke, blob-nya menetap di memori sampai tab ditutup — dan satu PDF faktur
  // bisa ratusan kilobyte. Ditunda sebentar supaya unduhannya sempat dimulai.
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};

export default downloadInvoice;
