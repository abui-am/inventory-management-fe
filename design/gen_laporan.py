# Generator artboard "Konversi Saldo" (/convert-balance) dan "Laporan Pendapatan"
# (/income-report).
#
# Konversi saldo = ledger top up: memindahkan uang KE sebuah akun buku besar.
# `CreateLedgerJob::setLedgerTopUpLedger` menulis D akun tujuan / K sumber dana, dan
# sumber "Uang Pribadi" dikreditkan ke MODAL — artinya itu setoran modal pemilik, bukan
# sekadar pindah kas. Layar lama tidak pernah menyebutkan itu sama sekali.
#
# Laporan pendapatan = laba rugi ringkas untuk satu rentang waktu:
# total_income = penjualan − HPP − diskon; total_profit = total_income − total beban.
import _shell as S
import gen_audit as A

S.ICONS.update({
    'swap': '<path d="M7 4v13"/><path d="m3.5 7.5 3.5-3.5 3.5 3.5"/><path d="M17 20V7"/><path d="m13.5 16.5 3.5 3.5 3.5-3.5"/>',
    'cash2': '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/>',
    'bank2': '<path d="M3 10h18"/><path d="M5 10v8M19 10v8M9 10v8M15 10v8"/><path d="m12 3 9 5H3z"/><path d="M3 21h18"/>',
    'wallet': '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 16.5z"/><path d="M16 12h3"/>',
    'info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.5"/>',
    'note': '<path d="M14 3v5h5"/><path d="M19 8v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7z"/>',
    'chart': '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M2 20h20"/>',
    'down2': '<path d="m6 9 6 6 6-6"/>',
    'right2': '<path d="m9 6 6 6-6 6"/>',
    'up': '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>',
    'down': '<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>',
    'printer': '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="7" rx="2"/><path d="M6 14h12v7H6z"/>',
})

RP = lambda n: f"{n:,}".replace(",", ".")


# ── Konversi Saldo ────────────────────────────────────────────────────────────
def sumber_dana(nama, ikon):
    return (f'<span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;'
            f'color:var(--foreground-muted)">{S.svg(ikon, 13, 1.8)}{nama}</span>')


def baris_konversi(waktu, sumber, ikon, akun, jumlah, catatan=''):
    ket = (f'<div style="font-size:11px;color:var(--foreground-subtle);margin-top:1px">{catatan}</div>'
           if catatan else '')
    return f'''          <tr>
            <td class="td mono" style="white-space:nowrap;color:var(--foreground-subtle)">{waktu}</td>
            <td class="td">{sumber_dana(sumber, ikon)}</td>
            <td class="td"><span style="font-weight:500">{akun}</span>{ket}</td>
            <td class="td mono" style="text-align:right;font-weight:600">{RP(jumlah)}</td>
          </tr>'''


def halaman_konversi():
    isi = [
        baris_konversi('16 Sep 08.40', 'Uang Pribadi', 'wallet', 'Kas', 5000000,
                       'dicatat sebagai setoran modal'),
        baris_konversi('14 Sep 15.10', 'Bank', 'bank2', 'Kas', 2000000),
        baris_konversi('12 Sep 09.25', 'Kas', 'cash2', 'Bank', 3500000),
        baris_konversi('09 Sep 11.00', 'Giro', 'bank2', 'Bank', 1750000),
    ]
    return f'''  <div style="display:flex;height:100%">
{S.sidebar('Konversi Saldo')}
    <div style="flex:1;display:flex;flex-direction:column;min-width:0">
{S.topbar('Keuangan', 'Konversi Saldo')}
      <div style="flex:1;min-height:0;padding:16px 20px;display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
          <div style="display:flex;flex-direction:column;gap:2px">
            <span style="font-size:15px;font-weight:700">Konversi Saldo</span>
            <span style="font-size:12px;color:var(--foreground-subtle)">Memindahkan uang ke sebuah akun buku
              besar — jurnalnya D akun tujuan / K sumber dananya.</span>
          </div>
          <div style="display:flex;align-items:center;gap:7px">
            <div class="field" style="height:28px;font-size:12px;gap:6px;padding:0 9px;color:var(--foreground-muted)">
              {S.svg('cal', 13, 1.8)}<span class="mono" style="font-size:12px;color:var(--foreground)">1–16 Sep 2026</span>
              {S.svg('down2', 12, 1.9)}
            </div>
            <span class="btn sm">{S.svg('swap', 13, 1.9)}Konversi saldo</span>
          </div>
        </div>

        <div style="display:flex;gap:10px">
{A.kpi('Total dikonversi', '12.250.000', 'periode 1–16 Sep 2026')}
{A.kpi('Setoran modal', '5.000.000', 'dari uang pribadi', 'var(--info)', 'var(--info)')}
{A.kpi('Pindah antar kas', '7.250.000', '3 konversi', 'var(--foreground)')}
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <div style="display:flex;flex-wrap:wrap;align-items:center;gap:3px;padding:3px;border-radius:8px;
            background:var(--surface-raised)">
            {A.tab('Semua', 4, True)}{A.tab('Ke Kas', 2)}{A.tab('Ke Bank', 2)}
          </div>
          <div class="field" style="width:240px;color:var(--foreground-subtle);gap:7px">
            {S.svg('search', 14, 1.9)}<span>Cari akun tujuan…</span>
          </div>
        </div>

        <div class="card" style="overflow:hidden;display:flex;flex-direction:column;min-height:0;flex:1">
          <div style="overflow:auto;min-height:0;flex:1">
          <table style="width:100%;border-collapse:collapse">
            <thead><tr style="background:var(--surface-raised)">
              <th class="th" style="padding-top:9px;width:150px">Waktu</th>
              <th class="th" style="padding-top:9px;width:190px">Sumber dana</th>
              <th class="th" style="padding-top:9px">Akun tujuan</th>
              <th class="th" style="padding-top:9px;text-align:right;width:160px">Jumlah</th>
            </tr></thead>
            <tbody>
{"".join(isi)}
            </tbody>
          </table>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 13px;
            border-top:1px solid var(--border);background:var(--surface-raised);font-size:12px;
            color:var(--foreground-muted)">
            <span>1–4 dari <span class="mono" style="color:var(--foreground)">4</span></span>
            <span>Konversi tidak menambah kekayaan — hanya memindahkannya</span>
          </div>
        </div>

{A.catatan('"Uang pribadi" bukan sekadar sumber dana.', 'Kalau sumbernya uang pribadi, backend mengkredit MODAL '
           '— artinya tercatat sebagai setoran modal pemilik, bukan pemindahan kas. Karena itu dialognya '
           'menunjukkan ayat jurnalnya sebelum disimpan.')}
      </div>
    </div>
  </div>'''


def kolom(label, isi, ket='', ikon=None, fokus=False, kanan='', lebar='100%'):
    garis = ('border-color:var(--accent);box-shadow:0 0 0 3px hsl(256 82% 70% / 0.18)'
             if fokus else 'border-color:var(--border-strong)')
    kiri = (f'<span style="display:flex;color:var(--foreground-subtle)">{S.svg(ikon, 14, 1.8)}</span>'
            if ikon else '')
    warna = 'var(--foreground)' if isi else 'var(--foreground-subtle)'
    bawah = (f'<div style="font-size:11px;color:var(--foreground-subtle);margin-top:5px">{ket}</div>' if ket else '')
    return f'''        <div style="width:{lebar}">
          <div style="font-size:12px;font-weight:600;margin-bottom:5px">{label}</div>
          <div class="field" style="width:100%;gap:8px;{garis}">
            {kiri}<span style="flex:1;color:{warna};font-size:13px">{isi}</span>{kanan}
          </div>
          {bawah}
        </div>'''


def ayat(akun_debit, akun_kredit, jumlah):
    def baris(akun, tipe):
        d = RP(jumlah) if tipe == 'debit' else '—'
        k = RP(jumlah) if tipe == 'kredit' else '—'
        wd = 'font-weight:600;color:var(--destructive)' if tipe == 'debit' else 'color:var(--foreground-subtle)'
        wk = 'font-weight:600;color:var(--success)' if tipe == 'kredit' else 'color:var(--foreground-subtle)'
        return f'''            <tr>
              <td style="padding:5px 0;font-size:12px">{akun}</td>
              <td class="mono" style="padding:5px 0;font-size:12px;text-align:right;{wd}">{d}</td>
              <td class="mono" style="padding:5px 0;font-size:12px;text-align:right;{wk}">{k}</td>
            </tr>'''
    return f'''        <div style="border-radius:9px;background:var(--surface-raised);padding:10px 13px">
          <div style="font-size:12px;font-weight:600;margin-bottom:4px">Jurnal yang ditulis</div>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <th class="th" style="padding:0 0 4px;border:0">Akun</th>
              <th class="th" style="padding:0 0 4px;border:0;text-align:right">Debit</th>
              <th class="th" style="padding:0 0 4px;border:0;text-align:right">Kredit</th>
            </tr>
{baris(akun_debit, 'debit')}
{baris(akun_kredit, 'kredit')}
          </table>
        </div>'''


def dialog_konversi(modal=False):
    if modal:
        isi = (kolom('Akun tujuan', 'Kas', ikon='cash2', kanan=S.svg('down2', 12, 1.9))
               + '\n' + kolom('Jumlah', '5.000.000')
               + '\n' + kolom('Sumber dana', 'Uang Pribadi', ikon='wallet', kanan=S.svg('down2', 12, 1.9), fokus=True)
               + f'''\n        <div style="display:flex;gap:8px;align-items:flex-start;padding:9px 11px;border-radius:9px;
          background:var(--info-subtle);color:var(--info);font-size:12px;line-height:1.45">
          {S.svg('info', 14, 1.9)}
          <span>Uang pribadi dicatat sebagai <b>setoran modal</b>, bukan pemindahan kas: kreditnya masuk ke akun
          Modal, dan modal pemilik bertambah sebesar ini.</span>
        </div>'''
               + '\n' + ayat('Kas', 'Modal', 5000000))
        return A.dialog('Konversi saldo',
                        'Uang berpindah begitu disimpan, dan jurnalnya ditulis saat itu juga.',
                        isi, A.tombol_batal() + A.tombol_utama('Simpan konversi'), lebar=440)

    isi = (kolom('Akun tujuan', 'Bank', ikon='bank2', kanan=S.svg('down2', 12, 1.9), fokus=True)
           + '\n' + kolom('Jumlah', '3.500.000')
           + '\n' + kolom('Sumber dana', 'Kas', ikon='cash2', kanan=S.svg('down2', 12, 1.9))
           + '\n' + ayat('Bank', 'Kas', 3500000))
    return A.dialog('Konversi saldo',
                    'Uang berpindah begitu disimpan, dan jurnalnya ditulis saat itu juga.',
                    isi, A.tombol_batal() + A.tombol_utama('Simpan konversi'), lebar=440)


def kartu_konversi(waktu, sumber, ikon, akun, jumlah):
    return f'''        <div class="card" style="padding:10px 12px;display:flex;flex-direction:column;gap:7px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
            <span style="display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600">
              {sumber_dana(sumber, ikon)}{S.svg('right2', 12, 2)}<span>{akun}</span></span>
            <span class="mono" style="font-size:14px;font-weight:700">{RP(jumlah)}</span>
          </div>
          <div style="border-top:1px solid var(--border-subtle);padding-top:6px">
            <span class="mono" style="font-size:11px;color:var(--foreground-subtle)">{waktu}</span>
          </div>
        </div>'''


def keadaan_konversi():
    return f'''  <div style="padding:22px 24px;display:flex;flex-direction:column;gap:22px">
    <div>
{A.judul_blok('Konversi saldo', 'dua sumber dana, dua arti jurnal yang berbeda')}
      <div style="display:flex;gap:18px;align-items:flex-start">
{dialog_konversi()}
{dialog_konversi(modal=True)}
      <div style="width:360px;display:flex;flex-direction:column;gap:8px">
        <div style="font-size:12px;color:var(--foreground-subtle)">Layar sempit — 360px</div>
{kartu_konversi('16 Sep 08.40', 'Uang Pribadi', 'wallet', 'Kas', 5000000)}
{kartu_konversi('12 Sep 09.25', 'Kas', 'cash2', 'Bank', 3500000)}
      </div>
      </div>
    </div>
  </div>'''



# ── Laporan Pendapatan ────────────────────────────────────────────────────────
#
# Angka contoh di bawah adalah SATU HARI (17 Sep 2026), bukan setengah bulan: rentang
# bawaan halaman ini sekarang hari ini. Laporan yang dibuka paling sering adalah laporan
# tutup toko sore hari, dan rentang bawaan yang lebar membuat angka hari ini tenggelam.
#
# Semua yang ditampilkan berasal dari dua endpoint yang sudah ada:
#   POST /income-report            → incomes{sales,hpp,discounts,shipping_cost},
#                                    stock_ins{purchases,shipping_cost}, expenses[], total_*
#   POST /income-report/user-report → per kasir + payment_methods{cash,bank,debt,current_account}
# Kartu "Dibanding kemarin" = panggilan kedua ke /income-report dengan rentang digeser
# mundur sepanjang rentang yang sedang dibuka. Tidak ada endpoint baru.

HARI = '17 Sep 2026'

PENJUALAN, HPP_, DISKON = 6_240_000, 4_180_000, 165_000
ONGKIR_TAGIH = 120_000
KASIR = [('Putri', 3_680_000), ('Dewi', 2_560_000)]
BEBAN = [('Beban Listrik', 186_000), ('Beban Ongkir', 120_000),
         ('Beban Bahan Habis Pakai', 75_000), ('Beban Penyusutan Persediaan', 48_000)]
PENDAPATAN_BERSIH = PENJUALAN - HPP_ - DISKON        # 1.895.000
TOTAL_BEBAN = sum(n for _, n in BEBAN)               # 429.000
LABA = PENDAPATAN_BERSIH - TOTAL_BEBAN               # 1.466.000

METODE = [('Kas', 'cash2', 3_420_000, 55), ('Bank', 'bank2', 1_700_000, 27),
          ('Piutang', 'note', 980_000, 16), ('Giro', 'bank2', 140_000, 2)]
PEMBELIAN, PEMBELIAN_ONGKIR, PEMBELIAN_RETUR = 3_750_000, 100_000, 250_000


def baris_lr(label, nilai, tanda='', nada='var(--foreground)', indent=0, anak=False, buka=None):
    panah = ''
    if buka is not None:
        panah = (f'<span style="display:inline-flex;color:var(--foreground-subtle);margin-right:6px">'
                 f'{S.svg("down2" if buka else "right2", 12, 1.9)}</span>')
    ukuran = '12px' if anak else '13px'
    warna_label = 'var(--foreground-subtle)' if anak else 'var(--foreground-muted)'
    return f'''        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;
          padding:5px 0 5px {indent}px">
          <span style="font-size:{ukuran};color:{warna_label};display:inline-flex;align-items:center">{panah}{label}</span>
          <span class="mono" style="font-size:{ukuran};font-weight:{600 if not anak else 500};color:{nada}">
            {tanda}{RP(nilai)}</span>
        </div>'''


def baris_total(label, nilai, nada='var(--foreground)', besar=False):
    ukuran = '15px' if besar else '13px'
    return f'''        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;
          border-top:1px solid var(--border);padding:8px 0 2px">
          <span style="font-size:{ukuran};font-weight:700">{label}</span>
          <span class="mono" style="font-size:{ukuran};font-weight:700;letter-spacing:-.02em;color:{nada}">
            {RP(nilai)}</span>
        </div>'''


def seksi(judul, isi):
    return f'''      <div style="display:flex;flex-direction:column">
        <div style="font-size:11px;font-weight:700;color:var(--foreground-subtle);margin-bottom:2px">{judul}</div>
{isi}
      </div>'''


def laporan(rugi=False, lebar=None):
    """Laba rugi — sekaligus komposisi bebannya.

    Kartu "Komposisi beban" yang berdiri sendiri mengulang empat baris yang sudah ada di
    seksi BEBAN persis di sebelahnya: nama dan nominal yang sama, hanya ditambah persentase
    dan bar. Dua kartu untuk satu daftar. Persentasenya dipindahkan ke barisnya sendiri di
    sini, dan kartunya dibuang — kartunya yang berlebih, bukan angkanya.
    """
    beban = list(BEBAN)
    total_beban = TOTAL_BEBAN
    if rugi:
        beban = beban + [('Beban Perbaikan Ruko', 2_400_000)]
        total_beban += 2_400_000
    laba = PENDAPATAN_BERSIH - total_beban
    nada_laba = 'var(--success)' if laba >= 0 else 'var(--destructive)'

    isi_pendapatan = (baris_lr('Penjualan', PENJUALAN, buka=True)
                      + ''.join(baris_lr(f'Kasir {n}', v, anak=True, indent=18) for n, v in KASIR)
                      + baris_lr('HPP', HPP_, tanda='−')
                      + baris_lr('Diskon penjualan', DISKON, tanda='−')
                      + baris_total('Pendapatan bersih', PENDAPATAN_BERSIH))
    isi_beban = (''.join(baris_bar(n, v, round(v / total_beban * 100),
                                   buka=False if n == 'Beban Listrik' else None)
                         for n, v in beban)
                 + baris_total('Total beban', total_beban, 'var(--destructive)'))

    # Di halaman: 1,6 bagian berbanding 1 bagian kolom kanan — laba rugi harus tetap yang
    # paling lebar berapa pun lebar layarnya. Di artboard keadaan: lebar tetap.
    ukuran = f'width:{lebar}px;flex-shrink:0' if lebar else 'flex:1.6;min-width:0'
    return f'''    <div class="card" style="{ukuran};padding:16px 18px;display:flex;
      flex-direction:column;gap:14px">
      <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px">
        <span style="font-size:14px;font-weight:700">Laba rugi</span>
        <span class="mono" style="font-size:11px;color:var(--foreground-subtle)">{HARI}</span>
      </div>
{seksi('Pendapatan', isi_pendapatan)}
{seksi('Beban', isi_beban)}
      <div style="border-radius:9px;background:var(--surface-raised);padding:10px 13px">
{baris_total('Laba bersih' if laba >= 0 else 'Rugi bersih', abs(laba), nada_laba, besar=True)}
        <div style="font-size:11px;color:var(--foreground-subtle);margin-top:5px">
          Pendapatan bersih dikurangi semua beban di periode ini.</div>
      </div>
      <div style="display:flex;gap:7px;align-items:flex-start;font-size:11px;color:var(--foreground-subtle);
        line-height:1.5;border-top:1px dashed var(--border);padding-top:9px">
        <span style="color:var(--foreground-muted);flex-shrink:0;margin-top:1px">{S.svg('info', 12, 1.9)}</span>
        <span>Ongkir <span class="mono" style="color:var(--foreground-muted)">{RP(ONGKIR_TAGIH)}</span> yang
          ditagih ke customer sudah ikut terhitung di Penjualan — sementara ongkir yang toko bayar sendiri
          muncul sebagai Beban Ongkir di atas.</span>
      </div>
    </div>'''


# ── Kepala halaman: rentang bawaan satu hari ─────────────────────────────────
def preset(teks, aktif=False):
    gaya = ('background:var(--surface);color:var(--foreground);box-shadow:var(--shadow-sm);font-weight:600'
            if aktif else 'color:var(--foreground-muted)')
    return (f'<span style="display:inline-flex;align-items:center;height:26px;padding:0 10px;border-radius:6px;'
            f'font-size:12px;{gaya}">{teks}</span>')


def rentang_kontrol():
    return f'''          <div style="display:flex;align-items:center;gap:3px;padding:3px;border-radius:8px;
            background:var(--surface-raised)">
            {preset('Hari ini', True)}{preset('7 hari')}{preset('30 hari')}{preset('Bulan ini')}
          </div>
          <div class="field" style="height:28px;font-size:12px;gap:6px;padding:0 9px;color:var(--foreground-muted)">
            {S.svg('cal', 13, 1.8)}<span class="mono" style="font-size:12px;color:var(--foreground)">{HARI}</span>
            {S.svg('down2', 12, 1.9)}
          </div>'''


def kpi_delta(label, nilai, persen, baik, nada='var(--foreground)'):
    """KPI dengan pembanding menempel pada angkanya — bukan di kartu terpisah. Angka
    laporan tidak bisa dinilai sendirian: 6 juta itu bagus atau jelek baru terjawab
    setelah dibandingkan dengan kemarin."""
    return f'''      <div class="card" style="padding:11px 14px;display:flex;flex-direction:column;gap:2px;flex:1;min-width:0">
        <span style="font-size:11px;color:var(--foreground-subtle)">{label}</span>
        <span class="mono" style="font-size:19px;font-weight:700;letter-spacing:-.02em;color:{nada}">{nilai}</span>
        <span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;
          color:var(--foreground-subtle)">{delta(persen, baik)} dibanding kemarin</span>
      </div>'''


# ── Kolom kanan: pembanding, uang masuk, pembelian, komposisi, rasio ─────────
def delta(persen, baik):
    """Panah + persentase. `baik` menentukan warnanya, bukan arah panahnya: beban yang
    naik itu kabar buruk, penjualan yang naik kabar baik."""
    naik = persen >= 0
    warna = 'var(--success)' if baik else 'var(--destructive)'
    panah = 'up' if naik else 'down'
    angka = f"{abs(persen):.1f}".replace('.', ',')
    return (f'<span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:600;'
            f'color:{warna}">{S.svg(panah, 11, 2.2)}{angka}%</span>')


def kartu(judul, kanan, isi, kaki=''):
    tutup = (f'<div style="font-size:11px;color:var(--foreground-subtle);margin-top:7px;line-height:1.5">{kaki}</div>'
             if kaki else '')
    kanan_html = (f'<span class="mono" style="font-size:11px;color:var(--foreground-subtle)">{kanan}</span>'
                  if kanan else '')
    return f"""      <div class="card" style="padding:12px 14px;display:flex;flex-direction:column;gap:2px">
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:4px">
          <span style="font-size:13px;font-weight:700">{judul}</span>{kanan_html}
        </div>
{isi}{tutup}
      </div>"""


def baris_bar(nama, nominal, persen, nada='var(--accent)', ikon=None, buka=None):
    panah = ''
    if buka is not None:
        panah = (f'<span style="display:inline-flex;color:var(--foreground-subtle);margin-right:6px">'
                 f'{S.svg("down2" if buka else "right2", 12, 1.9)}</span>')
    kiri = (f'<span style="display:inline-flex;align-items:center;gap:6px;color:var(--foreground-muted)">'
            f'{panah}{S.svg(ikon, 12, 1.8)}{nama}</span>' if ikon else
            f'<span style="display:inline-flex;align-items:center;color:var(--foreground-muted)">{panah}{nama}</span>')
    return f"""        <div style="display:flex;flex-direction:column;gap:4px;padding:5px 0">
          <div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;font-size:12px">
            {kiri}
            <span style="display:inline-flex;align-items:baseline;gap:7px">
              <span class="mono" style="font-size:12px;font-weight:600">{RP(nominal)}</span>
              <span class="mono" style="font-size:11px;color:var(--foreground-subtle);width:34px;
                text-align:right">{persen}%</span>
            </span>
          </div>
          <div style="height:4px;border-radius:3px;background:var(--surface-sunken);overflow:hidden">
            <div style="width:{persen}%;height:100%;background:{nada};border-radius:3px"></div>
          </div>
        </div>"""


def kartu_metode():
    """Uang penjualan dipecah menurut cara bayarnya.

    Ini yang hilang dari laporan lama dan paling dicari saat tutup toko: 'penjualan
    6.240.000' tidak menjawab berapa yang benar-benar ada di laci. Piutang dan giro
    ikut terhitung sebagai penjualan, tapi uangnya belum masuk."""
    nada = {'Piutang': 'var(--warning)', 'Giro': 'var(--warning)'}
    isi = ''.join(baris_bar(n, v, p, nada.get(n, 'var(--accent)'), ikon=ic) for n, ic, v, p in METODE)
    belum = sum(v for n, _, v, _ in METODE if n in ('Piutang', 'Giro'))
    return kartu('Uang masuk hari ini', RP(PENJUALAN), isi,
                 f'<b style="color:var(--warning)">{RP(belum)}</b> di antaranya belum jadi uang — piutang '
                 'customer dan giro yang belum cair. Yang benar-benar diterima hari ini '
                 f'<span class="mono">{RP(PENJUALAN - belum)}</span>.')


def kartu_pembelian():
    """Uang yang keluar untuk barang — sengaja DI LUAR laba rugi.

    Pertanyaan yang selalu muncul: 'laba katanya 1,4 juta, tapi kenapa kas berkurang?'
    Jawabannya pembelian barang, dan sampai sekarang angkanya tidak pernah ditampilkan
    di mana pun meski `POST /income-report` sudah mengirimkannya (`stock_ins`)."""
    # Barisnya muncul hanya kalau memang ada retur: baris "Retur barang 0" di hari biasa
    # cuma menambah satu angka yang tidak menjawab apa pun.
    retur = (baris_lr('Retur barang', PEMBELIAN_RETUR, tanda='−') if PEMBELIAN_RETUR else '')
    isi = (baris_lr('Barang dibeli', PEMBELIAN)
           + baris_lr('Ongkir dibayar', PEMBELIAN_ONGKIR)
           + retur
           + baris_total('Uang keluar untuk barang', PEMBELIAN + PEMBELIAN_ONGKIR - PEMBELIAN_RETUR))
    return kartu('Pembelian barang', '', isi,
                 'Tidak ikut mengurangi laba di kiri. Uang ini berubah jadi <b>Persediaan</b>, dan baru '
                 'masuk laporan sebagai HPP ketika barangnya terjual. Barang yang dikembalikan ke supplier '
                 'sudah dikurangkan.')


def halaman_laporan():
    return f'''  <div style="display:flex;height:100%">
{S.sidebar('Laporan Pendapatan')}
    <div style="flex:1;display:flex;flex-direction:column;min-width:0">
{S.topbar('Keuangan', 'Laporan Pendapatan')}
      <div style="flex:1;min-height:0;padding:16px 20px;display:flex;flex-direction:column;gap:10px;overflow:hidden">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
          <div style="display:flex;flex-direction:column;gap:2px">
            <span style="font-size:15px;font-weight:700">Laporan Pendapatan</span>
            <span style="font-size:12px;color:var(--foreground-subtle)">Dihitung ulang tiap kali periodenya
              diganti — tidak ada yang disimpan.</span>
          </div>
          <div style="display:flex;align-items:center;gap:7px">
{rentang_kontrol()}
            <span class="btn ghost sm">{S.svg('printer', 13, 1.9)}Print</span>
          </div>
        </div>

        <div style="display:flex;gap:10px">
{kpi_delta('Penjualan', RP(PENJUALAN), 13.9, True)}
{kpi_delta('Pendapatan bersih', RP(PENDAPATAN_BERSIH), 11.3, True)}
{kpi_delta('Total beban', RP(TOTAL_BEBAN), -16.2, True, 'var(--destructive)')}
{kpi_delta('Laba bersih', RP(LABA), 23.2, True, 'var(--success)')}
        </div>

        <div style="display:flex;gap:12px;align-items:flex-start;min-height:0;flex:1">
{laporan()}
          <div style="flex:1;display:flex;flex-direction:column;gap:10px;min-width:0">
{kartu_metode()}
{kartu_pembelian()}
          </div>
        </div>
{A.catatan('Tidak ada yang disimpan di sini.', 'Laporan dihitung ulang dari transaksi dan beban di periode yang '
           'dipilih; bawaannya hari ini. Yang menutup periode dan memindahkan laba ke modal adalah Perubahan Modal, '
           'bukan halaman ini. Rincian per kasir ada di dalam baris Penjualan dan tiap baris beban.')}
      </div>
    </div>
  </div>'''


# ── Keadaan: kosong, rugi, layar sempit ──────────────────────────────────────
def kartu_kosong():
    """Rentang bawaan satu hari membuat keadaan ini sering terlihat — jam delapan pagi
    laporan hari ini memang masih kosong. Karena itu ia tidak boleh cuma menulis
    'Tidak ada data' seperti layar lama, tapi menawarkan rentang yang pasti ada isinya."""
    return f'''    <div class="card" style="width:520px;padding:38px 18px;display:flex;flex-direction:column;
      align-items:center;gap:7px;text-align:center">
      <span style="color:var(--foreground-subtle)">{S.svg('chart', 26, 1.6)}</span>
      <span style="font-size:14px;font-weight:600">Belum ada transaksi hari ini</span>
      <span style="font-size:12px;color:var(--foreground-muted);max-width:330px;line-height:1.5">
        Laporan terisi sendiri begitu ada penjualan pertama. Beban dan pembelian yang sudah dicatat
        hari ini tetap dihitung.</span>
      <div style="display:flex;gap:7px;margin-top:6px">
        <span class="btn sm">Lihat kemarin</span>
        <span class="btn ghost sm">Lihat 7 hari terakhir</span>
      </div>
    </div>'''


def kartu_sempit():
    return f'''      <div class="card" style="padding:12px 14px;display:flex;flex-direction:column;gap:8px">
{baris_lr('Penjualan', PENJUALAN)}
{baris_lr('HPP', HPP_, tanda='−')}
{baris_lr('Diskon penjualan', DISKON, tanda='−')}
{baris_total('Pendapatan bersih', PENDAPATAN_BERSIH)}
{baris_total('Total beban', TOTAL_BEBAN, 'var(--destructive)')}
{baris_total('Laba bersih', LABA, 'var(--success)', besar=True)}
      </div>
      <div class="card" style="padding:12px 14px;display:flex;flex-direction:column;gap:2px">
        <div style="font-size:12px;font-weight:700;margin-bottom:2px">Uang masuk</div>
{''.join(baris_bar(n, v, p, 'var(--warning)' if n in ('Piutang', 'Giro') else 'var(--accent)') for n, _, v, p in METODE)}
      </div>'''


def keadaan_laporan():
    return f'''  <div style="padding:22px 24px;display:flex;flex-direction:column;gap:22px">
    <div>
{A.judul_blok('Rentang bawaan: hari ini', 'dua keadaan yang paling sering terlihat karenanya')}
      <div style="display:flex;gap:18px;align-items:flex-start">
{kartu_kosong()}
{laporan(rugi=True, lebar=660)}
      </div>
    </div>
    <div>
{A.judul_blok('Layar sempit — 360px', 'laba rugi dulu, baru uang masuk; kartu kanan menyusul di bawahnya')}
      <div style="width:360px;display:flex;flex-direction:column;gap:8px">
{kartu_sempit()}
      </div>
    </div>
  </div>'''


def tulis():
    for nama, isi, tinggi, logic in (
        ('Konversi.dc.html', halaman_konversi(), 'height:1000px;display:flex', S.logic()),
        ('KonversiSaldo.dc.html', keadaan_konversi(), 'min-height:720px', A.logic_gelap()),
        ('LaporanPendapatan.dc.html', halaman_laporan(), 'height:900px;display:flex', S.logic()),
        ('LaporanRugi.dc.html', keadaan_laporan(), 'min-height:1120px', A.logic_gelap()),
    ):
        html = (S.head() + '<div class="root {{theme}}" style="' + tinggi + '">\n'
                + '    <style>.root *{box-sizing:border-box}</style>\n'
                + isi + '\n</div>\n' + S.TAIL + logic + S.END)
        open(nama, 'w').write(html)
        print(nama, len(html), 'bytes')


if __name__ == '__main__':
    tulis()
