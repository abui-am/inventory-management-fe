# Generator artboard "Perubahan Modal" (/laporan-perubahan-modal dan turunannya).
#
# Tiga route, satu cerita: daftar periode (`index`), tutup buku (`create`), dan laporan
# periode yang sudah ditutup (`[id]`). Layar lama memperlakukannya sebagai tiga halaman
# lepas — daftarnya cuma tiga kolom (Nama, Tanggal, tombol mata), dan halaman "create"
# menampilkan lima baris angka lalu satu tombol yang berubah jadi "Konfirmasi" tanpa
# pernah menyebutkan apa yang sebenarnya terjadi saat ditekan.
#
# Yang sebenarnya terjadi (CapitalReportController::storeReport):
#   1. Laba periode berjalan ditulis sebagai baris "Laba Ditahan",
#   2. Laba yang diambil pemilik ditulis sebagai "Laba Diambil Owner",
#   3. CreateLedgerFromCapitalReportsJob menulis jurnalnya ke buku besar,
#   4. saldo periode dipindahkan ke akun Modal, dan
#   5. periode itu TERKUNCI: `void()`, retur, dan penolakan barang masuk menolak bekerja
#      di tanggal yang sudah ditutup ("period_closed").
# Poin 5 tidak pernah disebut di layar lama sama sekali. Di desain ini ia jadi peringatan
# di dialognya, bukan catatan kecil.
#
# Semua angka dari endpoint yang sudah ada: POST /capital-report (periode berjalan maupun
# tersimpan) dan GET /capital-report/report-date (daftar periode).
import _shell as S
import gen_audit as A

S.ICONS.update({
    'down2': '<path d="m6 9 6 6 6-6"/>',
    'right2': '<path d="m9 6 6 6-6 6"/>',
    'lock': '<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    'printer': '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="7" rx="2"/><path d="M6 14h12v7H6z"/>',
    'book': '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5V5.5"/>',
    'info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.5"/>',
    'warn2': '<path d="M12 4.5 2.8 20h18.4z"/><path d="M12 10v4"/><path d="M12 17v.4"/>',
})

RP = lambda n: ('−' if n < 0 else '') + f"{abs(n):,}".replace(",", ".")

MULAI, SEKARANG = '1 Sep 2026', '18 Sep 2026'

MODAL_AWAL = 45_000_000
MODAL_DISETOR = 5_000_000
LABA_DITAHAN = 4_671_000
PRIVE = -1_200_000
DIAMBIL = 2_000_000

MODAL_BERJALAN = MODAL_AWAL + MODAL_DISETOR + LABA_DITAHAN + PRIVE
MODAL_SETELAH_AMBIL = MODAL_BERJALAN - DIAMBIL

PERIODE = [
    ('1 Ags 2026', '31 Ags 2026', 45_000_000),
    ('1 Jul 2026', '31 Jul 2026', 41_380_000),
    ('1 Jun 2026', '30 Jun 2026', 38_950_000),
]


# ── Kartu periode berjalan ───────────────────────────────────────────────────
def baris(label, nilai, ket='', tanda='', nada='var(--foreground)'):
    ket_html = (f'<div style="font-size:11px;color:var(--foreground-subtle);margin-top:1px">{ket}</div>'
                if ket else '')
    return f'''        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:6px 0">
          <div style="min-width:0">
            <span style="font-size:13px;color:var(--foreground-muted)">{label}</span>{ket_html}
          </div>
          <span class="mono" style="font-size:13px;font-weight:600;color:{nada}">{tanda}{RP(abs(nilai))}</span>
        </div>'''


def baris_total(label, nilai, besar=False, nada='var(--foreground)'):
    ukuran = '15px' if besar else '13px'
    return f'''        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;
          border-top:1px solid var(--border);padding:8px 0 2px">
          <span style="font-size:{ukuran};font-weight:700">{label}</span>
          <span class="mono" style="font-size:{ukuran};font-weight:700;letter-spacing:-.02em;color:{nada}">
            {RP(nilai)}</span>
        </div>'''


def kartu_berjalan(dengan_ambil=False, judul='Periode berjalan', ket=None):
    """Susunannya mengikuti laporan perubahan modal yang sebenarnya: modal awal, lalu yang
    menambah, lalu yang mengurangi, baru modal akhir. Layar lama menumpuk keempatnya
    sebagai daftar datar tanpa tanda plus/minus, jadi Prive terbaca seolah menambah."""
    ket = ket if ket is not None else f'{MULAI} — {SEKARANG} · belum ditutup'
    ambil = baris('Laba diambil pemilik', DIAMBIL, 'diambil dari laba periode ini', '−',
                  'var(--destructive)') if dengan_ambil else ''
    akhir = MODAL_SETELAH_AMBIL if dengan_ambil else MODAL_BERJALAN

    return f'''    <div class="card" style="flex:1.6;min-width:0;padding:16px 18px;display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px">
        <span style="font-size:14px;font-weight:700">{judul}</span>
        <span class="mono" style="font-size:11px;color:var(--foreground-subtle)">{ket}</span>
      </div>
      <div style="display:flex;flex-direction:column">
{baris('Modal awal', MODAL_AWAL, 'modal akhir periode sebelumnya')}
{baris('Modal disetor', MODAL_DISETOR, 'uang pribadi yang masuk lewat Konversi Saldo', '+', 'var(--success)')}
{baris('Laba ditahan', LABA_DITAHAN, 'laba bersih periode ini, dari Laporan Pendapatan', '+', 'var(--success)')}
{baris('Prive', PRIVE, 'uang toko yang dipakai pemilik', '−', 'var(--destructive)')}
{ambil}
{baris_total('Modal akhir', akhir, besar=True)}
      </div>
      <div style="display:flex;gap:7px;align-items:flex-start;font-size:11px;color:var(--foreground-subtle);
        line-height:1.5;border-top:1px dashed var(--border);padding-top:9px">
        <span style="color:var(--foreground-muted);flex-shrink:0;margin-top:1px">{S.svg('info', 12, 1.9)}</span>
        <span>Angka ini dihitung ulang tiap kali halaman dibuka dan <b>belum ada di buku besar</b>. Ia baru
          ditulis — dan modal pemilik baru benar-benar berubah — saat periodenya ditutup.</span>
      </div>
    </div>'''


# ── Daftar periode yang sudah ditutup ────────────────────────────────────────
def baris_periode(mulai, selesai, modal, terakhir=False):
    garis = 'border-bottom:0' if terakhir else ''
    return f'''            <tr>
              <td class="td" style="{garis}">
                <span style="display:inline-flex;align-items:center;gap:8px">
                  <span style="color:var(--foreground-subtle);display:flex">{S.svg('lock', 13, 1.8)}</span>
                  <span style="font-weight:500">{mulai} — {selesai}</span>
                </span>
              </td>
              <td class="td mono" style="{garis};text-align:right">{RP(modal)}</td>
              <td class="td" style="{garis};text-align:right">
                <span class="btn ghost sm">Lihat</span>
              </td>
            </tr>'''


def kartu_periode():
    baris_baris = [baris_periode(*p, terakhir=(i == len(PERIODE) - 1)) for i, p in enumerate(PERIODE)]
    return f'''    <div class="card" style="flex:1;min-width:0;overflow:hidden;display:flex;flex-direction:column">
      <div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:12px 14px 8px">
        <span style="font-size:14px;font-weight:700">Periode yang sudah ditutup</span>
        <span style="font-size:11px;color:var(--foreground-subtle)">terbaru di atas</span>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:var(--surface-raised)">
          <th class="th">Periode</th>
          <th class="th" style="text-align:right;width:150px">Modal akhir</th>
          <th class="th" style="text-align:right;width:90px"></th>
        </tr></thead>
        <tbody>
{"".join(baris_baris)}
        </tbody>
      </table>
    </div>'''


def halaman():
    return f'''  <div style="display:flex;height:100%">
{S.sidebar('Perubahan Modal')}
    <div style="flex:1;display:flex;flex-direction:column;min-width:0">
{S.topbar('Keuangan', 'Perubahan Modal')}
      <div style="flex:1;min-height:0;padding:16px 20px;display:flex;flex-direction:column;gap:10px;overflow:hidden">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
          <div style="display:flex;flex-direction:column;gap:2px">
            <span style="font-size:15px;font-weight:700">Perubahan Modal</span>
            <span style="font-size:12px;color:var(--foreground-subtle)">Bagaimana modal pemilik berubah sejak
              tutup buku terakhir — dan apa yang terjadi kalau periode ini ditutup.</span>
          </div>
          <div style="display:flex;align-items:center;gap:7px">
            <span class="btn ghost sm">{S.svg('printer', 13, 1.9)}Print</span>
            <span class="btn sm">{S.svg('lock', 13, 1.9)}Tutup buku</span>
          </div>
        </div>

        <div style="display:flex;gap:10px">
{A.kpi('Modal sekarang', RP(MODAL_BERJALAN), 'kalau periode ini ditutup hari ini')}
{A.kpi('Laba belum ditahan', RP(LABA_DITAHAN), 'dari Laporan Pendapatan', 'var(--success)', 'var(--success)')}
{A.kpi('Prive periode ini', RP(abs(PRIVE)), 'uang toko yang dipakai pemilik', 'var(--destructive)',
       'var(--destructive)')}
{A.kpi('Periode berjalan', '18 hari', f'sejak {MULAI}')}
        </div>

        <div style="display:flex;gap:12px;align-items:flex-start;min-height:0;flex:1">
{kartu_berjalan()}
{kartu_periode()}
        </div>

{A.catatan('Tutup buku menulis ke buku besar, dan mengunci periodenya.',
           'Laba periode ini dipindahkan ke akun Modal lewat jurnal — bukan sekadar dicatat di layar. Sesudahnya '
           'transaksi bertanggal di dalam periode itu tidak bisa lagi dibatalkan, diretur, atau ditolak, karena '
           'jurnal penutupnya sudah terbit.')}
      </div>
    </div>
  </div>'''


# ── Keadaan: dialog tutup buku, laporan tersimpan, kosong, layar sempit ──────
def kolom_isian(label, isi, ket):
    return f'''        <div>
          <div style="font-size:12px;font-weight:600;margin-bottom:5px">{label}</div>
          <div class="field" style="width:100%;gap:8px;border-color:var(--accent);
            box-shadow:0 0 0 3px hsl(256 82% 70% / 0.18)">
            <span style="flex:1;font-size:13px;text-align:right" class="mono">{isi}</span>
          </div>
          <div style="font-size:11px;color:var(--foreground-subtle);margin-top:5px">{ket}</div>
        </div>'''


def ringkas(label, nilai, tebal=False, nada='var(--foreground)'):
    berat = '700' if tebal else '500'
    return f'''          <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;
            font-size:12px;padding:2px 0">
            <span style="color:var(--foreground-muted)">{label}</span>
            <span class="mono" style="font-weight:{berat};color:{nada}">{RP(nilai)}</span>
          </div>'''


def dialog_tutup():
    isi = (kolom_isian('Laba diambil pemilik', RP(DIAMBIL),
                       'Boleh 0 kalau labanya ditahan seluruhnya. Tidak boleh lebih besar dari laba periode ini.')
           + f'''
        <div style="border-radius:9px;background:var(--surface-raised);padding:10px 13px">
{ringkas('Modal sebelum tutup buku', MODAL_AWAL + MODAL_DISETOR + PRIVE)}
{ringkas('Laba ditahan', LABA_DITAHAN, nada='var(--success)')}
{ringkas('Laba diambil pemilik', -DIAMBIL, nada='var(--destructive)')}
          <div style="border-top:1px solid var(--border);margin-top:5px;padding-top:5px">
{ringkas('Modal akhir', MODAL_SETELAH_AMBIL, tebal=True)}
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:flex-start;padding:9px 11px;border-radius:9px;
          background:var(--destructive-subtle);color:var(--destructive);font-size:12px;line-height:1.45">
          {S.svg('warn2', 14, 1.9)}
          <span>Sesudah ditutup, transaksi bertanggal <b>{MULAI} — {SEKARANG}</b> tidak bisa lagi dibatalkan,
          diretur, atau ditolak. Jurnal penutupnya sudah terbit dan tidak dihitung ulang.</span>
        </div>''')
    return A.dialog('Tutup buku periode ini?',
                    'Laba periode ini dipindahkan ke akun Modal lewat jurnal, dan periodenya dikunci.',
                    isi, A.tombol_batal() + A.tombol_utama('Tutup buku', 'destructive'), lebar=460)


def kartu_kosong():
    return f'''    <div class="card" style="width:460px;padding:38px 18px;display:flex;flex-direction:column;
      align-items:center;gap:7px;text-align:center">
      <span style="color:var(--foreground-subtle)">{S.svg('book', 26, 1.6)}</span>
      <span style="font-size:14px;font-weight:600">Belum pernah tutup buku</span>
      <span style="font-size:12px;color:var(--foreground-muted);max-width:330px;line-height:1.5">
        Selama belum ada yang ditutup, periode berjalan dihitung sejak transaksi pertama. Modal awalnya
        0 sampai ada modal yang disetor.</span>
    </div>'''


def kartu_sempit():
    tutup = ''.join(
        f'''        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;
          border-top:1px solid var(--border-subtle);padding-top:6px">
          <span style="font-size:12px;color:var(--foreground-muted)">{m} — {s}</span>
          <span class="mono" style="font-size:12px;font-weight:600">{RP(v)}</span>
        </div>'''
        for m, s, v in PERIODE[:2]
    )
    return f'''      <div class="card" style="padding:12px 14px;display:flex;flex-direction:column;gap:2px">
        <div style="font-size:13px;font-weight:700;margin-bottom:4px">Periode berjalan</div>
{baris('Modal awal', MODAL_AWAL)}
{baris('Modal disetor', MODAL_DISETOR, tanda='+', nada='var(--success)')}
{baris('Laba ditahan', LABA_DITAHAN, tanda='+', nada='var(--success)')}
{baris('Prive', PRIVE, tanda='−', nada='var(--destructive)')}
{baris_total('Modal akhir', MODAL_BERJALAN, besar=True)}
      </div>
      <div class="card" style="padding:12px 14px;display:flex;flex-direction:column;gap:6px">
        <div style="font-size:13px;font-weight:700">Sudah ditutup</div>
{tutup}
      </div>'''


def keadaan():
    return f'''  <div style="padding:22px 24px;display:flex;flex-direction:column;gap:22px">
    <div>
{A.judul_blok('Tutup buku', 'satu-satunya layar di aplikasi ini yang mengunci periode')}
      <div style="display:flex;gap:18px;align-items:flex-start">
{dialog_tutup()}
{kartu_berjalan(dengan_ambil=True, judul='Laporan periode tersimpan',
                ket='1 Ags 2026 — 31 Ags 2026 · sudah ditutup')}
      </div>
    </div>
    <div>
{A.judul_blok('Belum ada yang ditutup, dan layar sempit', 'keadaan awal aplikasi, dan bentuknya di 360px')}
      <div style="display:flex;gap:18px;align-items:flex-start">
{kartu_kosong()}
        <div style="width:360px;display:flex;flex-direction:column;gap:8px">
{kartu_sempit()}
        </div>
      </div>
    </div>
  </div>'''


def tulis():
    for nama, isi, tinggi, logic in (
        ('PerubahanModal.dc.html', halaman(), 'height:860px;display:flex', S.logic()),
        ('PerubahanModalKeadaan.dc.html', keadaan(), 'min-height:1120px', A.logic_gelap()),
    ):
        html = (S.head() + '<div class="root {{theme}}" style="' + tinggi + '">\n'
                + '    <style>.root *{box-sizing:border-box}</style>\n'
                + isi + '\n</div>\n' + S.TAIL + logic + S.END)
        open(nama, 'w').write(html)
        print(nama, len(html), 'bytes')


if __name__ == '__main__':
    tulis()
