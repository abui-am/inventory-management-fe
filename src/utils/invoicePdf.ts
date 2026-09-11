import type { jsPDF as JsPDFType } from 'jspdf';

import { SaleTransactionsData } from '@/typings/sale';
import { formatPaymentMethod } from '@/utils/format';

/**
 * Identitas toko untuk kop faktur.
 *
 * GANTI SEBELUM FAKTUR DIPAKAI KE PELANGGAN. Alamat dan nomor di bawah masih contoh
 * dari berkas desain — bukan milik toko yang sebenarnya — dan keduanya tercetak di
 * dokumen yang dibawa pembeli. Dikosongkan pun aman: baris kosong tidak dirender.
 *
 * Backend belum punya endpoint pengaturan toko; begitu ada, ambil dari sana.
 */
export const STORE_IDENTITY = {
  name: 'Toko Putra Pribumi',
  address: 'Jl. Raya Pasar No. 12, Cilacap',
  phone: '0812-3456-7890',
};

/** A5 potret, dalam milimeter. */
const PAGE = { width: 148, height: 210 };
const M = { left: 12, right: 12, top: 13 };
const RIGHT = PAGE.width - M.right;
const INNER = PAGE.width - M.left - M.right;

const INK: [number, number, number] = [26, 26, 35];
const MUTED: [number, number, number] = [102, 102, 102];
const FAINT: [number, number, number] = [136, 136, 136];
const LINE: [number, number, number] = [230, 230, 234];

const idr = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n ?? 0);
const joinName = (first?: string, last?: string) => [first, last].filter(Boolean).join(' ').trim();

/**
 * Huruf disertakan dari `public/fonts`, bukan diambil dari Google Fonts saat itu juga.
 *
 * Dua alasan: faktur harus tetap bisa dibuat walau jaringan mati — kasir tidak boleh
 * gagal membuat faktur karena CDN tak terjangkau; dan `css2` milik Google mengirim woff2
 * ke browser modern, sementara jsPDF hanya paham TTF.
 *
 * Hasil unduhannya disimpan supaya faktur kedua dan seterusnya tidak mengambil ulang.
 */
const fontCache = new Map<string, string>();

const toBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let biner = '';
  // Dicicil 8KB dan tanpa spread: `String.fromCharCode(...bytes)` pada berkas 100KB
  // melampaui batas jumlah argumen dan melempar RangeError, sementara menyebar
  // Uint8Array butuh downlevelIteration yang tidak dinyalakan proyek ini.
  for (let i = 0; i < bytes.length; i += 8192) {
    biner += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 8192)));
  }
  return btoa(biner);
};

const loadFont = async (doc: JsPDFType, file: string, family: string, style: string) => {
  let base64 = fontCache.get(file);
  if (!base64) {
    base64 = toBase64(await fetch(`/fonts/${file}`).then((r) => r.arrayBuffer()));
    fontCache.set(file, base64);
  }
  doc.addFileToVFS(file, base64);
  doc.addFont(file, family, style);
};

type Doc = JsPDFType;

const text = (
  doc: Doc,
  value: string,
  x: number,
  y: number,
  opt: {
    size?: number;
    font?: 'sans' | 'mono';
    style?: string;
    color?: [number, number, number];
    align?: 'left' | 'right' | 'center';
  } = {}
) => {
  doc.setFont(opt.font === 'mono' ? 'Mono' : 'Sans', opt.style ?? 'normal');
  doc.setFontSize(opt.size ?? 8);
  doc.setTextColor(...(opt.color ?? INK));
  doc.text(value, x, y, { align: opt.align ?? 'left' });
};

const rule = (doc: Doc, y: number, color: [number, number, number], width: number) => {
  doc.setDrawColor(...color);
  doc.setLineWidth(width);
  doc.line(M.left, y, RIGHT, y);
};

/**
 * Faktur A5, diturunkan dari artboard `Struk.dc.html` tapi dirapatkan.
 *
 * Yang berubah dari artboard: kotak Pembayaran pindah ke SEBELAH ringkasan, bukan di
 * bawahnya. Di artboard keduanya bertumpuk — kotak pembayaran melebar penuh sementara
 * ringkasan menyisakan separuh baris kosong di kirinya — dan halamannya jadi panjang.
 * Berdampingan, keduanya mengisi lebar yang sama dan bagian bawah faktur memendek
 * sekitar sepertiga tanpa satu pun elemen jadi berdesakan.
 *
 * Digambar dengan API teks jsPDF, bukan dipotret dari DOM: hasilnya teks sungguhan yang
 * bisa diseleksi dan dicari, tajam pada perbesaran berapa pun, dan berkasnya puluhan —
 * bukan ratusan — kilobyte.
 */
export async function buildInvoiceBlob(transaction: SaleTransactionsData): Promise<Blob> {
  // Dialias huruf besar: `jsPDF` diawali huruf kecil dan `new` atas nama huruf kecil
  // ditolak aturan lint `new-cap`.
  const { jsPDF: JsPDF } = await import('jspdf');
  const doc = new JsPDF({ unit: 'mm', format: [PAGE.width, PAGE.height], orientation: 'portrait' });

  await Promise.all([
    loadFont(doc, 'PlusJakartaSans-Regular.ttf', 'Sans', 'normal'),
    loadFont(doc, 'PlusJakartaSans-SemiBold.ttf', 'Sans', 'bold'),
    loadFont(doc, 'JetBrainsMono-Regular.ttf', 'Mono', 'normal'),
    loadFont(doc, 'JetBrainsMono-SemiBold.ttf', 'Mono', 'bold'),
  ]);

  const items = transaction.items ?? [];
  const subtotal = items.reduce((sum, item) => sum + (item.pivot?.total_price ?? 0), 0);
  const discount = transaction.discount ?? 0;
  const shippingCost = transaction.shipping_cost ?? 0;
  const total = subtotal - discount + shippingCost;
  const cashier = joinName(transaction.pic?.employee?.first_name, transaction.pic?.employee?.last_name);
  const payments = transaction.payments ?? [];

  // ── kop ────────────────────────────────────────────────────────────────────
  let y = M.top + 3;
  text(doc, STORE_IDENTITY.name, M.left, y, { size: 13, style: 'bold' });
  text(doc, 'FAKTUR', RIGHT, y, { size: 14, style: 'bold', align: 'right' });

  let kopY = y + 4.2;
  if (STORE_IDENTITY.address) {
    text(doc, STORE_IDENTITY.address, M.left, kopY, { size: 7.5, color: MUTED });
    kopY += 3.4;
  }
  if (STORE_IDENTITY.phone) text(doc, STORE_IDENTITY.phone, M.left, kopY, { size: 7.5, color: MUTED });
  text(doc, transaction.invoice_number ?? '-', RIGHT, y + 4.2, { size: 8.5, font: 'mono', align: 'right' });

  y = Math.max(kopY, y + 4.2) + 3.4;
  rule(doc, y, INK, 0.5);

  // ── ditagihkan kepada + keterangan ─────────────────────────────────────────
  y += 5.5;
  text(doc, 'DITAGIHKAN KEPADA', M.left, y, { size: 5.6, style: 'bold', color: FAINT });
  text(doc, transaction.customer?.full_name ?? 'Umum', M.left, y + 4.4, { size: 9.5, style: 'bold' });
  if (transaction.customer?.address) {
    text(doc, transaction.customer.address, M.left, y + 8.2, { size: 7.5, color: MUTED });
  }

  const metaX = RIGHT - 46;
  const meta: [string, string][] = [
    ['Tanggal', new Date(transaction.purchase_date ?? transaction.created_at).toLocaleDateString('id-ID')],
    ['Kode', transaction.transaction_code],
  ];
  if (cashier) meta.push(['Kasir', cashier]);
  meta.forEach(([label, value], i) => {
    const my = y + i * 4;
    text(doc, label, metaX, my, { size: 7.5, color: MUTED });
    text(doc, value, RIGHT, my, { size: 7.5, font: label === 'Kasir' ? 'sans' : 'mono', align: 'right' });
  });

  y = Math.max(y + 8.2, y + meta.length * 4) + 5;

  // ── tabel barang ───────────────────────────────────────────────────────────
  const col = { no: M.left, name: M.left + 6, qty: M.left + 78, price: M.left + 104, total: RIGHT };
  text(doc, '#', col.no, y, { size: 5.6, style: 'bold', color: FAINT });
  text(doc, 'BARANG', col.name, y, { size: 5.6, style: 'bold', color: FAINT });
  text(doc, 'JUMLAH', col.qty, y, { size: 5.6, style: 'bold', color: FAINT, align: 'right' });
  text(doc, 'HARGA', col.price, y, { size: 5.6, style: 'bold', color: FAINT, align: 'right' });
  text(doc, 'TOTAL', col.total, y, { size: 5.6, style: 'bold', color: FAINT, align: 'right' });
  y += 2;
  rule(doc, y, INK, 0.3);

  // Tinggi satu baris tetap 7.4mm (garis ke garis); yang diatur letak baseline di dalamnya.
  //
  // Yang dipusatkan adalah pita HURUF BESAR, bukan seluruh kotak tinta sampai ujung ekor
  // huruf. Percobaan sebelumnya memusatkan kotak tinta penuh dan hasilnya justru terlihat
  // naik: satu baris di sini isinya tiga kolom angka melawan satu kolom nama, dan angka
  // tidak punya ekor sama sekali — jadi seluruh baris terdorong ke atas sebanyak separuh
  // tinggi ekor yang cuma dimiliki satu kolom. Ekor huruf memang wajar menggantung.
  //
  // Angkanya dibaca langsung dari tabel OS/2 berkas huruf yang disematkan di
  // `public/fonts` (unitsPerEm 1000), bukan dari pengukuran canvas: canvas diam-diam
  // memakai huruf pengganti kalau yang diminta belum termuat di tab itu, dan hasilnya
  // pernah berbeda 10% antar halaman tanpa tanda apa pun.
  //
  //   Plus Jakarta Sans  sCapHeight 745/1000 = 0.745em
  //   JetBrains Mono     sCapHeight 730/1000 = 0.730em
  //
  //   8pt = 2.8222mm  →  huruf besar sans = 2.103mm
  //   sisa = 7.4 − 2.103 = 5.297  →  2.65mm di atas dan di bawah pita huruf besar
  //   baseline = 2.65 + 2.103 = 4.75mm dari garis atas, sisanya 2.65mm ke garis bawah
  //
  // Hasil untuk angka mono (huruf besar 2.060mm, tanpa ekor): 2.69mm di atas, 2.65mm di
  // bawah — praktis rata tengah, dan itulah yang paling terbaca di baris ini.
  const BASELINE_DARI_GARIS_ATAS = 4.75;
  const GARIS_BAWAH_DARI_BASELINE = 2.65;

  items.forEach((item, index) => {
    const p = item.pivot;
    y += BASELINE_DARI_GARIS_ATAS;
    text(doc, String(index + 1), col.no, y, { size: 8, color: MUTED });
    text(doc, p?.item_name ?? item.name ?? '', col.name, y, { size: 8 });
    text(doc, `${p?.quantity ?? 0} ${p?.item_unit ?? item.unit ?? ''}`, col.qty, y, {
      size: 8,
      font: 'mono',
      align: 'right',
    });
    text(doc, idr(p?.purchase_price ?? 0), col.price, y, { size: 8, font: 'mono', align: 'right' });
    text(doc, idr(p?.total_price ?? 0), col.total, y, { size: 8, font: 'mono', style: 'bold', align: 'right' });
    y += GARIS_BAWAH_DARI_BASELINE;
    rule(doc, y, LINE, 0.2);
  });

  // ── pembayaran (kiri) berdampingan dengan ringkasan (kanan) ────────────────
  y += 6;
  const boxW = INNER - 52 - 6;
  const boxH = 8 + payments.length * 4.4;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.2);
  doc.roundedRect(M.left, y - 3.4, boxW, boxH, 1, 1);
  text(doc, 'PEMBAYARAN', M.left + 3, y, { size: 5.6, style: 'bold', color: FAINT });
  payments.forEach((payment, i) => {
    const py = y + 4.4 + i * 4.4;
    const tempo = payment.maturity_date
      ? ` · jatuh tempo ${new Date(payment.maturity_date).toLocaleDateString('id-ID')}`
      : '';
    text(doc, `${formatPaymentMethod(payment.payment_method)}${tempo}`, M.left + 3, py, { size: 7.5 });
    text(doc, idr(payment.payment_price ?? 0), M.left + boxW - 3, py, {
      size: 7.5,
      font: 'mono',
      style: 'bold',
      align: 'right',
    });
  });

  const sumX = RIGHT - 52;
  let sy = y;
  (
    [
      ['Subtotal', subtotal],
      ['Diskon', discount],
      ['Ongkos kirim', shippingCost],
    ] as [string, number][]
  ).forEach(([label, value]) => {
    text(doc, label, sumX, sy, { size: 8, color: MUTED });
    text(doc, idr(value), RIGHT, sy, { size: 8, font: 'mono', align: 'right' });
    sy += 4.4;
  });
  // Garis pemisah sebelum Total, dengan ruang bersih yang sama di atas dan di bawahnya:
  // 2.2mm dari TINTA ke garis, bukan dari baseline.
  //
  //   di atas : baseline "Ongkos kirim" + ekor 0.222em×2.8222 = 0.63mm, + 2.2 → 2.83mm
  //   di bawah: garis + 2.2 + huruf besar "Total" 10.5pt (0.745em×3.7042 = 2.76mm) → 4.96mm
  //
  // Sebelumnya 1.19mm di atas dan 1.24mm di bawah — "Total" menempel di garisnya.
  const barisTerakhir = sy - 4.4;
  const garisTotal = barisTerakhir + 2.83;
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.3);
  doc.line(sumX, garisTotal, RIGHT, garisTotal);
  sy = garisTotal + 4.96;
  text(doc, 'Total', sumX, sy, { size: 10.5, style: 'bold' });
  text(doc, `Rp ${idr(total)}`, RIGHT, sy, { size: 10.5, font: 'mono', style: 'bold', align: 'right' });

  y = Math.max(y - 3.4 + boxH, sy) + 7;

  if (transaction.note) {
    text(doc, `Catatan: ${transaction.note}`, M.left, y, { size: 7.5, color: MUTED });
    y += 6;
  }

  // ── tanda tangan ───────────────────────────────────────────────────────────
  y += 14;
  const signW = 44;
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.25);
  doc.line(M.left, y, M.left + signW, y);
  doc.line(RIGHT - signW, y, RIGHT, y);
  text(doc, 'Penerima', M.left + signW / 2, y + 4, { size: 7.5, color: MUTED, align: 'center' });
  text(doc, 'Hormat kami', RIGHT - signW / 2, y + 4, { size: 7.5, color: MUTED, align: 'center' });

  doc.setProperties({ title: transaction.transaction_code, author: STORE_IDENTITY.name });
  return doc.output('blob');
}

export default buildInvoiceBlob;
