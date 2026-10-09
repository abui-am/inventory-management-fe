# Kembalian di /transaction/add. Hanya di sana.
#
# Dua hal yang membedakannya dari angka lain di kartu Ringkasan:
#
# 1. Ia TIDAK diketik. Nilainya turunan dari baris pembayaran yang sudah ada —
#    `totalPaid - totalPriceAfterDiscount` — jadi tidak ada field baru yang bisa
#    diisi salah, dan tidak ada yang perlu dikosongkan ulang.
# 2. Ia TIDAK dikirim. Yang masuk payload tetap sebesar total; uang lebih yang
#    disodorkan customer tidak pernah menyentuh jurnal.
#
# Ia muncul hanya saat LEBIH bayar. Kurang bayar sudah punya Selisih yang merah dan
# halangan "Pembayaran kurang" — menambah "Kembalian −58.000" di situ cuma mengulang
# kabar buruk yang sama dengan kata yang salah.
import _shell as S
import gen_audit as A

S.ICONS.update({
    'slash': '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
    'info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
    'alert': '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 2.4 17.1A2 2 0 0 0 4.1 20h15.8a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    'arrow': '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
})

RP = lambda n: f"{n:,}".replace(",", ".")

SUB = 942000
PILL = {'Kas': 'success', 'Bank': 'info', 'Giro': 'warning', 'Utang': 'destructive'}


def baris(label, nilai, warna=None, tebal=False):
    return (f'<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:12px">'
            f'<span style="color:var(--foreground-muted)">{label}</span>'
            f'<span class="mono" style="font-weight:{700 if tebal else 500}'
            f'{";color:var(--%s)" % warna if warna else ""}">{nilai}</span></div>')


def baris_kembalian(nilai):
    """Barisnya sendiri, di luar blok Selisih, dengan garis pemisah.

    Selisih menjawab "apakah hitungannya cocok"; kembalian menjawab "berapa lembar
    yang harus saya serahkan balik". Pertanyaan kedua itu yang dibawa tangan kasir,
    jadi ia yang dicetak paling besar — angka terbesar kedua di kartu ini setelah Total.
    """
    return f'''<div style="border-top:1px solid var(--border);margin-top:2px;padding-top:8px;
  display:flex;justify-content:space-between;align-items:baseline;gap:10px">
  <span style="font-size:13px;font-weight:600">Kembalian</span>
  <span class="mono" style="font-size:18px;font-weight:700;letter-spacing:-0.02em;color:var(--accent)">{RP(nilai)}</span>
</div>'''


def baris_bayar(metode, jumlah, tempo=None):
    warna = PILL[metode]
    tempo_sel = (f'<span style="font-size:11px;color:var(--foreground-muted)">{tempo}</span>'
                 if tempo else '<span style="font-size:11px;color:var(--foreground-subtle)">—</span>')
    return f'''<div style="display:flex;align-items:center;gap:9px;padding:7px 13px;
  border-bottom:1px solid var(--border-subtle)">
  <span class="pill" style="background:var(--{warna}-subtle);color:var(--{warna});width:52px;justify-content:center">{metode}</span>
  <div class="field mono" style="height:28px;flex:1;justify-content:flex-end;font-weight:600">{RP(jumlah)}</div>
  <div style="width:84px;text-align:right">{tempo_sel}</div>
  <div class="ico">{S.svg('x', 13, 2)}</div>
</div>'''


def kartu_bayar(bayar, lebar=330):
    isi = ''.join(baris_bayar(*b) for b in bayar)
    total = sum(b[1] for b in bayar)
    return f'''<div class="card" style="width:{lebar}px;padding:0;overflow:hidden">
  <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 13px;
    background:var(--surface-raised);border-bottom:1px solid var(--border)">
    <span style="font-size:13px;font-weight:600">Pembayaran</span>
    <span style="font-size:11px;color:var(--foreground-subtle)">angka yang diketik kasir</span>
  </div>
  {isi}
  <div style="padding:10px 13px;background:var(--surface-raised);display:flex;justify-content:space-between;
    align-items:baseline;font-size:12px">
    <span style="color:var(--foreground-muted)">Total dibayarkan</span>
    <span class="mono" style="font-size:14px;font-weight:700;color:var(--accent)">{RP(total)}</span>
  </div>
</div>'''


def kartu_ringkasan(dibayar, ada_kas=True, lebar=270):
    """Kartu Ringkasan apa adanya, hanya ditambah satu baris.

    Selisih tetap seperti sekarang, dengan satu koreksi: positif tidak lagi kuning.
    Kuning dulu dipakai karena lebih bayar sama-sama mengunci simpan; sekarang ia
    keadaan yang sah, jadi menandainya sebagai peringatan bertentangan dengan tombol
    yang justru hidup.
    """
    selisih = dibayar - SUB
    if selisih == 0:
        warna_selisih, teks_selisih = 'success', '0'
    elif selisih > 0:
        warna_selisih = 'success' if ada_kas else 'destructive'
        teks_selisih = RP(selisih)
    else:
        warna_selisih, teks_selisih = 'destructive', '−' + RP(-selisih)

    tampil_kembalian = selisih > 0 and ada_kas

    if selisih < 0:
        tombol = ('<div style="display:flex;flex-direction:column;gap:6px">'
                  '<button class="btn" style="justify-content:center;width:100%;opacity:.45">Simpan transaksi</button>'
                  f'<span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--destructive)">'
                  f'{S.svg("alert", 12, 2)}Pembayaran kurang '
                  f'<span class="mono" style="font-weight:600">{RP(-selisih)}</span></span></div>')
    elif selisih > 0 and not ada_kas:
        tombol = ('<div style="display:flex;flex-direction:column;gap:6px">'
                  '<button class="btn" style="justify-content:center;width:100%;opacity:.45">Simpan transaksi</button>'
                  f'<span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--destructive)">'
                  f'{S.svg("alert", 12, 2)}Pembayaran lebih '
                  f'<span class="mono" style="font-weight:600">{RP(selisih)}</span></span></div>')
    else:
        tombol = '<button class="btn" style="justify-content:center;width:100%">Simpan transaksi</button>'

    return f'''<div class="card" style="width:{lebar}px;padding:13px 15px;display:flex;flex-direction:column;gap:10px">
  <span style="font-size:13px;font-weight:600">Ringkasan</span>
  <div style="display:flex;flex-direction:column;gap:6px">
    {baris('Subtotal', RP(SUB))}
    {baris('Diskon', '0')}
    {baris('Ongkos kirim', '0')}
  </div>
  <div style="height:1px;background:var(--border)"></div>
  <div style="display:flex;justify-content:space-between;align-items:baseline">
    <span style="font-size:13px;font-weight:600">Total</span>
    <span class="mono" style="font-size:22px;font-weight:700;letter-spacing:-0.025em;color:var(--accent)">{RP(SUB)}</span>
  </div>
  <div style="background:var(--surface-raised);border-radius:8px;padding:9px 11px;display:flex;flex-direction:column;gap:5px">
    {baris('Dibayarkan', RP(dibayar))}
    {baris('Selisih', teks_selisih, warna_selisih, True)}
    {baris_kembalian(selisih) if tampil_kembalian else ''}
  </div>
  {tombol}
</div>'''


def kartu_keadaan(judul, ket, isi):
    return f'''<div style="display:flex;flex-direction:column;gap:8px">
  <div style="display:flex;flex-direction:column;gap:1px;max-width:270px">
    <span style="font-size:12px;font-weight:700">{judul}</span>
    <span style="font-size:11px;color:var(--foreground-subtle);line-height:15px">{ket}</span>
  </div>
  {isi}
</div>'''


def blok_keadaan():
    return f'''      <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">
{kartu_keadaan('Pas', 'tidak ada yang dikembalikan, barisnya tidak ada',
               kartu_ringkasan(942000))}
{kartu_keadaan('Kurang bayar', 'Selisih sudah mengatakannya; Kembalian tidak ikut muncul',
               kartu_ringkasan(884000))}
{kartu_keadaan('Lebih bayar, ada Kas', 'satu-satunya keadaan Kembalian tampil',
               kartu_ringkasan(1000000))}
{kartu_keadaan('Lebih bayar, tanpa Kas', 'tidak ada uang tunai di meja, jadi tidak ada yang bisa dikembalikan',
               kartu_ringkasan(1000000, ada_kas=False))}
      </div>'''


def panel_kirim():
    """Apa yang benar-benar berangkat ke backend saat lebih bayar."""
    def baris_kirim(kiri, kanan, warna=None, coret=False):
        gaya = 'text-decoration:line-through;color:var(--foreground-subtle)' if coret else ''
        return (f'<div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;'
                f'font-size:12px;padding:5px 0;border-bottom:1px solid var(--border-subtle)">'
                f'<span style="color:var(--foreground-muted)">{kiri}</span>'
                f'<span class="mono" style="font-weight:600;{gaya}'
                f'{";color:var(--%s)" % warna if warna and not coret else ""}">{kanan}</span></div>')

    return f'''<div class="card" style="width:330px;padding:14px 15px;display:flex;flex-direction:column;gap:11px">
  <div style="display:flex;flex-direction:column;gap:2px">
    <span style="font-size:14px;font-weight:700">Yang dikirim</span>
    <span style="font-size:11px;color:var(--foreground-muted);line-height:16px">
      Kasir mengetik 1.000.000. Yang berangkat tetap 942.000.
    </span>
  </div>
  <div style="display:flex;flex-direction:column">
    {baris_kirim('di layar — Kas', RP(1000000))}
    {baris_kirim('payments[0].cash', RP(942000), 'success')}
    {baris_kirim('payments[0].change', 'tidak dikirim', coret=True)}
  </div>
  <div style="display:flex;align-items:flex-start;gap:7px;padding:9px 11px;border-radius:9px;
    background:var(--surface-raised);color:var(--foreground-muted);font-size:11px;line-height:16px">
    {S.svg('slash', 13, 1.9)}
    <span>Kembalian tidak punya akun dan tidak punya kolom. Ia dihitung ulang tiap render
    dari baris pembayaran, tidak disimpan di state mana pun.</span>
  </div>
</div>'''


def panel_jurnal():
    def sel(tipe, akun, jml):
        warna = 'destructive' if tipe == 'D' else 'success'
        judul = 'Debit' if tipe == 'D' else 'Kredit'
        return (f'<div style="display:flex;align-items:center;gap:8px;padding:5px 0;'
                f'border-bottom:1px solid var(--border-subtle)">'
                f'<span class="mono" title="{judul}" style="width:16px;height:16px;border-radius:4px;flex-shrink:0;'
                f'background:var(--{warna}-subtle);color:var(--{warna});font-size:9px;font-weight:700;'
                f'display:flex;align-items:center;justify-content:center">{tipe}</span>'
                f'<span style="flex:1;font-size:12px">{akun}</span>'
                f'<span class="mono" style="font-size:12px;font-weight:600">{RP(jml)}</span></div>')

    return f'''<div class="card" style="width:300px;padding:14px 15px;display:flex;flex-direction:column;gap:10px">
  <div style="display:flex;flex-direction:column;gap:2px">
    <span style="font-size:14px;font-weight:700">Preview jurnal</span>
    <span style="font-size:11px;color:var(--foreground-muted);line-height:16px">
      Sama persis dengan sebelum ada Kembalian.
    </span>
  </div>
  <div style="display:flex;flex-direction:column">
    {sel('D', 'Kas', 942000)}
    {sel('K', 'Penjualan', 942000)}
  </div>
  <div style="display:flex;justify-content:space-between;align-items:baseline;font-size:12px">
    <span style="color:var(--foreground-muted)">Balance</span>
    <span class="mono" style="color:var(--success);font-weight:600">{RP(942000)} = {RP(942000)}</span>
  </div>
</div>'''


def panel_aturan():
    aturan = [
        ('Hanya di sini', '/transaction/add. Tidak di barang masuk, utang, beban, gaji, atau prive.'),
        ('Tidak diketik', 'Turunan dari baris pembayaran yang sudah ada. Tidak ada field baru.'),
        ('Hanya saat lebih', 'Kurang bayar memakai Selisih dan halangan yang sudah ada.'),
        ('Hanya kalau ada Kas', 'Lebih bayar lewat Bank/Giro/Utang tetap diblokir seperti sekarang.'),
        ('Tidak dikirim', 'Payload tetap sebesar total. Jurnal, buku besar, dan laporan tidak tersentuh.'),
    ]
    isi = ''
    for judul, ket in aturan:
        isi += (f'<div style="display:flex;flex-direction:column;gap:1px;padding:6px 0;'
                f'border-bottom:1px solid var(--border-subtle)">'
                f'<span style="font-size:12px;font-weight:600">{judul}</span>'
                f'<span style="font-size:11px;color:var(--foreground-muted);line-height:16px">{ket}</span></div>')

    return f'''<div class="card" style="width:300px;padding:14px 15px;display:flex;flex-direction:column;gap:8px">
  <span style="font-size:14px;font-weight:700">Lima batasnya</span>
  <div style="display:flex;flex-direction:column">{isi}</div>
</div>'''


def blok_mekanik():
    return f'''      <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">
{kartu_bayar([('Kas', 1000000, None)])}
{panel_kirim()}
{panel_jurnal()}
{panel_aturan()}
      </div>'''


def blok_satu_perubahan():
    """Satu-satunya perubahan aturan yang dibawa desain ini, dipisahkan supaya terlihat.

    Tanpa ini Kembalian tidak pernah berguna: ia hanya akan tampil di keadaan yang
    tombol simpannya mati, lalu hilang begitu kasir menurunkan angkanya supaya bisa
    disimpan.
    """
    def kolom(judul, warna, isi):
        return f'''<div style="width:330px;display:flex;flex-direction:column;gap:7px">
  <span class="pill" style="background:var(--{warna}-subtle);color:var(--{warna});align-self:flex-start">{judul}</span>
  <div class="card" style="padding:12px 14px;display:flex;flex-direction:column;gap:7px">{isi}</div>
</div>'''

    sebelum = (
        f'{baris("Kas diketik", RP(1000000))}'
        f'{baris("Selisih", RP(58000), "warning", True)}'
        '<div style="height:1px;background:var(--border-subtle)"></div>'
        f'<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--destructive)">'
        f'{S.svg("alert", 12, 2)}Simpan mati — "Pembayaran lebih 58.000"</div>'
        '<span style="font-size:11px;color:var(--foreground-muted);line-height:16px">'
        'Kasir harus mengetik ulang 942.000 supaya bisa disimpan, lalu menghitung kembaliannya '
        'di kepala atau di kalkulator.</span>')

    sesudah = (
        f'{baris("Kas diketik", RP(1000000))}'
        f'{baris("Selisih", RP(58000), "success", True)}'
        f'{baris("Kembalian", RP(58000), "accent", True)}'
        '<div style="height:1px;background:var(--border-subtle)"></div>'
        f'<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--success)">'
        f'{S.svg("arrow", 12, 2)}Simpan hidup — terkirim 942.000</div>'
        '<span style="font-size:11px;color:var(--foreground-muted);line-height:16px">'
        'Halangan "Pembayaran lebih" hanya dicabut kalau ada baris Kas. Kurang bayar tetap '
        'memblokir seperti sekarang.</span>')

    return f'''      <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">
{kolom('Sekarang', 'destructive', sebelum)}
{kolom('Sesudah', 'success', sesudah)}
      </div>'''


def papan():
    return f'''  <div style="padding:22px 24px;display:flex;flex-direction:column;gap:24px">
    <div>
{A.judul_blok('Empat keadaan kartu Ringkasan', 'barisnya ada di satu keadaan saja')}
{blok_keadaan()}
    </div>
    <div>
{A.judul_blok('Dari mana angkanya, dan ke mana ia tidak pergi', 'tidak ada field baru, tidak ada kolom baru')}
{blok_mekanik()}
    </div>
    <div>
{A.judul_blok('Satu aturan yang berubah', 'tanpa ini Kembalian hanya tampil saat simpan mati')}
{blok_satu_perubahan()}
    </div>
  </div>'''


def tulis():
    html = (S.head()
            + '<div class="root {{theme}}" style="min-height:1240px">\n'
            + '    <style>.root *{box-sizing:border-box}</style>\n'
            + papan() + '\n</div>\n' + S.TAIL + A.logic_gelap() + S.END)
    open('Kembalian.dc.html', 'w').write(html)
    print('Kembalian.dc.html', len(html), 'bytes')


if __name__ == '__main__':
    tulis()
