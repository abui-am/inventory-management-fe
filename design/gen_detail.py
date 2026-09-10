# Generator dua artboard: sheet detail transaksi, dan dua format cetak.
import _shell as S

# Ikon yang belum ada di shell.
S.ICONS.update({
    'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    'printer': '<path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6z"/>',
    'down': '<path d="M12 3v12"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M4 20h16"/>',
    'copy': '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
})

RUPIAH = lambda n: f"{n:,}".replace(",", ".")

ITEMS = [
    ("Teh Tubruk 200 g", "pak", 4, 17000, 68000),
    ("Teh Celup 25 pcs", "kotak", 1, 14000, 14000),
    ("Tepung Beras 500 g", "pak", 2, 13000, 26000),
    ("Telur Ayam 1 kg", "kg", 4, 33000, 132000),
]
SUB = sum(i[4] for i in ITEMS)
DISKON, ONGKIR = 0, 0
TOTAL = SUB - DISKON + ONGKIR
BAYAR = [("Utang", 240000, "Jatuh tempo 9 Okt 2026")]

def money_row(label, val, muted=True, strong=False):
    c = "var(--foreground-muted)" if muted else "var(--foreground)"
    w = "600" if strong else "500"
    return (f'<div style="display:flex;justify-content:space-between;align-items:baseline;font-size:12px">'
            f'<span style="color:var(--foreground-muted)">{label}</span>'
            f'<span class="mono" style="color:{c};font-weight:{w}">{val}</span></div>')

def section(title, body, first=False):
    top = "" if first else "border-top:1px solid var(--border);"
    return (f'<div style="{top}padding:10px 16px;display:flex;flex-direction:column;gap:6px">'
            f'<div class="eyebrow">{title}</div>{body}</div>')

def sheet():
    items = []
    for name, unit, qty, price, tot in ITEMS:
        items.append(
            f'<div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px">'
            f'  <div style="min-width:0">'
            f'    <div style="font-size:13px;font-weight:500">{name}</div>'
            f'    <div class="mono" style="font-size:11px;color:var(--foreground-subtle);margin-top:1px">'
            f'{qty} {unit} × {RUPIAH(price)}</div>'
            f'  </div>'
            f'  <div class="mono" style="font-size:13px;font-weight:600;white-space:nowrap">{RUPIAH(tot)}</div>'
            f'</div>')
    bayar = []
    for metode, jml, ket in BAYAR:
        bayar.append(
            f'<div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px">'
            f'  <div><span style="font-size:13px;font-weight:500">{metode}</span>'
            f'    <div style="font-size:11px;color:var(--foreground-subtle);margin-top:1px">{ket}</div></div>'
            f'  <span class="mono" style="font-size:13px;font-weight:600">{RUPIAH(jml)}</span>'
            f'</div>')

    pihak = ""
    for k, v in [("Customer", "Warung Bu Melati"), ("Kasir", "Super Admin"), ("Pengirim", "Super Admin")]:
        pihak += (f'<div style="display:flex;justify-content:space-between;font-size:12px">'
                  f'<span style="color:var(--foreground-muted)">{k}</span>'
                  f'<span style="font-weight:500">{v}</span></div>')

    return f'''<div style="width:480px;flex-shrink:0;background:var(--surface);border-left:1px solid var(--border);
  display:flex;flex-direction:column;box-shadow:var(--shadow-md)">

  <div style="height:48px;flex-shrink:0;border-bottom:1px solid var(--border);display:flex;align-items:center;
    justify-content:space-between;padding:0 16px;gap:12px">
    <div style="min-width:0">
      <div style="display:flex;align-items:center;gap:8px">
        <span class="mono" style="font-size:14px;font-weight:600">TRDO2609050</span>
        <span class="pill" style="background:var(--success-subtle);color:var(--success)">Diterima</span>
      </div>
      <div style="font-size:11px;color:var(--foreground-subtle);margin-top:1px">09 Sep 2026 · 19:48</div>
    </div>
    <div class="ico">{S.svg('x', 14, 2)}</div>
  </div>

  <div style="padding:7px 16px;border-bottom:1px solid var(--border);display:flex;gap:5px">
    <button class="btn sm ghost">{S.svg('printer', 13, 1.8)} Print</button>
    <button class="btn sm ghost">{S.svg('down', 13, 1.8)} Download</button>
    <div style="flex:1"></div>
    <div class="ico" title="Copy">{S.svg('copy', 13, 1.7)}</div>
  </div>

  {section('Total', f"""
    <div style="display:flex;align-items:baseline;justify-content:space-between">
      <span class="mono" style="font-size:21px;font-weight:700;letter-spacing:-0.02em;line-height:26px">Rp {RUPIAH(TOTAL)}</span>
      <span class="pill" style="background:var(--success-subtle);color:var(--success)">Lunas</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:3px;margin-top:1px">
      {money_row('Subtotal', RUPIAH(SUB))}
      {money_row('Diskon', '−' + RUPIAH(DISKON) if DISKON else '0')}
      {money_row('Ongkos kirim', RUPIAH(ONGKIR))}
    </div>""", first=True)}

  {section('Dibayar', ''.join(bayar))}

  {section(f'Barang · {len(ITEMS)}', '<div style="display:flex;flex-direction:column;gap:8px">' + ''.join(items) + '</div>')}

  {section('Pihak', '<div style="display:flex;flex-direction:column;gap:4px">' + pihak + '</div>')}

  <div style="margin-top:auto;border-top:1px solid var(--border);padding:8px 16px;background:var(--surface-raised);
    display:flex;justify-content:space-between;font-size:11px;color:var(--foreground-subtle)">
    <span>Nomor faktur</span><span class="mono">DO2609050</span>
  </div>
</div>'''


# ── latar: daftar transaksi yang diredupkan, supaya sheet terbaca sebagai lapisan ──
def belakang():
    baris = []
    for w, kode, cust, bayar, jml, st, warna in [
        ("09 Sep 14:32", "TRDO2609050", "Warung Bu Melati", "Utang", "240.000", "Diterima", "success"),
        ("09 Sep 13:05", "TRDO2609049", "Toko Rukun Tani", "Bank", "338.000", "Diterima", "success"),
        ("09 Sep 11:48", "TRDO2609048", "Warung Bu Melati", "Kas", "778.000", "Diterima", "success"),
        ("09 Sep 10:19", "TRDO2609047", "Toko Barokah", "Kas", "35.000", "Ditinjau", "info"),
        ("09 Sep 09:02", "TRDO2609045", "Warung Mbak Yuli", "Utang", "398.000", "Diterima", "success"),
        ("08 Sep 16:44", "TRDO2609046", "Warung Bu Sri", "Bank", "393.000", "Menunggu", "warning"),
        ("08 Sep 15:10", "TRDO2609043", "Toko Sejahtera", "Giro", "216.500", "Diterima", "success"),
    ]:
        baris.append(
            f'<tr><td class="td mono" style="color:var(--foreground-muted);white-space:nowrap">{w}</td>'
            f'<td class="td mono" style="font-weight:500">{kode}</td><td class="td">{cust}</td>'
            f'<td class="td" style="color:var(--foreground-muted)">{bayar}</td>'
            f'<td class="td mono" style="text-align:right;font-weight:600">{jml}</td>'
            f'<td class="td"><span class="pill" style="background:var(--{warna}-subtle);color:var(--{warna})">{st}</span></td></tr>')
    th = ''.join(f'<th class="th" style="padding-top:9px{";text-align:right" if h=="Jumlah" else ""}">{h}</th>'
                 for h in ["Waktu", "Kode", "Customer", "Pembayaran", "Jumlah", "Status"])
    return f'''<div style="flex:1;min-width:0;padding:12px 16px;opacity:.4;pointer-events:none">
  <div class="card" style="padding:0;overflow:hidden">
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:var(--surface-raised)">{th}</tr></thead>
      <tbody>{''.join(baris)}</tbody>
    </table>
  </div>
</div>'''


def tulis_detail():
    html = (S.head()
            + '<div class="root {{theme}}" style="display:flex;min-height:620px">\n'
            + S.sidebar('Transaksi')
            + '  <div style="flex:1;display:flex;flex-direction:column;min-width:0">\n'
            + S.topbar('Penjualan', 'Transaksi')
            + '    <div style="flex:1;display:flex;min-height:0;background:var(--background)">\n'
            + belakang() + sheet()
            + '\n    </div>\n  </div>\n</div>\n</x-dc>\n'
            + '''<script data-dc-script data-props='{"tema":{"editor":"enum","options":["Terang","Gelap"],"default":"Terang","section":"Tampilan"}}'>
class Component extends DCLogic {
  renderVals() {
    const t = this.state?.tema ?? this.props.tema ?? 'Terang';
    return { theme: t === 'Gelap' ? 'dark' : 'light' };
  }
}
</script>\n</body>\n</html>\n''')
    open('DetailTransaksi.dc.html', 'w').write(html)
    print('DetailTransaksi.dc.html', len(html), 'byte')


tulis_detail()
