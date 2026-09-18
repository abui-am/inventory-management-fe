import { Check } from 'lucide-react';
import React from 'react';

import { selisihAudit, sudahDihitung } from '@/components/audit/audit-shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RecordCardList } from '@/components/ui/record-card';
import { AuditsData } from '@/typings/audit';

/** Baris audit di mata pemilik: yang perlu tindakan hanyalah yang selisih. */
export const statusLaporan = (
  row: AuditsData
): { label: string; variant: 'neutral' | 'success' | 'destructive' | 'info'; perluTindakan: boolean } => {
  if (row.is_approved) return { label: 'Disetujui', variant: 'success', perluTindakan: false };
  if (!sudahDihitung(row)) return { label: 'Belum dihitung', variant: 'neutral', perluTindakan: false };
  if (row.is_valid) return { label: 'Cocok', variant: 'success', perluTindakan: false };

  const beda = selisihAudit(row) ?? 0;
  return { label: 'Selisih', variant: beda > 0 ? 'info' : 'destructive', perluTindakan: true };
};

/** Selisih sebagai lencana bertanda — kurang merah, lebih biru. */
export function ChipSelisih({ beda }: { beda: number | null }): JSX.Element {
  if (beda === null) return <span className="text-foreground-subtle">—</span>;
  if (beda === 0) return <Badge variant="success">Cocok</Badge>;
  return (
    <Badge variant={beda > 0 ? 'info' : 'destructive'}>
      {beda > 0 ? '+' : '−'}
      {Math.abs(beda)}
    </Badge>
  );
}

/** Daftar laporan audit di layar sempit. */
export function AuditReportCardList({
  rows,
  loading,
  empty,
  onApprove,
}: {
  rows: AuditsData[];
  loading: boolean;
  empty: { judul: string; pesan: string };
  onApprove: (row: AuditsData) => void;
}): JSX.Element {
  return (
    <RecordCardList loading={loading} count={6} empty={empty} isEmpty={rows.length === 0}>
      {rows.map((row) => {
        const status = statusLaporan(row);

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
              {status.perluTindakan ? (
                <ChipSelisih beda={selisihAudit(row)} />
              ) : (
                <Badge variant={status.variant}>{status.label}</Badge>
              )}
            </div>

            <div className="flex items-center justify-between gap-2.25">
              <span className="text-xs text-foreground-subtle">
                Sistem <span className="font-mono text-foreground-muted">{row.item_quantity}</span> · Audit{' '}
                <span className="font-mono text-foreground">{row.audit_quantity}</span>
              </span>
              {status.perluTindakan && (
                <Button size="sm" onClick={() => onApprove(row)}>
                  <Check strokeWidth={2.4} aria-hidden />
                  Setujui
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </RecordCardList>
  );
}

export default AuditReportCardList;
