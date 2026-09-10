# Artboard kedua: dua format cetak berdampingan.
# Sengaja TIDAK memakai token tema — kertas selalu putih, tinta selalu hitam.
import _shell as S
from gen_detail import ITEMS, SUB, DISKON, ONGKIR, TOTAL, RUPIAH

MONO = "font-family:'JetBrains Mono',ui-monospace,Menlo,monospace"
SANS = "font-family:'Plus Jakarta Sans',system-ui,sans-serif"


def struk_80mm():
    """80mm termal. Lebar 302px = 80mm @96dpi. Monospace, satu kolom, tanpa garis tabel."""
    baris = []
    for name, unit, qty, price, tot in ITEMS:
        baris.append(
            f'<div style="margin-bottom:3px">'
            f'<div>{name}</div>'
            f'<div style="display:flex;justify-content:space-between">'
            f'<span>{qty} {unit} x {RUPIAH(price)}</span><span>{RUPIAH(tot)}</span></div></div>')
    garis = '<div style="border-top:1px dashed #000;margin:5px 0"></div>'
    return f'''<div style="width:302px;background:#fff;color:#000;{MONO};font-size:11px;line-height:1.42;
  padding:12px 12px;box-shadow:0 6px 20px rgba(0,0,0,.13)">
  <div style="text-align:center;margin-bottom:6px">
    <div style="font-size:14px;font-weight:600;letter-spacing:.06em">TOKO PUTRA PRIBUMI</div>
    <div style="font-size:10px">Jl. Raya Pasar No. 12, Cilacap</div>
    <div style="font-size:10px">0812-3456-7890</div>
  </div>
  {garis}
  <div style="display:flex;justify-content:space-between"><span>No</span><span>TRDO2609050</span></div>
  <div style="display:flex;justify-content:space-between"><span>Tanggal</span><span>09/09/26 19:48</span></div>
  <div style="display:flex;justify-content:space-between"><span>Kasir</span><span>Super Admin</span></div>
  <div style="display:flex;justify-content:space-between"><span>Pembeli</span><span>Warung Bu Melati</span></div>
  {garis}
  {''.join(baris)}
  {garis}
  <div style="display:flex;justify-content:space-between"><span>Subtotal</span><span>{RUPIAH(SUB)}</span></div>
  <div style="display:flex;justify-content:space-between"><span>Diskon</span><span>{RUPIAH(DISKON)}</span></div>
  <div style="display:flex;justify-content:space-between"><span>Ongkos kirim</span><span>{RUPIAH(ONGKIR)}</span></div>
  <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:600;margin-top:3px">
    <span>TOTAL</span><span>{RUPIAH(TOTAL)}</span></div>
  {garis}
  <div style="display:flex;justify-content:space-between"><span>Utang</span><span>{RUPIAH(TOTAL)}</span></div>
  <div style="font-size:10px;margin-top:2px">Jatuh tempo 09/10/2026</div>
  {garis}
  <div style="text-align:center;font-size:10px;line-height:1.5">
    Terima kasih<br>Barang yang sudah dibeli<br>tidak dapat ditukar
  </div>
</div>'''


def faktur_a5():
    """A5 potret, 559x794px @96dpi. Untuk arsip dan pembeli — bukan struk kasir."""
    tr = []
    for i, (name, unit, qty, price, tot) in enumerate(ITEMS, 1):
        tr.append(
            f'<tr><td style="padding:5px 0;border-bottom:1px solid #e6e6ea;color:#666">{i}</td>'
            f'<td style="padding:5px 0;border-bottom:1px solid #e6e6ea">{name}</td>'
            f'<td style="padding:5px 0;border-bottom:1px solid #e6e6ea;text-align:right;{MONO}">{qty} {unit}</td>'
            f'<td style="padding:5px 0;border-bottom:1px solid #e6e6ea;text-align:right;{MONO}">{RUPIAH(price)}</td>'
            f'<td style="padding:5px 0;border-bottom:1px solid #e6e6ea;text-align:right;{MONO};font-weight:600">{RUPIAH(tot)}</td></tr>')

    def total_row(label, val, big=False):
        fs = '15px' if big else '12px'
        fw = '700' if big else '500'
        return (f'<div style="display:flex;justify-content:space-between;gap:24px;font-size:{fs};font-weight:{fw};'
                f'padding:{"7px 0 0" if big else "3px 0"}{";border-top:1px solid #1a1a23;margin-top:5px" if big else ""}">'
                f'<span>{label}</span><span style="{MONO}">{val}</span></div>')

    return f'''<div style="width:559px;background:#fff;color:#1a1a23;{SANS};font-size:12px;
  padding:26px 30px;box-shadow:0 6px 20px rgba(0,0,0,.13);display:flex;flex-direction:column">

  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:12px;
    border-bottom:2px solid #1a1a23">
    <div>
      <div style="font-size:17px;font-weight:800;letter-spacing:-0.01em">Toko Putra Pribumi</div>
      <div style="font-size:11px;color:#666;line-height:1.6;margin-top:3px">
        Jl. Raya Pasar No. 12, Cilacap<br>0812-3456-7890</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:20px;font-weight:700;letter-spacing:.04em">FAKTUR</div>
      <div style="{MONO};font-size:12px;margin-top:2px">DO2609050</div>
    </div>
  </div>

  <div style="display:flex;gap:32px;padding:12px 0">
    <div style="flex:1">
      <div style="font-size:9px;font-weight:700;letter-spacing:.09em;color:#888">Ditagihkan kepada</div>
      <div style="font-weight:600;margin-top:4px;font-size:13px">Warung Bu Melati</div>
    </div>
    <div style="width:180px;display:flex;flex-direction:column;gap:4px">
      <div style="display:flex;justify-content:space-between"><span style="color:#666">Tanggal</span>
        <span style="{MONO}">09/09/2026</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:#666">Kode</span>
        <span style="{MONO}">TRDO2609050</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:#666">Kasir</span>
        <span>Super Admin</span></div>
    </div>
  </div>

  <table style="width:100%;border-collapse:collapse;font-size:12px">
    <thead><tr style="font-size:9px;font-weight:700;letter-spacing:.09em;color:#888">
      <th style="text-align:left;padding-bottom:6px;border-bottom:1px solid #1a1a23;width:22px">#</th>
      <th style="text-align:left;padding-bottom:6px;border-bottom:1px solid #1a1a23">Barang</th>
      <th style="text-align:right;padding-bottom:6px;border-bottom:1px solid #1a1a23">Jumlah</th>
      <th style="text-align:right;padding-bottom:6px;border-bottom:1px solid #1a1a23">Harga</th>
      <th style="text-align:right;padding-bottom:6px;border-bottom:1px solid #1a1a23">Total</th>
    </tr></thead>
    <tbody>{''.join(tr)}</tbody>
  </table>

  <div style="display:flex;justify-content:flex-end;margin-top:10px">
    <div style="width:238px">
      {total_row('Subtotal', RUPIAH(SUB))}
      {total_row('Diskon', RUPIAH(DISKON))}
      {total_row('Ongkos kirim', RUPIAH(ONGKIR))}
      {total_row('Total', 'Rp ' + RUPIAH(TOTAL), big=True)}
    </div>
  </div>

  <div style="margin-top:12px;border:1px solid #e6e6ea;border-radius:6px;padding:9px 12px">
    <div style="font-size:9px;font-weight:700;letter-spacing:.09em;color:#888;margin-bottom:6px">Pembayaran</div>
    <div style="display:flex;justify-content:space-between;font-size:12px">
      <span>Utang &middot; jatuh tempo 09/10/2026</span>
      <span style="{MONO};font-weight:600">{RUPIAH(TOTAL)}</span>
    </div>
  </div>

  <div style="margin-top:22px;display:flex;justify-content:space-between;gap:40px">
    <div style="flex:1;text-align:center">
      <div style="border-bottom:1px solid #1a1a23;height:34px"></div>
      <div style="font-size:11px;color:#666;margin-top:5px">Penerima</div>
    </div>
    <div style="flex:1;text-align:center">
      <div style="border-bottom:1px solid #1a1a23;height:34px"></div>
      <div style="font-size:11px;color:#666;margin-top:5px">Hormat kami</div>
    </div>
  </div>
</div>'''


def label(teks, ket):
    return (f'<div style="margin-bottom:8px">'
            f'<div style="font-size:13px;font-weight:600;color:var(--foreground)">{teks}</div>'
            f'<div style="font-size:11px;color:var(--foreground-muted);margin-top:1px">{ket}</div></div>')


html = (S.head()
        + '<div class="root {{theme}}" style="min-height:660px;padding:18px 20px;background:var(--surface-sunken)">\n'
        + '  <div style="display:flex;gap:24px;align-items:flex-start">\n'
        + '    <div>' + label('Struk 80&nbsp;mm', 'Printer termal kasir · monospace, satu kolom') + struk_80mm() + '</div>\n'
        + '    <div>' + label('Faktur A5', 'Untuk pembeli dan arsip · dicetak di A5 148 × 210 mm') + faktur_a5() + '</div>\n'
        + '  </div>\n</div>\n</x-dc>\n'
        + '''<script data-dc-script data-props='{"tema":{"editor":"enum","options":["Terang","Gelap"],"default":"Terang","section":"Tampilan"}}'>
class Component extends DCLogic {
  renderVals() {
    const t = this.state?.tema ?? this.props.tema ?? 'Terang';
    return { theme: t === 'Gelap' ? 'dark' : 'light' };
  }
}
</script>\n</body>\n</html>\n''')
open('Struk.dc.html', 'w').write(html)
print('Struk.dc.html', len(html), 'byte')
