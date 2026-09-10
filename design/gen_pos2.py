# Arah baru untuk /transaction/add. Bedanya dari POS.dc.html: entri barang jadi satu
# baris cepat di dalam tabel (bukan blok form terpisah), pembayaran jadi baris padat
# (bukan kartu besar), dan rel kanan menampilkan piutang berjalan customer — angka yang
# menentukan boleh-tidaknya transaksi ini dibayar dengan utang.
import _shell as S

S.ICONS.update({
    'check': '<path d="M20 6 9 17l-5-5"/>',
    'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    'plus': '<path d="M12 5v14"/><path d="M5 12h14"/>',
    'search': '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    'chev': '<path d="m6 9 6 6 6-6"/>',
})

RUPIAH = lambda n: f"{n:,}".replace(",", ".")
BARANG = [
    ("Beras Premium 5 kg", "BRS-001", 4, "karung", 150000),
    ("Telur Ayam 1 kg", "TLR-001", 6, "kg", 32000),
    ("Minyak Goreng 2 L", "MYK-001", 2, "botol", 75000),
]
SUB = sum(q * h for _, _, q, _, h in BARANG)
DISKON, ONGKIR = 0, 0
TOTAL = SUB - DISKON + ONGKIR
BAYAR = [("Kas", "success", 700000, None), ("Giro", "warning", 242000, "23 Sep 2026")]
DIBAYAR = sum(b[2] for b in BAYAR)

CUSTOMER = "Warung Bu Melati"
PIUTANG = 557000                     # total_debt dari respons customer — nol request tambahan
KREDIT_KINI = 242000                 # bagian transaksi ini yang dibayar Giro/Utang


def kartu_customer():
    """Piutang berjalan customer, plus proyeksi setelah transaksi ini.

    Ini pertanyaan yang benar-benar dibawa kasir sebelum menekan simpan: boleh tidak
    orang ini menambah utang lagi. Angkanya sudah ikut di respons daftar customer yang
    memang sudah diambil select-nya, jadi tidak ada permintaan tambahan.
    """
    sesudah = PIUTANG + KREDIT_KINI
    baris = lambda l, v, warna=None, tebal=False: (
        f'<div style="display:flex;justify-content:space-between;align-items:baseline;font-size:12px">'
        f'<span style="color:var(--foreground-muted)">{l}</span>'
        f'<span class="mono" style="font-weight:{600 if tebal else 500}'
        f'{";color:var(--%s)" % warna if warna else ""}">{v}</span></div>')
    return f'''<div class="card" style="padding:13px 15px;display:flex;flex-direction:column;gap:10px">
    <span style="font-size:13px;font-weight:600">Customer</span>
    <div style="display:flex;flex-direction:column;gap:6px">
      <div style="font-size:13px">{CUSTOMER}</div>
      {baris('Piutang berjalan', RUPIAH(PIUTANG), 'warning')}
      {baris('Transaksi ini (kredit)', '+' + RUPIAH(KREDIT_KINI))}
      <div style="height:1px;background:var(--border-subtle)"></div>
      {baris('Total setelah simpan', RUPIAH(sesudah), 'warning', True)}
    </div>
    <span style="font-size:10px;line-height:15px;color:var(--foreground-subtle)">
      Hanya bagian yang dibayar Utang atau Giro yang menambah piutang.
    </span>
  </div>'''



def field(isi, w=None, mono=False, muted=False):
    lebar = f"width:{w}px;" if w else "flex:1;min-width:0;"
    warna = "color:var(--foreground-muted);" if muted else ""
    return (f'<div class="field{" mono" if mono else ""}" style="{lebar}{warna}justify-content:space-between">'
            f'{isi}{S.svg("chev", 12, 2.2)}</div>')


def label(t, htmlfor=''):
    return (f'<label for="{htmlfor}" style="font-size:12px;font-weight:500;color:var(--foreground-muted)">{t}</label>')


def identitas():
    kolom = lambda l, isi, w=None: (
        f'<div style="{"width:%dpx" % w if w else "flex:1;min-width:180px"};display:flex;flex-direction:column;gap:4px">'
        f'{label(l)}{isi}</div>')
    return f'''<div class="card" style="padding:11px 13px;display:flex;gap:9px;flex-wrap:wrap">
  {kolom('Customer', field('Warung Bu Melati'))}
  {kolom('Pengirim', field('Super Admin'))}
  {kolom('Tanggal', field('09 Sep 2026', mono=True), 148)}
  {kolom('Faktur', '<input class="field mono" placeholder="Otomatis" style="width:100%;box-sizing:border-box">', 148)}
</div>'''


def barang():
    baris = []
    for nama, kode, qty, satuan, harga in BARANG:
        baris.append(f'''<tr>
  <td class="td">
    <div style="display:flex;flex-direction:column">
      <span style="font-size:13px;font-weight:500">{nama}</span>
      <span class="mono" style="font-size:10px;color:var(--foreground-subtle)">{kode}</span>
    </div>
  </td>
  <td class="td mono" style="text-align:right">{qty}</td>
  <td class="td" style="color:var(--foreground-muted)">{satuan}</td>
  <td class="td mono" style="text-align:right;color:var(--foreground-muted)">{RUPIAH(harga)}</td>
  <td class="td mono" style="text-align:right;font-weight:600">{RUPIAH(qty * harga)}</td>
  <td class="td" style="text-align:right"><div class="ico">{S.svg('x', 13, 2)}</div></td>
</tr>''')

    th = ''.join(
        f'<th class="th" style="padding-top:9px{";text-align:right" if h in ("Qty", "Harga", "Subtotal") else ""}">{h}</th>'
        for h in ['Barang', 'Qty', 'Satuan', 'Harga', 'Subtotal', ''])

    # Baris entri cepat — inti perubahannya. Berada DI DALAM tabel, jadi kolomnya
    # sejajar dengan baris yang sudah ada; mata tidak perlu berpindah.
    entri = f'''<tr style="background:var(--accent-subtle)">
  <td class="td" style="border-bottom:1px solid var(--border)">
    <div class="field" style="height:28px;gap:7px;border-color:var(--accent);color:var(--foreground-subtle)">
      {S.svg('search', 13, 1.9)}<span>Ketik nama atau kode barang…</span>
    </div>
  </td>
  <td class="td" style="border-bottom:1px solid var(--border)">
    <div class="field mono" style="height:28px;justify-content:flex-end;color:var(--foreground-subtle)">1</div>
  </td>
  <td class="td" style="border-bottom:1px solid var(--border);color:var(--foreground-subtle)">—</td>
  <td class="td" style="border-bottom:1px solid var(--border);text-align:right;color:var(--foreground-subtle)">—</td>
  <td class="td" style="border-bottom:1px solid var(--border);text-align:right;color:var(--foreground-subtle)">—</td>
  <td class="td" style="border-bottom:1px solid var(--border);text-align:right">
    <div class="ico" style="border-color:var(--accent);color:var(--accent)">{S.svg('plus', 13, 2.2)}</div>
  </td>
</tr>'''

    return f'''<div class="card" style="padding:0;overflow:hidden">
  <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 13px;
    background:var(--surface-raised);border-bottom:1px solid var(--border)">
    <div style="display:flex;align-items:baseline;gap:8px">
      <span style="font-size:13px;font-weight:600">Barang</span>
      <span class="mono" style="font-size:11px;color:var(--foreground-subtle)">{len(BARANG)} baris</span>
    </div>

  </div>
  <table style="width:100%;border-collapse:collapse">
    <thead><tr>{th}</tr></thead>
    <tbody>{entri}{''.join(baris)}</tbody>
  </table>
</div>'''


def pembayaran():
    baris = []
    for metode, warna, jml, tempo in BAYAR:
        tempo_sel = (f'<span style="font-size:11px;color:var(--foreground-muted)">{tempo}</span>'
                     if tempo else '<span style="font-size:11px;color:var(--foreground-subtle)">—</span>')
        baris.append(f'''<div style="display:flex;align-items:center;gap:9px;padding:7px 13px;
  border-bottom:1px solid var(--border-subtle)">
  <span class="pill" style="background:var(--{warna}-subtle);color:var(--{warna});width:52px;justify-content:center">{metode}</span>
  <div class="field mono" style="height:28px;flex:1;justify-content:flex-end;font-weight:600">{RUPIAH(jml)}</div>
  <div style="width:112px;text-align:right">{tempo_sel}</div>
  <div class="ico">{S.svg('x', 13, 2)}</div>
</div>''')

    return f'''<div class="card" style="padding:0;overflow:hidden">
  <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 13px;
    background:var(--surface-raised);border-bottom:1px solid var(--border)">
    <span style="font-size:13px;font-weight:600">Pembayaran</span>
    <div style="display:flex;align-items:center;gap:10px">
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer">
        <span style="width:15px;height:15px;border-radius:4px;border:1px solid var(--accent);background:var(--accent);
          color:var(--accent-foreground);display:flex;align-items:center;justify-content:center">{S.svg('check', 10, 3)}</span>
        Seluruhnya
      </label>
      <button class="btn ghost sm">{S.svg('plus', 13, 2.2)} Metode</button>
    </div>
  </div>
  {''.join(baris)}
  <div style="padding:10px 13px;background:var(--surface-raised);display:flex;justify-content:space-between;
    align-items:baseline;font-size:12px">
    <span style="color:var(--foreground-muted)">Total dibayarkan</span>
    <span class="mono" style="font-size:14px;font-weight:700;color:var(--accent)">{RUPIAH(DIBAYAR)}</span>
  </div>
</div>'''


def preview_jurnal():
    """Jurnal yang benar-benar ditulis backend untuk transaksi PENJUALAN.

    Diambil dari TransactionRepository::setCustomerPayments — debit per metode bayar
    (Kas/Bank/Piutang/Giro), kredit Penjualan sebesar total dikurangi ongkos kirim, dan
    kredit Pendapatan lain-lain sebesar ongkos kirim bila ada.

    Berbeda dari barang masuk: untuk penjualan, jurnalnya ditulis SEKETIKA saat transaksi
    disimpan (dispatchSync), bukan menunggu status naik. Jadi panel ini menggambarkan
    yang akan terjadi tepat saat tombol simpan ditekan.
    """
    AKUN_DEBIT = {'Kas': 'Kas', 'Bank': 'Bank', 'Utang': 'Piutang', 'Giro': 'Giro'}
    baris = []
    for metode, _w, jml, _t in BAYAR:
        baris.append(('D', AKUN_DEBIT.get(metode, metode), jml))
    baris.append(('K', 'Penjualan', TOTAL - ONGKIR))
    if ONGKIR:
        baris.append(('K', 'Pendapatan lain-lain', ONGKIR))

    debit = sum(n for t, _, n in baris if t == 'D')
    kredit = sum(n for t, _, n in baris if t == 'K')

    def sel(tipe, akun, jml):
        warna = 'destructive' if tipe == 'D' else 'success'
        # D dan K sendirian tidak menjelaskan apa pun bagi yang bukan orang akuntansi.
        judul = 'Debit' if tipe == 'D' else 'Kredit'
        return (f'<div style="display:flex;align-items:center;gap:8px;padding:5px 0;'
                f'border-bottom:1px solid var(--border-subtle)">'
                f'<span class="mono" title="{judul}" style="width:16px;height:16px;border-radius:4px;flex-shrink:0;'
                f'background:var(--{warna}-subtle);color:var(--{warna});font-size:9px;font-weight:700;cursor:help;'
                f'display:flex;align-items:center;justify-content:center">{tipe}</span>'
                f'<span style="flex:1;font-size:12px">{akun}</span>'
                f'<span class="mono" style="font-size:12px;font-weight:600">{RUPIAH(jml)}</span></div>')

    return f'''<div class="card" style="padding:13px 15px;display:flex;flex-direction:column;gap:10px">
    <span style="font-size:13px;font-weight:600">Preview jurnal</span>
    <span style="font-size:12px;line-height:17px;color:var(--foreground-muted);margin-top:-4px">
      Ditulis setelah transaksi disimpan.
    </span>
    <div style="display:flex;flex-direction:column">{''.join(sel(*b) for b in baris)}</div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;font-size:12px">
      <span style="color:var(--foreground-muted)">Seimbang</span>
      <span class="mono" style="color:var(--success);font-weight:600">{RUPIAH(debit)} = {RUPIAH(kredit)}</span>
    </div>
  </div>'''


def rel():
    def baris(l, v, mono=True):
        return (f'<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px">'
                f'<span style="color:var(--foreground-muted)">{l}</span>'
                f'<span class="{"mono" if mono else ""}">{v}</span></div>')

    def input_kanan(l, v):
        return (f'<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px">'
                f'<span style="color:var(--foreground-muted)">{l}</span>'
                f'<input class="mono" value="{v}" style="width:92px;height:26px;text-align:right;'
                f'border:1px solid var(--border-strong);border-radius:6px;padding:0 8px;font-size:12px;outline:0;'
                f'background:var(--surface);color:var(--foreground);font-family:\'JetBrains Mono\',monospace"></div>')

    return f'''<div style="width:284px;flex-shrink:0;display:flex;flex-direction:column;gap:10px">
  <div class="card" style="padding:13px 15px;display:flex;flex-direction:column;gap:10px">
    <span style="font-size:13px;font-weight:600">Ringkasan</span>
    <div style="display:flex;flex-direction:column;gap:6px">
      {baris('Subtotal', RUPIAH(SUB))}
      {input_kanan('Diskon', 0)}
      {input_kanan('Ongkos kirim', 0)}
    </div>
    <div style="height:1px;background:var(--border)"></div>
    <div style="display:flex;justify-content:space-between;align-items:baseline">
      <span style="font-size:13px;font-weight:600">Total</span>
      <span class="mono" style="font-size:22px;font-weight:700;letter-spacing:-0.025em;color:var(--accent)">{RUPIAH(TOTAL)}</span>
    </div>
    <div style="background:var(--surface-raised);border-radius:8px;padding:9px 11px;display:flex;flex-direction:column;gap:5px">
      {baris('Dibayarkan', RUPIAH(DIBAYAR))}
      <div style="display:flex;justify-content:space-between;font-size:12px">
        <span style="color:var(--foreground-muted)">Kembalian</span>
        <span class="mono" style="font-weight:600;color:var(--success)">0</span>
      </div>
    </div>
    <button class="btn" style="justify-content:center;width:100%">Simpan transaksi</button>
  </div>

  {kartu_customer()}
  {preview_jurnal()}

</div>'''


html = (S.head()
        + '<div class="root {{theme}}" style="display:flex;min-height:700px">\n'
        + S.sidebar('Transaksi')
        + '  <div style="flex:1;display:flex;flex-direction:column;min-width:0">\n'
        + S.topbar('Penjualan / Transaksi', 'Baru')
        + '    <div style="flex:1;padding:14px 18px;display:flex;gap:12px;align-items:flex-start">\n'
        + '      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:10px">'
        + identitas() + barang() + pembayaran() + '</div>\n'
        + rel()
        + '\n    </div>\n  </div>\n</div>\n</x-dc>\n'
        + '''<script data-dc-script data-props='{"tema":{"editor":"enum","options":["Terang","Gelap"],"default":"Terang","section":"Tampilan"}}'>
class Component extends DCLogic {
  renderVals() {
    const t = this.state?.tema ?? this.props.tema ?? 'Terang';
    return { theme: t === 'Gelap' ? 'dark' : 'light' };
  }
}
</script>\n</body>\n</html>\n''')
open('TransaksiBaru.dc.html', 'w').write(html)
print('TransaksiBaru.dc.html', len(html), 'byte')
