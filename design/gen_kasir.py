# Generator artboard "Laporan per Kasir" (/income-user-report).
#
# Layar lama menampilkan matriks TERBALIK: barisnya nama ukuran (Penjualan, Diskon,
# Ongkir, Total, Kas, Bank, …) dan kolomnya orang — jadi tiap kasir baru menambah satu
# kolom, dan tabelnya harus digulir ke samping dengan kolom pertama dipaku. Empat tab
# (Pendapatan / Pembelian / Beban / Total Balance) membelah satu jawaban jadi empat layar,
# padahal keempatnya datang dari SATU permintaan yang sama.
#
# Di sini orangnya jadi baris, ukurannya jadi kolom, dan keempat tab itu lebur jadi satu
# baris yang bisa dibuka. Semua angkanya dari `POST /income-report/user-report` tanpa
# parameter `type` (getUserAllReport) — persis yang sudah diambil layar lama.
#
# Satu temuan yang ikut digambar: `balance.payment_methods.debt` di backend adalah
# piutang penjualan DIKURANGI utang pembelian — dua hal yang berbeda dijumlahkan jadi satu
# angka. Di rincian, keduanya ditampilkan terpisah dari sumbernya masing-masing.
import _shell as S
import gen_audit as A

S.ICONS.update({
    'down2': '<path d="m6 9 6 6 6-6"/>',
    'right2': '<path d="m9 6 6 6-6 6"/>',
    'printer': '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="7" rx="2"/><path d="M6 14h12v7H6z"/>',
    'info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.5"/>',
    'users': '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 5.6"/>'
             '<path d="M17.5 14.2A6 6 0 0 1 21 20"/>',
    'eye': '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
})

RP = lambda n: ('−' if n < 0 else '') + f"{abs(n):,}".replace(",", ".")
HARI = '17 Sep 2026'

# nama, penjualan{kas,bank,piutang,giro}, pembelian{kas,utang}, beban{kas}
ORANG = [
    {
        'nama': 'Putri', 'peran': 'Kasir',
        'jual': {'Kas': 2_200_000, 'Bank': 900_000, 'Piutang': 480_000, 'Giro': 100_000},
        'beli': {}, 'beban': {'Kas': 120_000},
    },
    {
        'nama': 'Dewi', 'peran': 'Kasir',
        'jual': {'Kas': 1_220_000, 'Bank': 800_000, 'Piutang': 500_000, 'Giro': 40_000},
        'beli': {'Kas': 850_000}, 'beban': {'Kas': 75_000},
    },
    {
        'nama': 'Budi', 'peran': 'Kepala gudang',
        'jual': {}, 'beli': {'Kas': 1_000_000, 'Utang': 1_900_000}, 'beban': {'Kas': 30_000},
    },
]

METODE = ['Kas', 'Bank', 'Piutang', 'Giro', 'Utang']

jumlah = lambda d: sum(d.values())
saldo = lambda o: jumlah(o['jual']) - jumlah(o['beli']) - jumlah(o['beban'])

TOTAL_JUAL = sum(jumlah(o['jual']) for o in ORANG)
TOTAL_BELI = sum(jumlah(o['beli']) for o in ORANG)
TOTAL_BEBAN = sum(jumlah(o['beban']) for o in ORANG)
TOTAL_SALDO = TOTAL_JUAL - TOTAL_BELI - TOTAL_BEBAN


def angka(nilai, nada='var(--foreground)', tebal=600):
    kosong = 'color:var(--foreground-subtle);font-weight:400'
    gaya = kosong if nilai == 0 else f'color:{nada};font-weight:{tebal}'
    teks = '—' if nilai == 0 else RP(nilai)
    return f'<span class="mono" style="font-size:13px;{gaya}">{teks}</span>'


def inisial(nama):
    return f'''<span style="width:24px;height:24px;border-radius:50%;background:var(--accent-subtle);
      color:var(--accent);display:inline-flex;align-items:center;justify-content:center;font-size:11px;
      font-weight:700;flex-shrink:0">{nama[0]}</span>'''


def baris_orang(o, buka=False):
    s = saldo(o)
    nada = 'var(--success)' if s > 0 else ('var(--destructive)' if s < 0 else 'var(--foreground)')
    panah = S.svg('down2' if buka else 'right2', 12, 1.9)
    return f'''          <tr>
            <td class="td">
              <span style="display:inline-flex;align-items:center;gap:8px">
                <span style="color:var(--foreground-subtle);display:flex">{panah}</span>
                {inisial(o['nama'])}
                <span style="display:flex;flex-direction:column">
                  <span style="font-weight:600">{o['nama']}</span>
                  <span style="font-size:11px;color:var(--foreground-subtle)">{o['peran']}</span>
                </span>
              </span>
            </td>
            <td class="td" style="text-align:right">{angka(jumlah(o['jual']))}</td>
            <td class="td" style="text-align:right">{angka(jumlah(o['beli']))}</td>
            <td class="td" style="text-align:right">{angka(jumlah(o['beban']))}</td>
            <td class="td" style="text-align:right">{angka(s, nada, 700)}</td>
          </tr>'''


def rincian(o):
    """Panel yang terbuka di bawah barisnya: pecahan tiap kolom menurut cara bayar.

    Piutang dan Utang sengaja jadi dua baris terpisah meski backend menjumlahkannya jadi
    satu angka di `balance.payment_methods.debt`. Piutang adalah uang yang belum diterima
    dari customer, utang adalah uang yang belum dibayar ke supplier — menjumlahkannya
    menghasilkan angka yang tidak berarti apa-apa.
    """
    def baris(m):
        jual = o['jual'].get(m, 0)
        beli = o['beli'].get(m, 0)
        beban = o['beban'].get(m, 0)
        if not (jual or beli or beban):
            return ''
        s = jual - beli - beban
        nada = 'var(--success)' if s > 0 else ('var(--destructive)' if s < 0 else 'var(--foreground)')
        ket = ''
        if m == 'Piutang':
            ket = '<div style="font-size:11px;color:var(--warning)">belum diterima</div>'
        if m == 'Utang':
            ket = '<div style="font-size:11px;color:var(--warning)">belum dibayar</div>'
        return f'''              <tr>
                <td class="td" style="border-bottom-color:var(--border-subtle);padding-left:0">
                  <span style="color:var(--foreground-muted)">{m}</span>{ket}</td>
                <td class="td" style="border-bottom-color:var(--border-subtle);text-align:right">{angka(jual)}</td>
                <td class="td" style="border-bottom-color:var(--border-subtle);text-align:right">{angka(beli)}</td>
                <td class="td" style="border-bottom-color:var(--border-subtle);text-align:right">{angka(beban)}</td>
                <td class="td" style="border-bottom-color:var(--border-subtle);text-align:right">
                  {angka(s, nada)}</td>
              </tr>'''

    isi = ''.join(baris(m) for m in METODE)
    return f'''          <tr>
            <td class="td" colspan="5" style="background:var(--surface-raised);padding:10px 14px 12px 42px">
              <table style="width:100%;border-collapse:collapse">
                <thead><tr>
                  <th class="th" style="padding:0 0 4px;border:0">Dibayar melalui</th>
                  <th class="th" style="padding:0 0 4px;border:0;text-align:right;width:150px">Penjualan</th>
                  <th class="th" style="padding:0 0 4px;border:0;text-align:right;width:150px">Pembelian</th>
                  <th class="th" style="padding:0 0 4px;border:0;text-align:right;width:150px">Beban</th>
                  <th class="th" style="padding:0 0 4px;border:0;text-align:right;width:150px">Saldo</th>
                </tr></thead>
                <tbody>
{isi}
                </tbody>
              </table>
              <div style="font-size:11px;color:var(--foreground-subtle);margin-top:8px;line-height:1.5">
                Rincian beban {o['nama']} per jenis ada di halaman Beban; di sini hanya cara bayarnya.
              </div>
            </td>
          </tr>'''


def kpi(label, nilai, ket, nada='var(--foreground)', ket_nada='var(--foreground-subtle)'):
    return f'''      <div class="card" style="padding:11px 14px;display:flex;flex-direction:column;gap:2px;flex:1;min-width:0">
        <span style="font-size:11px;color:var(--foreground-subtle)">{label}</span>
        <span class="mono" style="font-size:19px;font-weight:700;letter-spacing:-.02em;color:{nada}">{nilai}</span>
        <span style="font-size:11px;color:{ket_nada}">{ket}</span>
      </div>'''


def preset(teks, aktif=False):
    gaya = ('background:var(--surface);color:var(--foreground);box-shadow:var(--shadow-sm);font-weight:600'
            if aktif else 'color:var(--foreground-muted)')
    return (f'<span style="display:inline-flex;align-items:center;height:26px;padding:0 10px;border-radius:6px;'
            f'font-size:12px;{gaya}">{teks}</span>')


def kepala():
    return f'''        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
          <div style="display:flex;flex-direction:column;gap:2px">
            <span style="font-size:15px;font-weight:700">Laporan per Kasir</span>
            <span style="font-size:12px;color:var(--foreground-subtle)">Uang yang masuk dan keluar lewat tiap
              orang di periode ini — dan berapa yang harusnya masih dipegang.</span>
          </div>
          <div style="display:flex;align-items:center;gap:7px">
            <div style="display:flex;align-items:center;gap:3px;padding:3px;border-radius:8px;
              background:var(--surface-raised)">
              {preset('Hari ini', True)}{preset('7 hari')}{preset('30 hari')}{preset('Bulan ini')}
            </div>
            <div class="field" style="height:28px;font-size:12px;gap:6px;padding:0 9px;color:var(--foreground-muted)">
              {S.svg('cal', 13, 1.8)}<span class="mono" style="font-size:12px;color:var(--foreground)">{HARI}</span>
              {S.svg('down2', 12, 1.9)}
            </div>
            <span class="btn ghost sm">{S.svg('printer', 13, 1.9)}Print</span>
          </div>
        </div>'''


def tabel(buka_index=None):
    baris = []
    for i, o in enumerate(ORANG):
        terbuka = buka_index == i
        baris.append(baris_orang(o, terbuka))
        if terbuka:
            baris.append(rincian(o))

    return f'''        <div class="card" style="overflow:hidden;display:flex;flex-direction:column;min-height:0">
          <table style="width:100%;border-collapse:collapse">
            <thead><tr style="background:var(--surface-raised)">
              <th class="th" style="padding-top:9px">Nama</th>
              <th class="th" style="padding-top:9px;text-align:right;width:170px">Penjualan</th>
              <th class="th" style="padding-top:9px;text-align:right;width:170px">Pembelian</th>
              <th class="th" style="padding-top:9px;text-align:right;width:170px">Beban</th>
              <th class="th" style="padding-top:9px;text-align:right;width:190px">Saldo</th>
            </tr></thead>
            <tbody>
{"".join(baris)}
            </tbody>
            <tfoot><tr style="background:var(--surface-raised)">
              <td class="td" style="border-bottom:0;font-weight:700">Semua orang</td>
              <td class="td" style="border-bottom:0;text-align:right">{angka(TOTAL_JUAL, tebal=700)}</td>
              <td class="td" style="border-bottom:0;text-align:right">{angka(TOTAL_BELI, tebal=700)}</td>
              <td class="td" style="border-bottom:0;text-align:right">{angka(TOTAL_BEBAN, tebal=700)}</td>
              <td class="td" style="border-bottom:0;text-align:right">
                {angka(TOTAL_SALDO, 'var(--success)', 700)}</td>
            </tr></tfoot>
          </table>
        </div>'''


def halaman():
    return f'''  <div style="display:flex;height:100%">
{S.sidebar('Laporan per Kasir')}
    <div style="flex:1;display:flex;flex-direction:column;min-width:0">
{S.topbar('Keuangan', 'Laporan per Kasir')}
      <div style="flex:1;min-height:0;padding:16px 20px;display:flex;flex-direction:column;gap:10px;overflow:hidden">
{kepala()}

        <div style="display:flex;gap:10px">
{kpi('Penjualan', RP(TOTAL_JUAL), f'Dari {len([o for o in ORANG if o["jual"]])} orang')}
{kpi('Pembelian', RP(TOTAL_BELI), 'uang toko yang dipakai beli barang')}
{kpi('Beban', RP(TOTAL_BEBAN), 'dibayar dari uang yang dipegang', 'var(--destructive)', 'var(--destructive)')}
{kpi('Saldo bersih', RP(TOTAL_SALDO), 'penjualan − pembelian − beban', 'var(--success)', 'var(--success)')}
        </div>

{tabel(buka_index=1)}

{A.catatan('Saldo bukan selalu setoran.',
           'Saldo positif berarti orang itu masih memegang uang toko dan harus menyetorkannya; negatif berarti '
           'uang toko yang dia keluarkan lebih besar daripada yang dia terima — biasa untuk yang tugasnya belanja '
           'barang. Piutang dan giro ikut terhitung sebagai penjualan padahal uangnya belum masuk, jadi yang '
           'dicocokkan dengan isi laci adalah baris Kas di rinciannya, bukan kolom Saldo.')}
      </div>
    </div>
  </div>'''


# ── Keadaan ──────────────────────────────────────────────────────────────────
def kosong():
    return f'''    <div class="card" style="width:520px;padding:38px 18px;display:flex;flex-direction:column;
      align-items:center;gap:7px;text-align:center">
      <span style="color:var(--foreground-subtle)">{S.svg('users', 26, 1.6)}</span>
      <span style="font-size:14px;font-weight:600">Belum ada aktivitas hari ini</span>
      <span style="font-size:12px;color:var(--foreground-muted);max-width:330px;line-height:1.5">
        Baris muncul sendiri begitu ada penjualan, pembelian, atau beban yang tercatat atas nama seseorang.</span>
      <div style="display:flex;gap:7px;margin-top:6px">
        <span class="btn sm">Lihat kemarin</span>
        <span class="btn ghost sm">Lihat 7 hari terakhir</span>
      </div>
    </div>'''


def kartu_sempit(o):
    s = saldo(o)
    nada = 'var(--success)' if s > 0 else ('var(--destructive)' if s < 0 else 'var(--foreground)')

    def baris(label, nilai, nada_nilai='var(--foreground)'):
        return f'''        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:3px 0">
          <span style="font-size:12px;color:var(--foreground-muted)">{label}</span>
          {angka(nilai, nada_nilai)}
        </div>'''

    return f'''      <div class="card" style="padding:12px 14px;display:flex;flex-direction:column;gap:2px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          {inisial(o['nama'])}
          <span style="display:flex;flex-direction:column">
            <span style="font-size:13px;font-weight:700">{o['nama']}</span>
            <span style="font-size:11px;color:var(--foreground-subtle)">{o['peran']}</span>
          </span>
        </div>
{baris('Penjualan', jumlah(o['jual']))}
{baris('Pembelian', jumlah(o['beli']))}
{baris('Beban', jumlah(o['beban']))}
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;
          border-top:1px solid var(--border);padding-top:6px;margin-top:4px">
          <span style="font-size:13px;font-weight:700">Saldo</span>
          {angka(s, nada, 700)}
        </div>
        <div style="font-size:11px;color:var(--foreground-subtle);margin-top:5px">
          Kas yang dipegang <span class="mono">{RP(o['jual'].get('Kas', 0) - o['beli'].get('Kas', 0)
                                              - o['beban'].get('Kas', 0))}</span></div>
      </div>'''


def keadaan():
    return f'''  <div style="padding:22px 24px;display:flex;flex-direction:column;gap:22px">
    <div>
{A.judul_blok('Rentang bawaan: hari ini', 'pagi hari tabelnya memang masih kosong')}
      <div style="display:flex;gap:18px;align-items:flex-start">
{kosong()}
        <div style="width:360px;display:flex;flex-direction:column;gap:8px">
          <div style="font-size:12px;color:var(--foreground-subtle)">Layar sempit — 360px</div>
{kartu_sempit(ORANG[1])}
{kartu_sempit(ORANG[2])}
        </div>
      </div>
    </div>
  </div>'''


def tulis():
    for nama, isi, tinggi, logic in (
        ('LaporanKasir.dc.html', halaman(), 'height:820px;display:flex', S.logic()),
        ('LaporanKasirKeadaan.dc.html', keadaan(), 'min-height:720px', A.logic_gelap()),
    ):
        html = (S.head() + '<div class="root {{theme}}" style="' + tinggi + '">\n'
                + '    <style>.root *{box-sizing:border-box}</style>\n'
                + isi + '\n</div>\n' + S.TAIL + logic + S.END)
        open(nama, 'w').write(html)
        print(nama, len(html), 'bytes')


if __name__ == '__main__':
    tulis()
