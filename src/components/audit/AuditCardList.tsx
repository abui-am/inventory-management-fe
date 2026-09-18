import React from 'react';

import { Kesempatan, statusAudit } from '@/components/audit/audit-shared';
import CountField from '@/components/audit/CountField';
import { Konfirmasi } from '@/components/audit/useHitungan';
import { Badge } from '@/components/ui/badge';
import { RecordCardList } from '@/components/ui/record-card';
import { AuditsData } from '@/typings/audit';

/**
 * Daftar audit di layar sempit.
 *
 * Opname justru paling sering dikerjakan sambil berdiri di depan rak, jadi bentuk
 * kartu bukan tambahan — di sinilah halaman ini paling banyak dipakai. Kartunya tidak
 * memakai `RecordCard`: isinya bukan catatan yang dibuka, melainkan satu isian.
 */
export function AuditCardList({
  rows,
  loading,
  empty,
  onSelesai,
  onKonfirmasi,
}: {
  rows: AuditsData[];
  loading: boolean;
  empty: { judul: string; pesan: string };
  onSelesai: (id: string) => void;
  onKonfirmasi: (konfirmasi: Konfirmasi) => void;
}): JSX.Element {
  return (
    <RecordCardList loading={loading} count={6} empty={empty} isEmpty={rows.length === 0}>
      {rows.map((row) => {
        const status = statusAudit(row);

        return (
          <div
            key={row.id}
            className="flex flex-col gap-2 rounded-card border border-border bg-surface px-3 py-2.5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2.25">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold">{row.item_name}</div>
                <div className="text-xs text-foreground-subtle">{row.item_unit}</div>
              </div>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>

            <div className="flex items-center justify-between gap-2.25">
              <Kesempatan terpakai={row.update_count} />
              <CountField row={row} onSelesai={onSelesai} onKonfirmasi={onKonfirmasi} />
            </div>
          </div>
        );
      })}
    </RecordCardList>
  );
}

export default AuditCardList;
