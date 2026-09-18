# Generator artboard Buku Besar (/general-ledger dengan satu akun terpilih).
#
# Usulnya: Jurnal Umum dan Buku Besar jadi SATU halaman. Keduanya sudah memakai endpoint
# yang sama (POST /ledgers) dan kolom yang sama; bedanya cuma penyaringan. Artboard ini
# menggambarkan halaman yang sama begitu satu akun dipilih — itulah buku besar akun itu.
#
# Dua hal yang hanya ada di halaman Buku Besar lama dan harus ikut pindah:
#   1. Penambahan saldo periode (debit − kredit, arahnya mengikuti tipe akun)
#   2. Tipe akun (debit/kredit)
# Keduanya sudah tersedia di response yang sekarang: `total` {debit, credit, difference}
# dan `ledger_accounts` {name, type, balance}. Tidak ada data baru yang dijanjikan.
import _shell as S
import gen_jurnal as J

RP = J.RP

# Akun yang sedang dibuka. Semua angka di bawah konsisten dengan pilihan ini.
AKUN_AKTIF = 'Kas'
TIPE_AKUN = 'debit'
SALDO_AKUN = 8248500

# Agregat SELURUH hasil filter (37 baris), bukan lima baris yang kebetulan tampil —
# sama seperti `total` yang dikirim backend.
TOTAL_DEBIT = 1284000
TOTAL_KREDIT = 512000
PENAMBAHAN = TOTAL_DEBIT - TOTAL_KREDIT

# Satu halaman baris Kas. Saldo berjalannya menurun ke bawah karena urutannya terbaru
# dulu; baris teratas 8.248.500 = saldo akun di kartu kanan atas.
BARIS = [
    ('11 Sep', [
        ('06:00', 19000, None, 8248500, 'TRDO2609058', False),
        ('05:59', 24000, None, 8229500, 'TRDO2609057', False),
    ]),
    ('10 Sep', [
        ('18:53', 30000, None, 8205500, 'TRDO2609053', False),
        ('11:40', 19000, None, 8175500, 'TRDO2609049', True),
        ('09:12', None, 250000, 8156500, 'Beban', False),
    ]),
]

SALDO_AKUN_LAIN = [
    ('Penjualan', 17736000), ('Utang', 13328000), ('Harga Pokok Penjualan', 12920500),
    ('Kas', 8248500), ('Persediaan', 7657500), ('Piutang', 3645500), ('Beban', 2470000),
    ('Giro', 607000), ('Bank', -97500), ('Modal', 0),
]


def kartu(judul, nilai, catatan, warna=None, pill=None):
    kepala = f'<span class="eyebrow">{judul}</span>'
    if pill:
        kepala = (f'<div style="display:flex;align-items:center;gap:6px"><span class="eyebrow">{judul}</span>'
                  f'<span style="margin-left:auto">{pill}</span></div>')
    gaya_nilai = f'color:var(--{warna})' if warna else ''
    return f'''      <div class="card" style="padding:12px 14px;display:flex;flex-direction:column;gap:5px">
        {kepala}
        <span class="mono" style="font-size:21px;font-weight:600;letter-spacing:-0.02em;{gaya_nilai}">{nilai}</span>
        <span style="font-size:11px;color:var(--foreground-subtle)">{catatan}</span>
      </div>'''


def kartu_kpi():
    warna_akun, _ = J.GOLONGAN[J.AKUN[AKUN_AKTIF]]
    pil = (f'<span class="pill" style="background:var(--{warna_akun}-subtle);color:var(--{warna_akun})">'
           f'Akun {TIPE_AKUN}</span>')
    return f'''    <div style="display:grid;grid-template-columns:repeat(4, minmax(0, 1fr));gap:10px">
{kartu('Total debit', RP(TOTAL_DEBIT), f'Sisi debit {AKUN_AKTIF} pada periode ini')}
{kartu('Total kredit', RP(TOTAL_KREDIT), f'Sisi kredit {AKUN_AKTIF} pada periode ini')}
{kartu('Penambahan saldo', '+' + RP(PENAMBAHAN), 'Debit dikurangi kredit sepanjang periode', warna='success')}
{kartu(f'Saldo {AKUN_AKTIF}', RP(SALDO_AKUN), 'Posisi terakhir, di luar rentang tanggal', pill=pil)}
    </div>'''


def toolbar():
    warna, _ = J.GOLONGAN[J.AKUN[AKUN_AKTIF]]
    return f'''      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div class="field" style="width:210px;gap:7px;justify-content:space-between">
          <span style="display:flex;align-items:center;gap:7px">
            <span style="width:7px;height:7px;border-radius:2px;background:var(--{warna})"></span>
            <span style="font-weight:500">{AKUN_AKTIF}</span></span>
          {S.svg('down', 11, 2)}</div>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="field" style="width:210px;color:var(--foreground-subtle);gap:7px">
            {S.svg('search', 14, 1.9)}<span>Cari keterangan atau nominal…</span></div>
          <div class="field" style="gap:7px;color:var(--foreground-muted)">
            {S.svg('cal', 14, 1.9)}<span>4 — 11 Sep 2026</span>{S.svg('down', 11, 2)}</div>
        </div>
      </div>'''


def baris(jam, debit, kredit, saldo, asal, koreksi):
    kode = (f'<span class="mono" style="font-weight:500">{asal}</span>'
            if asal.startswith('TRDO') else f'<span style="font-weight:500">{asal}</span>')
    tanda = ('<span class="pill" style="background:var(--destructive-subtle);color:var(--destructive);'
             'flex-shrink:0">Koreksi</span>') if koreksi else ''
    sel_debit = (f'<span class="mono" style="font-weight:600;color:var(--destructive)">{RP(debit)}</span>'
                 if debit else '<span style="color:var(--foreground-subtle)">—</span>')
    sel_kredit = (f'<span class="mono" style="font-weight:600;color:var(--success)">{RP(kredit)}</span>'
                  if kredit else '<span style="color:var(--foreground-subtle)">—</span>')
    return f'''          <tr>
            <td class="td mono" style="color:var(--foreground-muted);white-space:nowrap">{jam}</td>
            <td class="td" style="font-size:12px">
              <span style="display:flex;align-items:baseline;gap:6px">{kode}{tanda}</span></td>
            <td class="td" style="text-align:right">{sel_debit}</td>
            <td class="td" style="text-align:right">{sel_kredit}</td>
            <td class="td mono" style="text-align:right;color:var(--foreground-muted)">{RP(saldo)}</td>
            <td class="td" style="text-align:right">
              <button class="ico" style="width:26px;height:26px;background:var(--surface)">
                {S.svg('eye', 13, 1.7)}</button></td>
          </tr>'''


def tabel():
    # Kolom Akun sengaja TIDAK ada di sini. Begitu satu akun dipilih, seluruh baris
    # memuat lencana yang sama persis — ia berhenti membedakan apa pun dan hanya
    # memakan lebar yang dibutuhkan kolom Sumber.
    out = ['''      <div class="card" style="overflow:hidden">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr>
            <th class="th" style="padding-top:10px;width:58px">Waktu</th>
            <th class="th" style="padding-top:10px">Sumber</th>
            <th class="th" style="padding-top:10px;text-align:right;width:130px">Debit</th>
            <th class="th" style="padding-top:10px;text-align:right;width:130px">Kredit</th>
            <th class="th" style="padding-top:10px;text-align:right;width:130px">Saldo</th>
            <th class="th" style="padding-top:10px;text-align:right;width:60px">Aksi</th>
          </tr></thead>
          <tbody>''']
    for tanggal, rows in BARIS:
        out.append(f'''          <tr>
            <td colspan="6" style="padding:11px 10px 5px;border-bottom:1px solid var(--border)">
              <span style="font-size:11px;font-weight:700">{tanggal}</span>
            </td>
          </tr>''')
        for r in rows:
            out.append(baris(*r))
    out.append('''          </tbody>
        </table>''')
    out.append(paginasi())
    out.append('      </div>')
    return '\n'.join(out)


def paginasi():
    tombol = []
    for n in ['1', '2', '3', '4']:
        aktif = n == '1'
        gaya = ('background:var(--accent);color:var(--accent-foreground);border-color:transparent'
                if aktif else 'background:var(--surface);color:var(--foreground-muted);border-color:var(--border)')
        tombol.append(f'<button class="btn sm" style="border:1px solid;{gaya};min-width:26px;'
                      f'justify-content:center;padding:0 6px">{n}</button>')
    return f'''        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;
          padding:9px 12px;background:var(--surface-raised);border-top:1px solid var(--border)">
          <span style="font-size:11px;color:var(--foreground-subtle)">
            <span class="mono" style="color:var(--foreground-muted)">1–5</span> dari
            <span class="mono" style="color:var(--foreground-muted)">37</span></span>
          <div style="display:flex;align-items:center;gap:5px">
            <div class="field" style="height:26px;font-size:12px;padding:0 7px;gap:5px">
              <span class="mono">10</span>{S.svg('down', 11, 2)}</div>
            <button class="ico" style="width:26px;height:26px;background:var(--surface);opacity:.4">
              {S.svg('left', 12, 2)}</button>
            {''.join(tombol)}
            <button class="ico" style="width:26px;height:26px;background:var(--surface)">
              {S.svg('right', 12, 2)}</button>
          </div>
        </div>'''


def panel_saldo():
    terbesar = max(abs(n) for _, n in SALDO_AKUN_LAIN)
    baris_akun = []
    for nama, nilai in SALDO_AKUN_LAIN:
        golongan = J.AKUN[nama]
        warna = J.GOLONGAN[golongan][0] if golongan else 'foreground-subtle'
        aktif = nama == AKUN_AKTIF
        lebar = abs(nilai) / terbesar * 100
        gaya_nama = 'font-weight:600' if aktif else ''
        gaya_nilai = 'color:var(--destructive)' if nilai < 0 else 'color:var(--foreground-muted)'
        tanda = ('<span class="pill" style="background:var(--accent-subtle);color:var(--accent);'
                 'flex-shrink:0">Dibuka</span>') if aktif else ''
        baris_akun.append(f'''        <div style="display:flex;flex-direction:column;gap:3px">
          <div style="display:flex;align-items:baseline;gap:8px">
            <span style="flex:1;min-width:0;font-size:12px;{gaya_nama}">{nama}</span>{tanda}
            <span class="mono" style="font-size:12px;{gaya_nilai}">{RP(nilai)}</span></div>
          <div style="height:5px;border-radius:99px;background:var(--surface-raised)">
            <div style="width:{lebar:.0f}%;height:100%;border-radius:99px;
              background:var(--{warna});opacity:{'1' if aktif else '.45'}"></div></div>
        </div>''')
    return f'''      <div class="card" style="padding:14px 16px;display:flex;flex-direction:column;gap:10px;align-self:start">
        <span style="font-size:13px;font-weight:600">Saldo akun</span>
        <span style="font-size:11px;color:var(--foreground-subtle);margin-top:-6px">
          Klik satu akun untuk membuka buku besarnya.</span>
{chr(10).join(baris_akun)}
      </div>'''


def legenda():
    return f'''      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--foreground-subtle)">
          {S.svg('info', 12, 1.9)}Buku besar {AKUN_AKTIF}: hanya sisi {AKUN_AKTIF} dari tiap ayat yang tampil,
          dengan saldo berjalannya.</span>
        <span style="width:1px;height:12px;background:var(--border)"></span>
        <span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--foreground-muted)">
          <span class="pill" style="background:var(--destructive-subtle);color:var(--destructive)">Koreksi</span>
          ayat yang membalik transaksi yang dibatalkan</span>
      </div>'''


def isi():
    return f'''    <div style="flex:1;padding:14px 18px;display:flex;flex-direction:column;gap:12px">

{kartu_kpi()}

{toolbar()}

    <div style="display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:10px;align-items:start">
      <div style="display:flex;flex-direction:column;gap:12px;min-width:0">
{tabel()}

{legenda()}
      </div>

{panel_saldo()}
    </div>

    </div>'''


def tulis():
    html = (S.head()
            + '<div class="root {{theme}}" style="display:flex;min-height:900px">\n'
            + S.sidebar('Buku Besar') + '\n'
            + '  <div style="flex:1;display:flex;flex-direction:column;min-width:0">\n'
            + S.topbar('Keuangan', 'Buku Besar') + '\n'
            + isi() + '\n'
            + '  </div>\n</div>\n'
            + S.TAIL + S.logic() + S.END)
    with open('BukuBesar.dc.html', 'w') as f:
        f.write(html)
    print('BukuBesar.dc.html', len(html), 'bytes')


if __name__ == '__main__':
    tulis()
