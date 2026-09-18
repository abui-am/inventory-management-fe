# Generator dua artboard Barang Masuk: daftar (/stock-in) dan form baru (/stock-in/add).
#
# Keduanya masih memakai UI lama — tabel legacy dengan kolom "detail" yang menumpuk
# supplier, pembayaran, dan tanggal dalam satu sel, serta form satu kolom sepanjang layar.
#
# Yang membedakan barang masuk dari penjualan dan harus terbaca di desainnya:
#   1. Statusnya bertingkat: Menunggu -> Ditinjau -> Diterima. Jurnal ditulis saat naik ke
#      Ditinjau, stok berubah saat Diterima. Halaman daftar ini pada dasarnya antrean kerja.
#   2. Harga BELI diisi per baris, tidak datang dari master barang.
#   3. Barang yang belum terdaftar boleh dibuat langsung di sini, lengkap dengan satuannya.
import _shell as S

S.ICONS.update({
    'search': '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    'cal': '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/>',
    'down': '<path d="m6 9 6 6 6-6"/>',
    'left': '<path d="m14 6-6 6 6 6"/>',
    'right': '<path d="m10 6 6 6-6 6"/>',
    'eye': '<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.6"/>',
    'check': '<path d="m4 12.5 5 5L20 6.5"/>',
    'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    'plus': '<path d="M12 5v14"/><path d="M5 12h14"/>',
    'minus': '<path d="M5 12h14"/>',
    'tag': '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.3"/>',
    'info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.5"/>',
    'box': '<path d="M12 3 3 7.5v9L12 21l9-4.5v-9z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
    'arrow': '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>',
    'note': '<path d="M5 3h9l5 5v13H5z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
    'download': '<path d="M12 4v11"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M4 20h16"/>',
})

RP = lambda n: f"{n:,}".replace(",", ".")

STATUS = {
    'menunggu': ('warning', 'Menunggu'),
    'ditinjau': ('info', 'Ditinjau'),
    'diterima': ('success', 'Diterima'),
    'batal': ('destructive', 'Dibatalkan'),
}


def pill(kunci):
    warna, teks = STATUS[kunci]
    return f'<span class="pill" style="background:var(--{warna}-subtle);color:var(--{warna})">{teks}</span>'


def tuts(nama):
    return (f'<span class="mono" style="font-size:11px;line-height:16px;padding:0 5px;border-radius:5px;'
            f'border:1px solid var(--border);background:var(--surface-raised);color:var(--foreground-muted)">'
            f'{nama}</span>')


def ico(nama, warna='var(--foreground-muted)'):
    """Kotak 26x26 yang seragam untuk semua ikon aksi — ukurannya tidak mengikuti
    bentuk ikonnya, jadi tiga tombol berdampingan punya kotak sentuh yang sama."""
    return (f'<span class="ico" style="width:26px;height:26px;flex-shrink:0;border-color:transparent;'
            f'color:{warna}">{S.svg(nama, 14, 1.8)}</span>')


def aksi_deret(*ikon):
    """`.ico` memakai display:flex, jadi tiga di antaranya BERTUMPUK ke bawah kalau tidak
    dibungkus baris flex sendiri — itu yang membuat kolom Aksi jadi setinggi tiga baris."""
    return ('<span style="display:flex;align-items:center;justify-content:flex-end;gap:4px">'
            + ''.join(ikon) + '</span>')


# ── daftar ───────────────────────────────────────────────────────────────────
# waktu, kode, faktur, supplier, metode, kasir, jumlah, status
BARIS = [
    ('14 Sep 09:12', 'TRDO2609081', 'INV-9921', 'CV Sumber Rejeki', 'Kas · Utang', 'Super Admin', 2175000, 'menunggu'),
    ('14 Sep 08:40', 'TRDO2609080', 'INV-9920', 'UD Makmur Jaya', 'Utang', 'Rina Wijaya', 1450000, 'menunggu'),
    ('13 Sep 16:05', 'TRDO2609079', 'INV-9918', 'PT Boga Sentosa', 'Bank', 'Super Admin', 3200000, 'ditinjau'),
    ('13 Sep 11:22', 'TRDO2609078', 'INV-9917', 'CV Sumber Rejeki', 'Kas', 'Rina Wijaya', 640000, 'diterima'),
    ('12 Sep 15:47', 'TRDO2609077', 'INV-9915', 'UD Makmur Jaya', 'Giro', 'Bagus Santoso', 2800000, 'diterima'),
    ('12 Sep 09:03', 'TRDO2609076', 'INV-9914', 'PT Boga Sentosa', 'Kas · Bank', 'Rina Wijaya', 1975000, 'diterima'),
    ('11 Sep 14:18', 'TRDO2609075', 'INV-9912', 'CV Sumber Rejeki', 'Utang', 'Super Admin', 520000, 'batal'),
]


def aksi(status):
    if status == 'menunggu':
        return aksi_deret(ico('eye'), ico('check', 'var(--success)'), ico('x', 'var(--destructive)'))
    if status == 'ditinjau':
        return aksi_deret(ico('eye'), ico('tag', 'var(--accent)'), ico('check', 'var(--success)'))
    return aksi_deret(ico('eye'))


def tab(teks, jumlah, aktif=False):
    gaya = ('background:var(--surface);color:var(--foreground);box-shadow:var(--shadow-sm);font-weight:600'
            if aktif else 'color:var(--foreground-muted)')
    hitung = (f'<span class="mono" style="font-size:11px;color:var(--foreground-subtle)">{jumlah}</span>'
              if jumlah is not None else '')
    return (f'<span style="display:flex;align-items:center;gap:5px;height:26px;padding:0 9px;border-radius:6px;'
            f'font-size:12px;{gaya}">{teks}{hitung}</span>')


def toolbar_daftar():
    tabs = (tab('Semua', 128, True) + tab('Menunggu', 2) + tab('Ditinjau', 1)
            + tab('Diterima', 122) + tab('Dibatalkan', 3))
    return f'''      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:3px;padding:3px;border-radius:8px;
          background:var(--surface-raised)">{tabs}</div>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="field" style="width:220px;color:var(--foreground-subtle);gap:7px">
            {S.svg('search', 14, 1.9)}<span>Cari kode atau faktur…</span></div>
          <div class="field" style="gap:7px;color:var(--foreground-muted)">
            {S.svg('cal', 14, 1.9)}<span>Semua tanggal</span>{S.svg('down', 11, 2)}</div>
          <button class="btn">{S.svg('plus', 14, 2.2)}Barang masuk</button>
        </div>
      </div>'''


def tabel_daftar():
    out = ['''      <div class="card" style="overflow:hidden">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr>
            <th class="th" style="padding-top:10px;width:118px">Waktu</th>
            <th class="th" style="padding-top:10px">Kode</th>
            <th class="th" style="padding-top:10px">Detail</th>
            <th class="th" style="padding-top:10px;width:136px">Kasir</th>
            <th class="th" style="padding-top:10px;text-align:right;width:130px">Jumlah</th>
            <th class="th" style="padding-top:10px;width:104px">Status</th>
            <th class="th" style="padding-top:10px;text-align:right;width:112px">Aksi</th>
          </tr></thead>
          <tbody>''']
    for waktu, kode, faktur, supplier, bayar, kasir, jumlah, status in BARIS:
        # Baris yang menunggu tindakan diberi pita aksen tipis di tepi kiri. Statusnya sudah
        # tertulis di kolomnya, tapi pita ini yang membuat antreannya terlihat saat menyapu
        # halaman, tanpa menambah warna ke seluruh baris.
        tanda = ('box-shadow:inset 2px 0 0 var(--warning)' if status == 'menunggu'
                 else 'box-shadow:inset 2px 0 0 var(--info)' if status == 'ditinjau' else '')
        redup = 'opacity:.55' if status == 'batal' else ''
        out.append(f'''          <tr style="{tanda};{redup}">
            <td class="td mono" style="color:var(--foreground-muted);white-space:nowrap">{waktu}</td>
            <td class="td">
              <div class="mono" style="font-weight:500">{kode}</div>
              <div class="mono" style="font-size:10px;color:var(--foreground-subtle)">{faktur}</div>
            </td>
            <td class="td">
              <div>{supplier}</div>
              <div style="font-size:11px;color:var(--foreground-subtle)">{bayar}</div>
            </td>
            <td class="td" style="color:var(--foreground-muted)">{kasir}</td>
            <td class="td mono" style="text-align:right;font-weight:600">{RP(jumlah)}</td>
            <td class="td">{pill(status)}</td>
            <td class="td">{aksi(status)}</td>
          </tr>''')
    out.append('''          </tbody>
        </table>''')
    out.append(f'''        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;
          padding:9px 12px;background:var(--surface-raised);border-top:1px solid var(--border)">
          <span style="font-size:11px;color:var(--foreground-subtle)">
            <span class="mono" style="color:var(--foreground-muted)">1–7</span> dari
            <span class="mono" style="color:var(--foreground-muted)">128</span></span>
          <div style="display:flex;align-items:center;gap:5px">
            <div class="field" style="height:26px;font-size:12px;padding:0 7px;gap:5px">
              <span class="mono">10</span>{S.svg('down', 11, 2)}</div>
            <button class="ico" style="width:26px;height:26px;background:var(--surface);opacity:.4">
              {S.svg('left', 12, 2)}</button>
            <button class="btn sm" style="background:var(--accent);color:var(--accent-foreground);
              min-width:26px;justify-content:center;padding:0 6px">1</button>
            <button class="btn sm" style="background:var(--surface);border:1px solid var(--border);
              color:var(--foreground-muted);min-width:26px;justify-content:center;padding:0 6px">2</button>
            <button class="ico" style="width:26px;height:26px;background:var(--surface)">
              {S.svg('right', 12, 2)}</button>
          </div>
        </div>
      </div>''')
    return '\n'.join(out)


def legenda_daftar():
    item = [('eye', 'Lihat detail'), ('check', 'Naikkan status'), ('tag', 'Atur harga jual'),
            ('x', 'Batalkan')]
    isi = ''.join(f'''<span style="display:flex;align-items:center;gap:5px;font-size:11px;
      color:var(--foreground-muted)">{S.svg(n, 12, 1.8)}{t}</span>''' for n, t in item)
    return f'''      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
        <span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--foreground-subtle)">
          {S.svg('info', 12, 1.9)}Jurnal ditulis saat status naik ke Ditinjau; stok bertambah saat Diterima.</span>
        <span style="width:1px;height:12px;background:var(--border)"></span>
        {isi}
      </div>'''


def isi_daftar():
    return f'''    <div style="flex:1;padding:14px 18px;display:flex;flex-direction:column;gap:12px">
{toolbar_daftar()}
{tabel_daftar()}
{legenda_daftar()}
    </div>'''


# ── form baru ────────────────────────────────────────────────────────────────
# nama, kode, qty, satuan, harga beli, stok sekarang, barang baru?, catatan
ITEMS = [
    ('Gula Pasir 1 kg', 'GLA-001', 25, 'kg', 20000, 0, False, ''),
    ('Minyak Goreng 2 L', 'MYK-001', 12, 'botol', 50000, 8, False, 'Dus penyok, sudah dicek isinya utuh'),
    ('Sirup Pandan 600 ml', 'SRP-004', 6, 'botol', 18000, None, True, ''),
]
ONGKIR = 75000
SUB = sum(q * h for _, _, q, _, h, _, _, _ in ITEMS)
TOTAL = SUB + ONGKIR


def field(label, isi, span=4, wajib=False, redup=False):
    """Satu field dalam kisi 12 kolom. `span` yang menentukan lebarnya, bukan angka px —
    jadi tepi kanan tiap field selalu jatuh di garis kisi yang sama, dan barisnya tidak
    lagi membungkus ke bawah dengan sisa ruang menganga di sebelahnya."""
    bintang = '<span style="color:var(--destructive)"> *</span>' if wajib else ''
    warna = 'var(--foreground-subtle)' if redup else 'var(--foreground)'
    return f'''        <div style="grid-column:span {span}">
          <div style="font-size:11px;font-weight:600;margin-bottom:4px">{label}{bintang}</div>
          <div class="field" style="justify-content:space-between;color:{warna}">{isi}</div>
        </div>'''


def stepper(qty):
    return f'''<span style="display:inline-flex;align-items:center;border:1px solid var(--border-strong);
      border-radius:7px;overflow:hidden;height:28px">
      <span style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;
        color:var(--foreground-subtle)">{S.svg('minus', 14, 2)}</span>
      <span class="mono" style="width:44px;text-align:center;font-size:13px;font-weight:500">{qty}</span>
      <span style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;
        color:var(--foreground-subtle)">{S.svg('plus', 14, 2)}</span>
    </span>'''


def baris_barang(nama, kode, qty, satuan, harga, stok, baru, catatan):
    if baru:
        # ID barang untuk barang baru berupa INPUT: ia belum punya kode, dan kode itu yang
        # dipakai kasir mencarinya nanti. Di form lama ini satu field wajib di modal
        # tersendiri; di sini ia menempel pada barisnya.
        kode_html = ('<span class="pill" style="background:var(--accent-subtle);color:var(--accent)">'
                     'barang baru</span>'
                     '<span class="field mono" style="height:22px;width:92px;padding:0 6px;font-size:10px;'
                     'margin-left:6px">' + kode + '</span>')
        stok_html = '<span style="color:var(--foreground-subtle)">—</span>'
    else:
        kode_html = f'<span class="mono" style="font-size:10px;color:var(--foreground-subtle)">{kode}</span>'
        stok_html = (f'<span class="mono" style="color:var(--foreground-subtle)">{stok}</span>'
                     f'<span style="color:var(--foreground-subtle);margin:0 4px">{S.svg("arrow", 11, 2)}</span>'
                     f'<span class="mono" style="font-weight:600">{stok + qty}</span>')

    # Catatan per barang: ditulis di tempat, bukan di modal terpisah. Kalau kosong ia hanya
    # sebaris ajakan redup — jadi ia tidak menambah tinggi baris yang tidak memakainya.
    catatan_html = (f'<div style="font-size:11px;color:var(--foreground-muted);margin-top:2px">'
                    f'{S.svg("note", 11, 1.8)} {catatan}</div>' if catatan else
                    '<div style="font-size:11px;color:var(--foreground-subtle);margin-top:2px">'
                    '+ Catatan</div>')
    # Harga beli adalah INPUT, bukan teks: ia berubah tiap kali supplier menaikkan harga,
    # dan di sinilah satu-satunya tempat angka itu masuk ke sistem.
    harga_html = (f'<span class="field" style="height:28px;width:104px;padding:0 8px;justify-content:flex-end">'
                  f'<span class="mono">{RP(harga)}</span></span>')
    return f'''          <tr>
            <td class="td">
              <div style="font-weight:500">{nama}</div>
              <div style="display:flex;align-items:center;margin-top:1px">{kode_html}</div>
              {catatan_html}
            </td>
            <td class="td" style="text-align:center">{stepper(qty)}</td>
            <td class="td" style="color:var(--foreground-muted)">{satuan}</td>
            <td class="td" style="text-align:right">{harga_html}</td>
            <td class="td" style="white-space:nowrap">
              <span style="display:flex;align-items:center">{stok_html}</span></td>
            <td class="td mono" style="text-align:right;font-weight:600">{RP(qty * harga)}</td>
            <td class="td" style="text-align:right">{ico('x')}</td>
          </tr>'''


def kartu_barang():
    baris = '\n'.join(baris_barang(*i) for i in ITEMS)
    return f'''      <div class="card" style="overflow:hidden">
        <div style="display:flex;align-items:center;gap:7px;padding:10px 13px;border-bottom:1px solid var(--border);
          background:var(--surface-raised)">
          <span style="font-size:13px;font-weight:600">Barang</span>
          <span class="mono" style="font-size:12px;color:var(--foreground-subtle)">3</span>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr>
            <th class="th" style="padding-top:9px">Nama</th>
            <th class="th" style="padding-top:9px;text-align:center;width:132px">Qty</th>
            <th class="th" style="padding-top:9px;width:76px">Satuan</th>
            <th class="th" style="padding-top:9px;text-align:right;width:120px">Harga beli</th>
            <th class="th" style="padding-top:9px;width:104px">Stok</th>
            <th class="th" style="padding-top:9px;text-align:right;width:120px">Subtotal</th>
            <th class="th" style="padding-top:9px;width:44px"></th>
          </tr></thead>
          <tbody>
{baris}
          </tbody>
        </table>
        <div style="padding:11px 13px">
          <div class="field" style="gap:9px;color:var(--foreground-subtle)">
            {S.svg('search', 14, 1.9)}<span style="flex:1">Ketik nama atau kode barang…</span></div>
          <div style="display:flex;align-items:center;gap:14px;margin-top:8px;font-size:11px">
            <span style="display:flex;align-items:center;gap:5px">{tuts('↑ ↓')}
              <span style="color:var(--foreground-subtle)">pilih</span></span>
            <span style="display:flex;align-items:center;gap:5px">{tuts('Enter')}
              <span style="color:var(--foreground-subtle)">tambahkan</span></span>
            <span style="display:flex;align-items:center;gap:5px">{tuts('Ctrl N')}
              <span style="color:var(--foreground-subtle)">barang baru</span></span>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 13px;
          background:var(--surface-raised);border-top:1px solid var(--border)">
          <span style="font-size:12px;color:var(--foreground-muted)">3 barang</span>
          <span style="display:flex;align-items:baseline;gap:8px">
            <span style="font-size:12px;color:var(--foreground-muted)">Subtotal</span>
            <span class="mono" style="font-size:16px;font-weight:700">{RP(SUB)}</span></span>
        </div>
      </div>'''


# Warna metode diambil dari PAYMENT_METHOD_COLOR di constants/options.tsx — warnanya
# menyampaikan akibat pembayaran pada utang, bukan hiasan.
METODE_WARNA = {'Kas': 'success', 'Bank': 'info', 'Giro': 'warning', 'Utang': 'destructive'}


def pill_metode(nama):
    """Pill berwarna + chevron, sama dengan baris pembayaran di /transaction/add.
    Chevron-nya wajib ada: tanpa itu pill terbaca sebagai label mati, dan tidak ada yang
    tahu metodenya masih bisa diganti."""
    w = METODE_WARNA[nama]
    return (f'<span style="display:flex;align-items:center;justify-content:space-between;height:28px;'
            f'width:92px;flex-shrink:0;padding:0 4px 0 9px;border-radius:7px;'
            f'background:var(--{w}-subtle);color:var(--{w});font-size:12px;font-weight:600">'
            f'{nama}{S.svg("down", 11, 2)}</span>')


def kartu_bayar():
    baris = [('Kas', 1075000, None), ('Utang', 1100000, '09 Okt 2026')]
    isi = []
    for metode, nominal, tempo in baris:
        tempo_html = (f'<span class="field" style="height:28px;width:150px;gap:6px;color:var(--foreground-muted)">'
                      f'{S.svg("cal", 13, 1.9)}<span style="font-size:12px">{tempo}</span></span>'
                      if tempo else '')
        isi.append(f'''        <div style="display:flex;align-items:center;gap:9px;padding:7px 13px;
          border-bottom:1px solid var(--border-subtle)">
          {pill_metode(metode)}
          <span class="field" style="flex:1;height:28px;justify-content:flex-end">
            <span class="mono" style="font-weight:600">{RP(nominal)}</span></span>
          {tempo_html}
          {ico('x')}
        </div>''')
    return f'''      <div class="card" style="overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 13px;
          border-bottom:1px solid var(--border);background:var(--surface-raised)">
          <span style="font-size:13px;font-weight:600">Pembayaran ke supplier</span>
          <button class="btn sm ghost">{S.svg('plus', 13, 2.2)}Metode</button>
        </div>
{''.join(isi)}
        <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 13px;
          background:var(--surface-raised)">
          <span style="font-size:12px;color:var(--foreground-muted)">Total dibayarkan</span>
          <span class="mono" style="font-size:13px;font-weight:700">{RP(TOTAL)}</span>
        </div>
      </div>'''


def kartu_kanan():
    rekap = [('Subtotal', SUB), ('Ongkos kirim', ONGKIR)]
    isi = ''.join(f'''<div style="display:flex;justify-content:space-between;font-size:12px">
      <span style="color:var(--foreground-muted)">{k}</span>
      <span class="mono">{RP(v)}</span></div>''' for k, v in rekap)
    jurnal = [('D', 'Persediaan', SUB, 'destructive'), ('D', 'Beban ongkos kirim', ONGKIR, 'destructive'),
              ('K', 'Kas', 1075000, 'success'), ('K', 'Utang', 1100000, 'success')]
    jisi = ''.join(f'''<div style="display:flex;align-items:center;gap:7px;font-size:12px">
      <span class="pill" style="background:var(--{w}-subtle);color:var(--{w});width:15px;justify-content:center">
        {t}</span>
      <span style="flex:1">{akun}</span>
      <span class="mono" style="font-weight:600">{RP(n)}</span></div>''' for t, akun, n, w in jurnal)
    return f'''      <div style="width:300px;flex-shrink:0;display:flex;flex-direction:column;gap:10px">
        <div class="card" style="padding:13px 15px;display:flex;flex-direction:column;gap:7px">
          <span style="font-size:13px;font-weight:600">Ringkasan</span>
          {isi}
          <div style="display:flex;align-items:center;gap:8px;padding-top:2px">
            <span style="flex:1;font-size:12px;color:var(--foreground-muted)">Ongkos kirim</span>
            <span class="field" style="height:28px;width:118px;justify-content:flex-end">
              <span class="mono">{RP(ONGKIR)}</span></span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;padding-top:7px;
            border-top:1px solid var(--border)">
            <span style="font-size:13px;font-weight:700">Total</span>
            <span class="mono" style="font-size:17px;font-weight:700;color:var(--accent)">{RP(TOTAL)}</span></div>
          <button class="btn" style="width:100%;justify-content:center;margin-top:4px">
            Simpan sebagai Menunggu</button>
          <span style="font-size:11px;color:var(--foreground-subtle);text-align:center">
            Belum menyentuh stok maupun jurnal.</span>
        </div>

        <div class="card" style="padding:13px 15px;display:flex;flex-direction:column;gap:5px">
          <span style="font-size:13px;font-weight:600">CV Sumber Rejeki</span>
          <div style="display:flex;justify-content:space-between;font-size:12px">
            <span style="color:var(--foreground-muted)">Utang berjalan</span>
            <span class="mono" style="color:var(--warning)">4.320.000</span></div>
          <div style="display:flex;justify-content:space-between;font-size:12px">
            <span style="color:var(--foreground-muted)">Transaksi ini</span>
            <span class="mono" style="color:var(--warning)">+1.100.000</span></div>
          <div style="display:flex;justify-content:space-between;font-size:12px;padding-top:5px;
            border-top:1px solid var(--border)">
            <span>Total setelah simpan</span>
            <span class="mono" style="font-weight:700">5.420.000</span></div>
        </div>

        <div class="card" style="padding:13px 15px;display:flex;flex-direction:column;gap:6px">
          <span style="font-size:13px;font-weight:600">Preview jurnal</span>
          <span style="font-size:11px;color:var(--foreground-subtle);margin-top:-3px">
            Ditulis saat status naik ke Ditinjau, bukan sekarang.</span>
          {jisi}
          <div style="display:flex;justify-content:space-between;font-size:12px;padding-top:6px;
            border-top:1px solid var(--border)">
            <span style="color:var(--foreground-muted)">Balance</span>
            <span class="mono" style="color:var(--success);font-weight:600">
              {RP(TOTAL)} = {RP(TOTAL)}</span></div>
        </div>
      </div>'''


def isi_baru():
    atas = f'''      <div class="card" style="padding:13px 15px;display:grid;
        grid-template-columns:repeat(12, minmax(0, 1fr));gap:10px 12px">
{field('Supplier', '<span>CV Sumber Rejeki</span>' + S.svg('down', 11, 2), 5, wajib=True)}
{field('Nomor faktur', '<span class="mono">INV-9921</span>', 4, wajib=True)}
{field('Tanggal masuk', S.svg('cal', 13, 1.9) + '<span class="mono" style="flex:1">14/09/2026</span>', 3)}
{field('Catatan', '<span>Opsional</span>', 12, redup=True)}
      </div>'''
    return f'''    <div style="flex:1;padding:14px 18px;display:flex;gap:12px;align-items:flex-start">
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:10px">
{atas}
{kartu_barang()}
{kartu_bayar()}
      </div>
{kartu_kanan()}
    </div>'''


def tulis(nama_berkas, aktif, crumb, judul, isi, tinggi=900):
    html = (S.head()
            + f'<div class="root {{{{theme}}}}" style="display:flex;min-height:{tinggi}px">\n'
            + S.sidebar(aktif) + '\n'
            + '  <div style="flex:1;display:flex;flex-direction:column;min-width:0">\n'
            + S.topbar(crumb, judul) + '\n'
            + isi + '\n'
            + '  </div>\n</div>\n'
            + S.TAIL + S.logic() + S.END)
    with open(nama_berkas, 'w') as f:
        f.write(html)
    print(nama_berkas, len(html), 'bytes')


if __name__ == '__main__':
    tulis('BarangMasukDaftar.dc.html', 'Barang Masuk', 'Pembelian', 'Barang Masuk', isi_daftar())
    tulis('BarangMasukBaru.dc.html', 'Barang Masuk', 'Pembelian', 'Barang Masuk / Baru', isi_baru(), 940)


# ── sheet detail ─────────────────────────────────────────────────────────────
# Bentuknya SAMA dengan TransactionDetailSheet di penjualan: sheet kanan 420px, bukan
# modal di tengah. Daftar di belakangnya tetap terlihat, jadi memeriksa beberapa barang
# masuk berturut-turut tidak perlu kembali ke halaman tiap kali.
DETAIL_ITEMS = [
    ('Gula Pasir 1 kg', 'GLA-001', 25, 'kg', 20000, 0),
    ('Minyak Goreng 2 L', 'MYK-001', 12, 'botol', 50000, 8),
    ('Sirup Pandan 600 ml', 'SRP-004', 6, 'botol', 18000, 0),
]
DETAIL_SUB = sum(q * h for _, _, q, _, h, _ in DETAIL_ITEMS)
DETAIL_ONGKIR = 75000
DETAIL_TOTAL = DETAIL_SUB + DETAIL_ONGKIR


def seksi(judul, isi, jumlah=None):
    hitung = (f'<span class="mono" style="font-size:11px;color:var(--foreground-subtle)">{jumlah}</span>'
              if jumlah is not None else '')
    return f'''      <div style="padding:12px 16px;border-bottom:1px solid var(--border-subtle)">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:7px">
          <span style="font-size:11px;font-weight:700;color:var(--foreground-subtle)">{judul}</span>{hitung}
        </div>
{isi}
      </div>'''


def baris_nilai(label, nilai, tebal=False, warna=None):
    gaya = 'font-weight:600' if tebal else ''
    if warna:
        gaya += f';color:var(--{warna})'
    return f'''        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;font-size:12px">
          <span style="color:var(--foreground-muted)">{label}</span>
          <span class="mono" style="{gaya}">{nilai}</span></div>'''


def sheet_detail():
    items = ''.join(f'''        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;
          margin-bottom:9px">
          <div style="min-width:0;flex:1">
            <div style="font-size:13px;font-weight:500">{nama}</div>
            <div class="mono" style="font-size:11px;color:var(--foreground-subtle);margin-top:1px">
              {kode} · {qty} {satuan} × {RP(harga)}</div>
            <div style="display:flex;align-items:center;font-size:11px;color:var(--foreground-subtle);
              margin-top:2px">Stok <span class="mono" style="margin:0 4px">{stok}</span>
              {S.svg('arrow', 11, 2)}
              <span class="mono" style="margin-left:4px;color:var(--foreground-muted);font-weight:600">
                {stok + qty}</span></div>
          </div>
          <span class="mono" style="font-size:13px;font-weight:600;white-space:nowrap">{RP(qty * harga)}</span>
        </div>''' for nama, kode, qty, satuan, harga, stok in DETAIL_ITEMS)

    bayar = ''.join(f'''        <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px">
          {pill_metode(metode)}
          <span style="flex:1;font-size:11px;color:var(--foreground-subtle)">{ket}</span>
          <span class="mono" style="font-size:13px;font-weight:600">{RP(n)}</span>
        </div>''' for metode, n, ket in [('Kas', 1075000, 'Dibayar 14 Sep 2026'),
                                        ('Utang', 1100000, 'Jatuh tempo 09 Okt 2026')])

    pihak = (baris_nilai('Supplier', 'CV Sumber Rejeki')
             + baris_nilai('Kasir', 'Super Admin')
             + baris_nilai('Nomor faktur', 'INV-9921'))

    return f'''  <div style="position:absolute;inset:0;background:hsl(240 20% 6% / 0.42)"></div>
  <div style="position:absolute;top:0;right:0;bottom:0;width:420px;background:var(--surface);
    border-left:1px solid var(--border);box-shadow:var(--shadow-md);display:flex;flex-direction:column">

    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;height:48px;
      flex-shrink:0;padding:0 16px;border-bottom:1px solid var(--border)">
      <div style="min-width:0">
        <div style="display:flex;align-items:center;gap:8px">
          <span class="mono" style="font-size:16px;font-weight:600">TRDO2609081</span>{pill('menunggu')}</div>
        <div style="font-size:11px;color:var(--foreground-subtle)">14 Sep 2026 · 09:12</div>
      </div>
      <div style="display:flex;align-items:center;gap:5px;flex-shrink:0">
        <!-- Download duduk di kepala, bukan di pita aksi: ia tersedia pada SEMUA status,
             sementara pita di bawahnya hanya berisi aksi yang mengubah status. Menaruh
             keduanya sebaris membuat "Download" terbaca setara dengan "Konfirmasi". -->
        <button class="ico" style="background:var(--surface)">{S.svg('download', 13, 2)}</button>
        <button class="ico" style="background:var(--surface)">{S.svg('x', 13, 2)}</button>
      </div>
    </div>

    <!-- Aksi mengikuti status, sama seperti kolom Aksi di daftar: yang tidak mungkin
         dilakukan pada status ini tidak ditampilkan, bukan ditampilkan lalu dimatikan. -->
    <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;padding:7px 16px;
      border-bottom:1px solid var(--border)">
      <button class="btn sm">{S.svg('check', 13, 2.2)}Konfirmasi</button>
      <button class="btn sm ghost" style="color:var(--destructive);border-color:var(--destructive)">
        {S.svg('x', 13, 2.2)}Batalkan</button>
      <span style="flex:1"></span>
      <span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--foreground-subtle)">
        {S.svg('info', 12, 1.9)}Jurnal belum ditulis</span>
    </div>

    <div style="flex:1;overflow:hidden">
      <div style="padding:13px 16px;border-bottom:1px solid var(--border-subtle)">
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px">
          <span class="mono" style="font-size:20px;font-weight:700;color:var(--accent)">
            Rp {RP(DETAIL_TOTAL)}</span>
          <span class="pill" style="background:var(--warning-subtle);color:var(--warning)">
            Sisa <span class="mono" style="font-weight:700;margin-left:3px">1.100.000</span></span>
        </div>
        <div style="margin-top:7px">
{baris_nilai('Subtotal', RP(DETAIL_SUB))}
{baris_nilai('Ongkos kirim', RP(DETAIL_ONGKIR))}
        </div>
      </div>

{seksi('Pembayaran ke supplier', bayar)}
{seksi('Barang', items, 3)}
{seksi('Keterangan', pihak)}
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;flex-shrink:0;
      padding:9px 16px;border-top:1px solid var(--border);background:var(--surface-raised);
      font-size:11px;color:var(--foreground-subtle)">
      <span>Tanggal masuk</span><span class="mono">14/09/2026</span>
    </div>
  </div>'''


def tulis_detail():
    html = (S.head()
            + '<div class="root {{theme}}" style="display:flex;min-height:900px;position:relative">\n'
            + S.sidebar('Barang Masuk') + '\n'
            + '  <div style="flex:1;display:flex;flex-direction:column;min-width:0">\n'
            + S.topbar('Pembelian', 'Barang Masuk') + '\n'
            + isi_daftar() + '\n'
            + '  </div>\n'
            + sheet_detail()
            + '</div>\n'
            + S.TAIL + S.logic() + S.END)
    with open('BarangMasukDetail.dc.html', 'w') as f:
        f.write(html)
    print('BarangMasukDetail.dc.html', len(html), 'bytes')


tulis_detail()
