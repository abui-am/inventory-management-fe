# Artboard faktur A5 — dua usulan berdampingan.
#
# Yang diminta: qty pindah ke paling kiri, nomor urut dibuang, lebih padat, dan
# pertanyaan "full table?". Dua-duanya digambar supaya bisa dibandingkan langsung, bukan
# dibayangkan: A memakai garis mendatar saja, B memakai kisi penuh.
#
# Sengaja TIDAK memakai token tema — kertas selalu putih, tinta selalu hitam.
import _shell as S

MONO = "font-family:'JetBrains Mono',ui-monospace,Menlo,monospace"
SANS = "font-family:'Plus Jakarta Sans',system-ui,sans-serif"

RP = lambda n: f"{n:,}".replace(",", ".")

# Delapan baris, bukan tiga: kepadatan hanya bisa dinilai pada faktur yang penuh.
ITEMS = [
    ('Kopi Bubuk 250 g', 5, 'pak', 33000),
    ('Garam Halus 500 g', 10, 'pak', 5000),
    ('Susu Bubuk 400 g', 1, 'kotak', 65000),
    ('Minyak Goreng 1 L', 4, 'botol', 18500),
    ('Tepung Beras 500 g', 6, 'pak', 13000),
    ('Kacang Kulit 200 g', 12, 'pak', 13500),
    ('Gula Merah 500 g', 3, 'pak', 21000),
    ('Kecap Manis 275 ml', 2, 'botol', 16000),
]
DISKON = 30000
ONGKIR = 50000
SUB = sum(q * h for _, q, _, h in ITEMS)
TOTAL = SUB - DISKON + ONGKIR

# A5 = 148 x 210 mm. Pada 96dpi: 559 x 794 px.
LEBAR = 559
TINGGI = 794


def kepala():
    return f'''  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px">
    <div style="display:flex;align-items:flex-start;gap:9px">
      <img src="logo.png" alt="" style="width:34px;height:34px;flex-shrink:0">
      <div>
        <div style="font-size:15px;font-weight:800;letter-spacing:-0.01em">Toko Putra Pribumi</div>
        <div style="font-size:9px;color:#555;line-height:1.55;margin-top:1px">
          Jl. Raya Pasar No. 12, Cilacap<br>0812-3456-7890</div>
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-size:15px;font-weight:800;letter-spacing:.04em">FAKTUR</div>
      <div style="{MONO};font-size:10px;margin-top:1px">DO2609077</div>
    </div>
  </div>'''


def keterangan():
    """Penerima dan keterangan dokumen dalam SATU pita, bukan dua blok bertingkat."""
    baris = [('Tanggal', '12/09/2026'), ('Kode', 'TRDO2609077'), ('Kasir', 'Super Admin')]
    kanan = ''.join(
        f'<div style="display:flex;justify-content:space-between;gap:14px">'
        f'<span style="color:#666">{k}</span><span style="{MONO}">{v}</span></div>'
        for k, v in baris)
    return f'''  <div style="display:flex;justify-content:space-between;gap:20px;margin-top:9px;
    padding-top:8px;border-top:1.5px solid #111">
    <div>
      <div style="font-size:8px;font-weight:700;letter-spacing:.07em;color:#777">DITAGIHKAN KEPADA</div>
      <div style="font-size:12px;font-weight:700;margin-top:2px">Warung Bu Melati</div>
      <div style="font-size:9px;color:#555">Jl. Contoh No. 1, Cilacap</div>
    </div>
    <div style="font-size:9px;min-width:168px">{kanan}</div>
  </div>'''


def tabel(kisi):
    """Kolom: JUMLAH di paling kiri, lalu nama barang, harga, total. Tanpa nomor urut."""
    if kisi:
        sel = 'border:0.6px solid #bbb;padding:3.5px 7px'
        th = 'border:0.6px solid #999;padding:3.5px 7px;background:#f2f2f2'
    else:
        sel = 'border-bottom:0.6px solid #e2e2e2;padding:4px 7px'
        th = 'border-bottom:1px solid #111;padding:0 7px 3px'

    def sel_gaya(rata='left', mono=False, tebal=False, kiri=False):
        gaya = sel + f';text-align:{rata}'
        if mono:
            gaya += ';' + MONO
        if tebal:
            gaya += ';font-weight:700'
        if not kisi and kiri:
            gaya += ';padding-left:0'
        return gaya

    baris = []
    for nama, qty, satuan, harga in ITEMS:
        baris.append(f'''        <tr>
          <td style="{sel_gaya('right', mono=True)};white-space:nowrap">{qty}</td>
          <td style="{sel_gaya()};color:#555">{satuan}</td>
          <td style="{sel_gaya()};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{nama}</td>
          <td style="{sel_gaya('right', mono=True)}">{RP(harga)}</td>
          <td style="{sel_gaya('right', mono=True, tebal=True)}">{RP(qty * harga)}</td>
        </tr>''')

    judul = 'font-size:8px;font-weight:700;letter-spacing:.07em;color:#777'
    # Lebar dipatok, tidak diserahkan ke isi. Dibiarkan otomatis, kolom angka menyusut
    # sampai menempel judulnya dan barisnya terbaca berdesakan — dan lebarnya ikut
    # berubah tiap kali nominalnya bertambah satu digit.
    return f'''  <table style="width:100%;border-collapse:collapse;font-size:10px;margin-top:10px;
    table-layout:fixed">
    <colgroup>
      <col style="width:38px"><col style="width:52px"><col>
      <col style="width:82px"><col style="width:92px">
    </colgroup>
    <thead>
      <tr>
        <th style="{th};{judul};text-align:right">JML</th>
        <th style="{th};{judul};text-align:left">SATUAN</th>
        <th style="{th};{judul};text-align:left">BARANG</th>
        <th style="{th};{judul};text-align:right">HARGA</th>
        <th style="{th};{judul};text-align:right">TOTAL</th>
      </tr>
    </thead>
    <tbody>
{chr(10).join(baris)}
    </tbody>
  </table>'''


def kaki():
    """Pembayaran di kiri, rekap di kanan — satu baris per hal, tanpa kotak tambahan."""
    bayar = [('Kas', 250000), ('Utang · jatuh tempo 12/10/2026', 50000)]
    kiri = ''.join(
        f'<div style="display:flex;justify-content:space-between;gap:12px">'
        f'<span style="color:#555">{k}</span><span style="{MONO}">{RP(v)}</span></div>'
        for k, v in bayar)
    rekap = [('Subtotal', SUB), ('Diskon', -DISKON), ('Ongkos kirim', ONGKIR)]
    kanan = ''.join(
        f'<div style="display:flex;justify-content:space-between;gap:16px">'
        f'<span style="color:#555">{k}</span>'
        f'<span style="{MONO}">{"−" if v < 0 else ""}{RP(abs(v))}</span></div>'
        for k, v in rekap)
    return f'''  <div style="display:flex;justify-content:space-between;gap:24px;margin-top:9px;font-size:10px">
    <div style="min-width:210px">
      <div style="font-size:8px;font-weight:700;letter-spacing:.07em;color:#777;margin-bottom:2px">PEMBAYARAN</div>
      {kiri}
    </div>
    <div style="min-width:190px">
      {kanan}
      <div style="display:flex;justify-content:space-between;gap:16px;align-items:baseline;
        margin-top:4px;padding-top:4px;border-top:1.5px solid #111">
        <span style="font-size:12px;font-weight:800">Total</span>
        <span style="{MONO};font-size:14px;font-weight:700">Rp {RP(TOTAL)}</span></div>
    </div>
  </div>'''


def ttd():
    kolom = lambda teks: (f'<div style="text-align:center;width:150px">'
                          f'<div style="border-top:0.8px solid #111;padding-top:3px;font-size:9px;color:#555">'
                          f'{teks}</div></div>')
    return f'''  <div style="display:flex;justify-content:space-between;margin-top:auto;padding-top:34px">
    {kolom('Penerima')}{kolom('Hormat kami')}
  </div>'''


def kertas(kisi, catatan):
    return f'''    <div>
      <div style="font-size:12px;font-weight:700;margin-bottom:7px">{catatan}</div>
      <div style="width:{LEBAR}px;height:{TINGGI}px;background:#fff;color:#111;{SANS};
        padding:26px 30px;box-shadow:0 6px 22px rgba(0,0,0,.14);display:flex;flex-direction:column">
{kepala()}
{keterangan()}
{tabel(kisi)}
{kaki()}
{ttd()}
      </div>
    </div>'''


def catatan_samping():
    poin = [
        ('Jumlah pindah ke kiri', 'Dipecah dua kolom: angkanya rata kanan, satuannya menyusul. '
                                  'Satu kolom "5 pak" membuat angkanya bergeser-geser mengikuti panjang satuan.'),
        ('Nomor urut dibuang', 'Ia tidak pernah dipakai untuk menunjuk apa pun — barangnya disebut dengan nama.'),
        ('Lebih padat', 'Baris 46px jadi 19px, kotak pembayaran dibuang, alamat toko jadi satu baris. '
                        'Delapan barang kini muat di ruang yang dulu menampung tiga.'),
        ('Kisi penuh: tidak disarankan', 'Garis tegak menggandakan tinta dan memaksa padding di tiap sel, '
                                         'jadi justru melawan kepadatan yang diminta. Pada printer kasir, '
                                         'garis rambut tegak sering putus-putus. Perataan kolom sudah '
                                         'melakukan tugas yang sama tanpa satu garis pun.'),
    ]
    isi = ''.join(f'''<div style="margin-bottom:11px">
      <div style="font-size:12px;font-weight:700">{j}</div>
      <div style="font-size:11px;color:var(--foreground-muted);line-height:1.5">{t}</div>
    </div>''' for j, t in poin)
    return f'''    <div style="width:250px;padding-top:26px">{isi}</div>'''


def tulis():
    isi = f'''    <div style="padding:24px;display:flex;gap:26px;align-items:flex-start">
{kertas(False, 'A · garis mendatar saja (usulanku)')}
{kertas(True, 'B · kisi penuh')}
{catatan_samping()}
    </div>'''
    html = (S.head()
            + '<div class="root {{theme}}" style="min-height:900px">\n'
            + isi + '\n</div>\n'
            + S.TAIL + S.logic() + S.END)
    with open('Faktur.dc.html', 'w') as f:
        f.write(html)
    print('Faktur.dc.html', len(html), 'bytes')


if __name__ == '__main__':
    tulis()
