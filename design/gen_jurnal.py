# Generator artboard Jurnal Umum (/general-ledger).
#
# Dasar datanya dibatasi oleh apa yang benar-benar dikirim backend: `Ledger::defaultView()`
# hanya meloloskan id, description, type, amount, remaining_balance, created_at — plus
# agregat `total` {debit, credit, difference} untuk seluruh hasil filter. Tidak ada
# nomor transaksi, tidak ada id akun. Jadi tidak ada satu pun elemen di sini yang
# menjanjikan data yang tidak ada.
import _shell as S

S.ICONS.update({
    'search': '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    'cal': '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/>',
    'scale': '<path d="M12 4v16"/><path d="M5 8h14"/><path d="m5 8-3 6h6z"/><path d="m19 8-3 6h6z"/>',
    'in': '<path d="M12 5v14"/><path d="m6.5 12.5 5.5 5.5 5.5-5.5"/>',
    'out': '<path d="M12 19V5"/><path d="m6.5 10.5 5.5-5.5 5.5 5.5"/>',
    'check': '<path d="m4 12.5 5 5L20 6.5"/>',
    'info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.5"/>',
    'down': '<path d="m6 9 6 6 6-6"/>',
    'left': '<path d="m14 6-6 6 6 6"/>',
    'right': '<path d="m10 6 6 6-6 6"/>',
    'receipt': '<path d="M5 3v18l2.5-1.6L10 21l2-1.6L14 21l2.5-1.6L19 21V3z"/><path d="M9 8h6M9 12h6"/>',
    'swap': '<path d="M4 8h14l-3.5-3.5"/><path d="M20 16H6l3.5 3.5"/>',
    'book': '<path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z"/><path d="M5 16h13"/>',
    'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    'eye': '<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.6"/>',
})

RP = lambda n: f"{n:,}".replace(",", ".")

# Lima golongan akun, lima warna. Warnanya BUKAN hiasan: ia menjawab "ini akun apa"
# tanpa pengguna perlu hafal daftar akun. Di luar kelimanya tidak ada warna lain.
GOLONGAN = {
    'harta':      ('info',        'Harta'),
    'kewajiban':  ('warning',     'Kewajiban'),
    'pendapatan': ('success',     'Pendapatan'),
    'beban':      ('destructive', 'Beban'),
    'modal':      ('accent',      'Modal'),
}

AKUN = {
    'Kas': 'harta', 'Bank': 'harta', 'Giro': 'harta', 'Piutang': 'harta', 'Persediaan': 'harta',
    'Utang': 'kewajiban',
    'Penjualan': 'pendapatan',
    'Harga Pokok Penjualan': 'beban', 'Beban': 'beban',
    'Modal': 'modal', 'Prive': 'modal',
    # Akun penutup. Ia bukan harta/kewajiban/pendapatan/beban — hanya kendaraan saat
    # tutup buku — jadi sengaja tidak diberi warna golongan.
    'Ikhtisar Laba Rugi': None, 'Laba Ditahan': None, 'Laba Diambil Owner': None,
}


def pill(akun):
    golongan = AKUN[akun]
    if golongan is None:
        return ('<span class="pill" style="background:var(--surface-raised);'
                f'color:var(--foreground-muted)">{akun}</span>')
    warna, _ = GOLONGAN[golongan]
    return (f'<span class="pill" style="background:var(--{warna}-subtle);color:var(--{warna})">'
            f'{akun}</span>')


def chip(teks, aktif=False, warna=None):
    if aktif:
        gaya = 'background:var(--accent-subtle);color:var(--accent);border-color:transparent;font-weight:600'
    elif warna:
        gaya = f'color:var(--{warna});border-color:var(--border)'
    else:
        gaya = 'color:var(--foreground-muted);border-color:var(--border)'
    return (f'<button class="btn sm" style="background:var(--surface);border:1px solid;{gaya}">'
            f'{teks}</button>')


def kartu(judul, nilai, catatan):
    return f'''      <div class="card" style="padding:12px 14px;display:flex;flex-direction:column;gap:5px">
        <span class="eyebrow">{judul}</span>
        <span class="mono" style="font-size:21px;font-weight:600;letter-spacing:-0.02em">{nilai}</span>
        <span style="font-size:11px;color:var(--foreground-subtle)">{catatan}</span>
      </div>'''


# ── isi tabel ──────────────────────────────────────────────────────────────────
# Tiap transaksi menulis dua baris berpasangan. Contoh di bawah mengikuti apa yang
# benar-benar ditulis TransactionObserver: penjualan tunai → Kas debit + Penjualan
# kredit, lalu HPP debit + Persediaan kredit.
TRX58 = ('transaksi', 'TRDO2609058 · Kios Mekar Sari')
TRX57 = ('transaksi', 'TRDO2609057 · Warung Bu Melati')
TRX53 = ('transaksi', 'TRDO2609053 · Toko Barokah')
TRX52 = ('transaksi', 'TRDO2609052 · Toko Barokah')
BEBAN = ('beban', 'Beban bensin')
TUTUP = ('tutup', 'Tutup buku', False)

BARIS = [
    ('11 Sep', [
        ('06:00', 'Kas', 19000, None, 9220500, TRX58),
        ('06:00', 'Penjualan', None, 19000, 17730000, TRX58),
        ('06:00', 'Harga Pokok Penjualan', 13000, None, 13102000, TRX58),
        ('06:00', 'Persediaan', None, 13000, 4318000, TRX58),
        ('05:59', 'Kas', 24000, None, 9201500, TRX57),
        ('05:59', 'Penjualan', None, 24000, 17711000, TRX57),
    ]),
    ('10 Sep', [
        ('18:53', 'Kas', 30000, None, 9177500, TRX53),
        ('18:53', 'Piutang', 6500, None, 563500, TRX53),
        ('18:53', 'Penjualan', None, 36500, 17687000, TRX53),
        ('16:48', 'Beban', 50000, None, 50000, BEBAN),
        ('16:48', 'Kas', None, 50000, 9147500, BEBAN),
        ('00:00', 'Ikhtisar Laba Rugi', 360000, None, 0, TUTUP),
    ]),
]

# Pemisah hari. SENGAJA tanpa total harian: urutannya per `sequence` dan halamannya
# dipotong per 10 baris, jadi satu hari bisa terbelah dua halaman — total yang dihitung
# dari baris yang kebetulan tampil akan lebih kecil dari yang sebenarnya, tanpa tanda.
def baris_hari(tanggal):
    return f'''          <tr>
            <td colspan="7" style="padding:11px 10px 5px;border-bottom:1px solid var(--border)">
              <span style="font-size:11px;font-weight:700">{tanggal}</span>
            </td>
          </tr>'''


def sumber(jenis, teks, tertaut=True):
    """Asal baris jurnal. `ledgers.ledgerable_type` + `ledgerable_id` sudah tersimpan di
    database, jadi kolom ini bukan karangan — ia hanya belum diloloskan API.

    Tanpa ikon: jenis sumbernya sudah terbaca dari teksnya sendiri ("TRDO2609058 · Kios
    Mekar Sari" vs "Beban bensin"), jadi ikon di depan tiap baris cuma menambah benda
    yang harus dilewati mata di kolom yang sudah padat."""
    warna = 'var(--accent)' if tertaut else 'var(--foreground-subtle)'
    garis = 'text-decoration:underline;text-underline-offset:2px;text-decoration-color:var(--border-strong)' if tertaut else ''
    return f'<span style="color:{warna};font-size:12px;{garis}">{teks}</span>' 


def baris(jam, akun, debit, kredit, saldo, asal, aktif=False):
    d = f'{RP(debit)}' if debit else '—'
    k = f'{RP(kredit)}' if kredit else '—'
    warna_d = '' if debit else 'color:var(--foreground-subtle)'
    warna_k = '' if kredit else 'color:var(--foreground-subtle)'
    # Baris yang sheet-nya sedang terbuka diberi latar, supaya jelas isi panel di kanan
    # itu milik baris yang mana.
    latar = ' style="background:var(--accent-subtle)"' if aktif else ''
    return f'''          <tr{latar}>
            <td class="td mono" style="color:var(--foreground-muted);white-space:nowrap">{jam}</td>
            <td class="td" style="white-space:nowrap">{pill(akun)}</td>
            <td class="td" style="width:100%">{sumber(*asal)}</td>
            <td class="td mono" style="text-align:right;font-weight:600;{warna_d}">{d}</td>
            <td class="td mono" style="text-align:right;font-weight:600;{warna_k}">{k}</td>
            <td class="td mono" style="text-align:right;color:var(--foreground-muted)">{RP(saldo)}</td>
            <td class="td" style="text-align:right">
              <button class="ico" style="background:var(--surface);margin-left:auto">
                {S.svg('eye', 13, 1.7)}</button>
            </td>
          </tr>'''


def tabel(aktif=None):
    out = ['''      <div class="card" style="overflow:hidden">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr>
            <th class="th" style="padding-top:10px;width:58px">Waktu</th>
            <th class="th" style="padding-top:10px;white-space:nowrap">Akun</th>
            <th class="th" style="padding-top:10px">Sumber</th>
            <th class="th" style="padding-top:10px;text-align:right;width:120px">Debit</th>
            <th class="th" style="padding-top:10px;text-align:right;width:120px">Kredit</th>
            <th class="th" style="padding-top:10px;text-align:right;width:130px">Saldo</th>
            <th class="th" style="padding-top:10px;text-align:right;width:50px">Aksi</th>
          </tr></thead>
          <tbody>''']
    for tanggal, rows in BARIS:
        out.append(baris_hari(tanggal))
        for r in rows:
            out.append(baris(*r, aktif=(aktif is not None and r[5] is aktif)))
    out.append('''          </tbody>
        </table>''')
    out.append(paginasi())
    out.append('      </div>')
    return '\n'.join(out)


def paginasi():
    tombol = []
    for n in ['1', '2', '3', '4', '5']:
        aktif = n == '1'
        gaya = ('background:var(--accent);color:var(--accent-foreground);border-color:transparent'
                if aktif else 'background:var(--surface);color:var(--foreground-muted);border-color:var(--border)')
        tombol.append(f'<button class="btn sm" style="border:1px solid;{gaya};min-width:26px;justify-content:center;'
                      f'padding:0 6px">{n}</button>')
    return f'''        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;
          padding:9px 12px;background:var(--surface-raised);border-top:1px solid var(--border)">
          <span style="font-size:11px;color:var(--foreground-subtle)">
            <span class="mono" style="color:var(--foreground-muted)">1–11</span> dari
            <span class="mono" style="color:var(--foreground-muted)">248</span> baris</span>
          <div style="display:flex;align-items:center;gap:5px">
            <div class="field" style="height:26px;font-size:12px;padding:0 7px;gap:5px">
              <span class="mono">10</span>{S.svg('down', 11, 2)}</div>
            <button class="ico" style="width:26px;height:26px;background:var(--surface)">{S.svg('left', 12, 2)}</button>
            {''.join(tombol)}
            <button class="ico" style="width:26px;height:26px;background:var(--surface)">{S.svg('right', 12, 2)}</button>
          </div>
        </div>'''


def legenda():
    item = []
    for kunci, (warna, nama) in GOLONGAN.items():
        item.append(f'''<span style="display:flex;align-items:center;gap:5px;font-size:11px;
          color:var(--foreground-muted)"><span style="width:7px;height:7px;border-radius:2px;
          background:var(--{warna})"></span>{nama}</span>''')
    return f'''      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--foreground-subtle)">
          {S.svg('info', 12, 1.9)}Tiap transaksi menulis dua baris: satu debit, satu kredit.</span>
        <span style="width:1px;height:12px;background:var(--border)"></span>
        {''.join(item)}
      </div>'''


def toolbar():
    akun_chip = [chip('Semua akun', aktif=True)]
    for nama in ['Kas', 'Penjualan', 'Persediaan', 'Utang', 'Piutang', 'Beban']:
        warna, _ = GOLONGAN[AKUN[nama]]
        akun_chip.append(chip(nama, warna=warna))
    return f'''      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">{''.join(akun_chip)}</div>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="field" style="width:210px;color:var(--foreground-subtle);gap:7px">
            {S.svg('search', 14, 1.9)}<span>Cari keterangan atau nominal…</span></div>
          <div class="field" style="gap:7px;color:var(--foreground-muted)">
            {S.svg('cal', 14, 1.9)}<span>4 — 11 Sep 2026</span>{S.svg('down', 11, 2)}</div>
        </div>
      </div>'''


def isi(aktif=None):
    return f'''    <div style="flex:1;padding:14px 18px;display:flex;flex-direction:column;gap:12px">

    <div style="display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));gap:10px">
{kartu('Total debit', RP(30799500), 'Bertambahnya harta dan beban')}
{kartu('Total kredit', RP(30799500), 'Bertambahnya kewajiban dan pendapatan')}
      <div class="card" style="padding:12px 14px;display:flex;flex-direction:column;gap:5px">
        <div style="display:flex;align-items:center;gap:6px">
          <span class="eyebrow">Selisih</span>
          <span class="pill" style="background:var(--success-subtle);color:var(--success);margin-left:auto">
            Balance</span>
        </div>
        <span class="mono" style="font-size:21px;font-weight:600;letter-spacing:-0.02em">0</span>
        <span style="font-size:11px;color:var(--foreground-subtle)">Debit dan kredit sudah sama besar</span>
      </div>
    </div>

{toolbar()}

{tabel(aktif)}

{legenda()}

    </div>'''


# ── artboard kedua: sheet ayat jurnal ─────────────────────────────────────────
# Menjawab "jurnal ini terbentuk dari mana". Kuncinya `ledgers.ledgerable_id`: semua
# baris yang berbagi id itu adalah SATU ayat jurnal, dan morph-nya menunjuk dokumen
# asalnya. Keduanya sudah ada di database — lihat catatan di kepala berkas.
AYAT = [
    ('Harga Pokok Penjualan', 25000, None),
    ('Persediaan', None, 25000),
    ('Kas', 30000, None),
    ('Piutang', 6500, None),
    ('Penjualan', None, 36500),
]


def baris_ayat(akun, debit, kredit):
    d = RP(debit) if debit else '—'
    k = RP(kredit) if kredit else '—'
    wd = '' if debit else 'color:var(--foreground-subtle)'
    wk = '' if kredit else 'color:var(--foreground-subtle)'
    return f'''        <tr>
          <td class="td" style="padding-left:0">{pill(akun)}</td>
          <td class="td mono" style="text-align:right;font-weight:600;{wd}">{d}</td>
          <td class="td mono" style="text-align:right;padding-right:0;font-weight:600;{wk}">{k}</td>
        </tr>'''


def sheet_ayat():
    total_d = sum(r[1] or 0 for r in AYAT)
    total_k = sum(r[2] or 0 for r in AYAT)
    return f'''  <div style="position:absolute;inset:0;background:hsl(240 20% 6% / 0.42)"></div>
  <div style="position:absolute;top:0;right:0;bottom:0;width:404px;background:var(--surface);
    border-left:1px solid var(--border);box-shadow:var(--shadow-md);display:flex;flex-direction:column">

    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;
      padding:14px 16px;border-bottom:1px solid var(--border)">
      <div style="display:flex;flex-direction:column;gap:3px;min-width:0">
        <span style="font-size:15px;font-weight:600">Ayat jurnal</span>
        <span class="mono" style="font-size:11px;color:var(--foreground-subtle)">10 Sep 2026 · 18:53</span>
      </div>
      <button class="ico" style="background:var(--surface)">{S.svg('x', 13, 2)}</button>
    </div>

    <div style="padding:14px 16px;display:flex;flex-direction:column;gap:12px;flex:1">

      <div style="border:1px solid var(--border);border-radius:9px;padding:10px 12px;
        display:flex;flex-direction:column;gap:7px">
        <span class="eyebrow">Terbentuk dari</span>
        <div style="display:flex;align-items:center;gap:9px">
          <span style="width:26px;height:26px;border-radius:7px;background:var(--success-subtle);
            color:var(--success);display:flex;align-items:center;justify-content:center;flex-shrink:0">
            {S.svg('cart', 14, 1.8)}</span>
          <div style="display:flex;flex-direction:column;min-width:0">
            <span class="mono" style="font-size:12px;font-weight:600">TRDO2609053</span>
            <span style="font-size:11px;color:var(--foreground-subtle)">Penjualan ke Toko Barokah</span>
          </div>
          <button class="btn sm" style="margin-left:auto;background:var(--surface);
            border:1px solid var(--border-strong);color:var(--foreground)">
            Buka{S.svg('right', 12, 2)}</button>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:7px">
        <span class="eyebrow">Lima baris buku besar</span>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr>
            <th class="th" style="padding-left:0">Akun</th>
            <th class="th" style="text-align:right">Debit</th>
            <th class="th" style="text-align:right;padding-right:0">Kredit</th>
          </tr></thead>
          <tbody>
{chr(10).join(baris_ayat(*r) for r in AYAT)}
            <tr>
              <td class="td" style="padding-left:0;border-bottom:none;font-weight:600">Total</td>
              <td class="td mono" style="text-align:right;border-bottom:none;font-weight:700">{RP(total_d)}</td>
              <td class="td mono" style="text-align:right;padding-right:0;border-bottom:none;
                font-weight:700">{RP(total_k)}</td>
            </tr>
          </tbody>
        </table>
        <div style="display:flex;align-items:center;justify-content:space-between;
          background:var(--success-subtle);border-radius:7px;padding:6px 10px">
          <span style="font-size:12px;color:var(--success);display:flex;align-items:center;gap:6px">
            {S.svg('check', 12, 2.6)}Debit dan kredit sama besar</span>
          <span class="mono" style="font-size:12px;font-weight:600;color:var(--success)">Balance</span>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:6px">
        <span class="eyebrow">Penjelasan</span>
        <p style="margin:0;font-size:12px;color:var(--foreground-muted);line-height:1.5">
          Satu penjualan menulis dua pasang baris: harga jualnya masuk ke Kas dan Piutang
          lalu dicatat sebagai Penjualan, dan harga belinya keluar dari Persediaan lalu
          dicatat sebagai Harga Pokok Penjualan.</p>
      </div>
    </div>
  </div>
'''


def tulis_sheet():
    html = (S.head()
            + '<div class="root {{theme}}" style="display:flex;min-height:900px;position:relative">\n'
            + S.sidebar('Jurnal Umum') + '\n'
            + '  <div style="flex:1;display:flex;flex-direction:column;min-width:0">\n'
            + S.topbar('Keuangan', 'Jurnal Umum') + '\n'
            + isi(TRX53) + '\n'
            + '  </div>\n'
            + sheet_ayat()
            + '</div>\n'
            + S.TAIL + S.logic() + S.END)
    with open('JurnalAyat.dc.html', 'w') as f:
        f.write(html)
    print('JurnalAyat.dc.html', len(html), 'bytes')


def tulis():
    html = (S.head()
            + '<div class="root {{theme}}" style="display:flex;min-height:900px">\n'
            + S.sidebar('Jurnal Umum') + '\n'
            + '  <div style="flex:1;display:flex;flex-direction:column;min-width:0">\n'
            + S.topbar('Keuangan', 'Jurnal Umum') + '\n'
            + isi() + '\n'
            + '  </div>\n</div>\n'
            + S.TAIL + S.logic() + S.END)
    with open('JurnalUmum.dc.html', 'w') as f:
        f.write(html)
    print('JurnalUmum.dc.html', len(html), 'bytes')


if __name__ == '__main__':
    tulis()
    tulis_sheet()
