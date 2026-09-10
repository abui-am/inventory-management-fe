# Arah baru untuk /transaction/add. Bedanya dari POS.dc.html: entri barang jadi satu
# baris cepat di dalam tabel (bukan blok form terpisah), pembayaran jadi baris padat
# (bukan kartu besar), dan pintasan keyboard ditampilkan — layar ini dipakai sambil
# tangan di keyboard, bukan sambil mengarahkan kursor.
import _shell as S

S.ICONS.update({
    'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    'plus': '<path d="M12 5v14"/><path d="M5 12h14"/>',
    'search': '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    'chev': '<path d="m6 9 6 6 6-6"/>',
})

RUPIAH = lambda n: f"{n:,}".replace(",", ".")
KBD = ("font-family:'JetBrains Mono',monospace;font-size:10px;padding:1px 5px;border-radius:4px;"
       "border:1px solid var(--border);background:var(--surface-raised);color:var(--foreground-muted)")

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
    <span style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--foreground-subtle)">
      <span style="{KBD}">⌘I</span> cari barang &middot; <span style="{KBD}">↵</span> tambah
    </span>
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
    <button class="btn ghost sm">{S.svg('plus', 13, 2.2)} Metode</button>
  </div>
  {''.join(baris)}
  <div style="padding:7px 13px;display:flex;justify-content:space-between;font-size:12px">
    <span style="color:var(--foreground-muted)">Total dibayarkan</span>
    <span class="mono" style="font-weight:600">{RUPIAH(DIBAYAR)}</span>
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

    pintasan = ''.join(
        f'<div style="display:flex;justify-content:space-between;align-items:center;font-size:11px">'
        f'<span style="color:var(--foreground-muted)">{ket}</span><span style="{KBD}">{tombol}</span></div>'
        for tombol, ket in [('⌘I', 'Cari barang'), ('↵', 'Tambah ke daftar'), ('⌘↵', 'Simpan transaksi'), ('Esc', 'Batalkan')])

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
    <button class="btn" style="justify-content:space-between;width:100%">
      <span>Simpan transaksi</span>
      <span style="{KBD};background:transparent;border-color:rgba(255,255,255,.35);color:inherit">⌘↵</span>
    </button>
  </div>

  <div class="card" style="padding:11px 13px;display:flex;flex-direction:column;gap:6px">
    <span class="eyebrow">Pintasan</span>
    {pintasan}
  </div>
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
