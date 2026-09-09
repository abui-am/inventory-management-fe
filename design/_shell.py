# Shell bersama. Penamaan token mengikuti shadcn/ui supaya peta ke implementasi 1:1.
# Artboard tidak berbagi runtime, jadi markup ini digenerate ulang ke tiap berkas.

FONTS = ("https://fonts.googleapis.com/css2?"
         "family=Plus+Jakarta+Sans:wght@400;500;600;700;800&"
         "family=JetBrains+Mono:wght@400;500;600&display=swap")

THEME = '''
    .light{
      --background:oklch(0.994 0.002 280); --card:#fff; --muted:oklch(0.967 0.004 280);
      --elevated:oklch(0.978 0.003 280);
      --border:oklch(0.917 0.005 280); --border-strong:oklch(0.862 0.007 280);
      --foreground:oklch(0.208 0.012 280); --muted-foreground:oklch(0.522 0.012 280);
      --faint-foreground:oklch(0.660 0.010 280);
      --primary:oklch(0.545 0.200 277); --primary-fg:#fff; --primary-soft:oklch(0.958 0.024 277);
      --success:oklch(0.505 0.135 158); --success-soft:oklch(0.955 0.035 158);
      --danger:oklch(0.545 0.185 22);   --danger-soft:oklch(0.960 0.030 22);
      --warning:oklch(0.605 0.130 68);  --warning-soft:oklch(0.958 0.048 68);
      --info:oklch(0.560 0.135 232);    --info-soft:oklch(0.955 0.032 232);
      --shadow:0 1px 2px oklch(0.20 0.02 280 / 0.05);
    }
    .dark{
      --background:oklch(0.178 0.008 280); --card:oklch(0.214 0.009 280); --muted:oklch(0.250 0.010 280);
      --elevated:oklch(0.238 0.010 280);
      --border:oklch(0.288 0.011 280); --border-strong:oklch(0.352 0.013 280);
      --foreground:oklch(0.964 0.003 280); --muted-foreground:oklch(0.688 0.012 280);
      --faint-foreground:oklch(0.560 0.012 280);
      --primary:oklch(0.680 0.170 277); --primary-fg:oklch(0.16 0.02 277); --primary-soft:oklch(0.298 0.062 277);
      --success:oklch(0.760 0.140 158); --success-soft:oklch(0.288 0.055 158);
      --danger:oklch(0.700 0.160 22);   --danger-soft:oklch(0.300 0.060 22);
      --warning:oklch(0.810 0.130 68);  --warning-soft:oklch(0.302 0.052 68);
      --info:oklch(0.740 0.130 232);    --info-soft:oklch(0.292 0.050 232);
      --shadow:0 1px 2px oklch(0 0 0 / 0.28);
    }
'''

BASE = '''
    body{margin:0}
    .root{background:var(--background);color:var(--foreground);
      font-family:'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased;
      font-size:13px;line-height:1.45}
    a{color:var(--primary);text-decoration:none} a:hover{opacity:.8}
    .mono{font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;
      letter-spacing:-0.01em}
    .eyebrow{font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--faint-foreground)}
    .card{background:var(--card);border:1px solid var(--border);border-radius:10px;box-shadow:var(--shadow)}
    .nav{display:flex;align-items:center;gap:9px;height:28px;padding:0 9px;border-radius:7px;
      font-size:13px;font-weight:500;color:var(--muted-foreground);cursor:pointer}
    .nav:hover{background:var(--muted);color:var(--foreground)}
    .nav.on{background:var(--primary-soft);color:var(--primary);font-weight:600}
    .navsec{font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;
      color:var(--faint-foreground);padding:0 9px;margin:12px 0 4px}
    .th{font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--faint-foreground);
      text-align:left;padding:0 10px 7px;border-bottom:1px solid var(--border)}
    .td{font-size:13px;padding:8px 10px;border-bottom:1px solid var(--border);vertical-align:middle}
    .pill{font-size:11px;font-weight:600;padding:1px 7px;border-radius:5px;display:inline-flex;align-items:center;
      gap:4px;white-space:nowrap;line-height:18px}
    .btn{height:32px;padding:0 12px;border-radius:7px;border:1px solid transparent;background:var(--primary);
      color:var(--primary-fg);font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;
      display:inline-flex;align-items:center;gap:6px}
    .btn.ghost{background:var(--card);border-color:var(--border-strong);color:var(--foreground)}
    .btn.sm{height:28px;padding:0 9px;font-size:12px;border-radius:6px}
    .field{height:32px;border:1px solid var(--border-strong);border-radius:7px;padding:0 10px;font-size:13px;
      font-family:inherit;color:var(--foreground);background:var(--card);display:flex;align-items:center;gap:7px}
    .ico{width:26px;height:26px;border-radius:6px;border:1px solid var(--border);display:flex;
      align-items:center;justify-content:center;cursor:pointer;color:var(--muted-foreground)}
'''

NAV = [
    ('', ['Beranda']),
    ('Penjualan', ['Transaksi', 'Customer', 'Piutang']),
    ('Pembelian', ['Barang Masuk', 'Konfirmasi', 'Supplier', 'Utang', 'Utang Giro']),
    ('Persediaan', ['Barang', 'Harga Jual', 'Audit Barang', 'Laporan Audit']),
    ('Keuangan', ['Jurnal Umum', 'Buku Besar', 'Beban', 'Konversi Saldo', 'Laporan Pendapatan', 'Laporan per Kasir', 'Perubahan Modal']),
    ('Karyawan', ['Karyawan', 'Gaji Karyawan', 'Gaji di Muka', 'Prive']),
]

ICONS = {
 'home':'<path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
 'cart':'<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.4 12h11L21 7H6"/>',
 'box':'<path d="M12 3 3 7.5v9L12 21l9-4.5v-9z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
 'stack':'<path d="M12 3 3 8l9 5 9-5z"/><path d="m3 13 9 5 9-5"/>',
 'coin':'<ellipse cx="12" cy="7" rx="8" ry="3.4"/><path d="M4 7v10c0 1.9 3.6 3.4 8 3.4s8-1.5 8-3.4V7"/>',
 'user':'<circle cx="12" cy="8.5" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
}
SEC_ICON = {'':'home','Penjualan':'cart','Pembelian':'box','Persediaan':'stack','Keuangan':'coin','Karyawan':'user'}

def svg(name, size=15, sw=1.7):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{ICONS[name]}</svg>')

def head():
    return ('<!doctype html>\n<html>\n<head>\n  <meta charset="utf-8">\n'
            '  <script src="./support.js"></script>\n</head>\n<body>\n<x-dc>\n<helmet>\n'
            f'  <link rel="stylesheet" href="{FONTS}">\n'
            f'  <style>{THEME}{BASE}  </style>\n</helmet>\n')

def sidebar(active, role='Pemilik', nav=None):
    nav = nav if nav is not None else NAV
    out = ['<div style="width:222px;flex-shrink:0;background:var(--background);border-right:1px solid var(--border);'
           'display:flex;flex-direction:column;padding:12px 10px;gap:1px">',
           '  <div style="display:flex;align-items:center;gap:8px;padding:4px 6px 12px">',
           '    <div style="width:26px;height:26px;border-radius:7px;background:var(--primary);color:var(--primary-fg);'
           'display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800">P</div>',
           '    <div style="display:flex;flex-direction:column;min-width:0">',
           '      <div style="font-size:13px;font-weight:700;line-height:15px">Putra Pribumi</div>',
           f'      <div style="font-size:11px;color:var(--faint-foreground);line-height:14px">{role}</div>',
           '    </div>', '  </div>']
    for name, items in nav:
        if name:
            out.append(f'  <div class="navsec">{name}</div>')
        for it in items:
            on = ' on' if it == active else ''
            ic = svg(SEC_ICON[name], 14, 1.8)
            out.append(f'  <div class="nav{on}">{ic}{it}</div>')
    out.append('</div>')
    return '\n'.join(out)

def topbar(crumb, title, right=''):
    return f'''<div style="height:50px;flex-shrink:0;border-bottom:1px solid var(--border);display:flex;
  align-items:center;justify-content:space-between;padding:0 20px;background:var(--background)">
  <div style="display:flex;align-items:center;gap:7px;font-size:13px">
    <span style="color:var(--faint-foreground)">{crumb}</span>
    <span style="color:var(--faint-foreground)">/</span>
    <span style="font-weight:600">{title}</span>
  </div>
  <div style="display:flex;align-items:center;gap:9px">{right}
    <div class="field" style="height:28px;font-size:12px;color:var(--faint-foreground);gap:5px;padding:0 8px">
      <span class="mono" style="font-size:11px">⌘K</span></div>
    <div style="width:26px;height:26px;border-radius:50%;background:var(--primary-soft);color:var(--primary);
      display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800">SA</div>
  </div>
</div>'''

def logic(extra=''):
    props = '"tema":{"editor":"enum","options":["Terang","Gelap"],"default":"Terang","section":"Tampilan"}'
    if extra: props += ',' + extra
    return ('\n<script data-dc-script data-props=\'{' + props + '}\'>\n'
            'class Component extends DCLogic {\n  renderVals() {\n'
            "    const t = this.state?.tema ?? this.props.tema ?? 'Terang';\n"
            "    return { theme: t === 'Gelap' ? 'dark' : 'light' };\n"
            '  }\n}\n</script>\n')

TAIL = '</x-dc>\n'
END = '</body>\n</html>\n'
