'use client';

import { useEffect, useState } from 'react';
import { TransformedRecord, MigrationPlanProposal, MigrationRun } from '@/lib/types/migration';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  RefreshCw, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';

interface QuarantineResolutionProps {
  plan: MigrationPlanProposal;
  run: MigrationRun;
}

interface RecordCorrection {
  sourceRecordId: number;
  fieldCorrections: Array<{
    fieldName: string;
    correctedValue: string | null;
  }>;
}

export default function QuarantineResolution({
  plan,
  run,
}: QuarantineResolutionProps) {
  const [quarantinedRecords, setQuarantinedRecords] = useState<TransformedRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [corrections, setCorrections] = useState<Map<number, RecordCorrection>>(new Map());
  const [resolving, setResolving] = useState(false);
  const [resolveResult, setResolveResult] = useState<any>(null);

  useEffect(() => {
    fetchQuarantinedRecords();
  }, [run.id]);

  const fetchQuarantinedRecords = async () => {
    try {
      setLoadingRecords(true);
      const res = await fetch(`/api/migration/quarantine?runId=${run.id}`);
      const data = await res.json();
      if (data.success) {
        setQuarantinedRecords(data.records);
      }
    } catch (error) {
      console.error('Error fetching quarantined records:', error);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleFieldCorrection = (
    sourceRecordId: number,
    fieldName: string,
    value: string | null
  ) => {
    const existing = corrections.get(sourceRecordId) || {
      sourceRecordId,
      fieldCorrections: [],
    };

    const existingField = existing.fieldCorrections.findIndex(
      (f) => f.fieldName === fieldName
    );

    if (existingField >= 0) {
      existing.fieldCorrections[existingField].correctedValue = value;
    } else {
      existing.fieldCorrections.push({
        fieldName,
        correctedValue: value,
      });
    }

    const newCorrections = new Map(corrections);
    newCorrections.set(sourceRecordId, existing);
    setCorrections(newCorrections);
  };

  const handleResolveQuarantine = async () => {
    try {
      setResolving(true);
      const recordCorrections = Array.from(corrections.values());

      const res = await fetch('/api/migration/quarantine/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId: run.id,
          planId: plan.id,
          recordCorrections,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResolveResult(data);
        setCorrections(new Map());
        fetchQuarantinedRecords();
      }
    } catch (error) {
      console.error('Error resolving quarantine:', error);
    } finally {
      setResolving(false);
    }
  };

  if (loadingRecords) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin" />
        <p className="text-sm text-slate-400 font-mono">Fetching Quarantined Records Evidence...</p>
      </div>
    );
  }

  if (quarantinedRecords.length === 0) {
    return (
      <Card className="border-emerald-500/20 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/20 p-8 text-center shadow-xl">
        <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-white">Quarantine Queue Clear</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
          Zero records are currently in quarantine. All dataset items passed validation rules and are ready for target insertion.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Resolution Result Banner */}
      {resolveResult && (
        <Card className="border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Quarantine Resolution Applied</h4>
              <div className="flex items-center gap-4 mt-2 font-mono text-xs">
                <span className="text-emerald-400 font-bold">{resolveResult.resolved_count} Resolved</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400 font-bold">{resolveResult.still_quarantined_count} Remaining</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Main Resolution Container */}
      <Card>
        <CardHeader className="border-b border-slate-800/80 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-amber-400" />
                  <span>Quarantine Evidence & Interactive Field Resolution</span>
                </CardTitle>
                <Badge variant="warning">{quarantinedRecords.length} Flagged</Badge>
              </div>
              <CardDescription className="text-xs text-slate-400 mt-1">
                Inspect exact field-level validation errors, provide corrected values inline, and trigger re-validation.
              </CardDescription>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCorrections(new Map());
                  fetchQuarantinedRecords();
                }}
                className="gap-2"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Forms</span>
              </Button>

              <Button
                variant="glow"
                size="sm"
                onClick={handleResolveQuarantine}
                disabled={resolving || corrections.size === 0}
                className="gap-2 shadow-lg"
              >
                {resolving ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Re-Validating...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Apply & Re-Validate ({corrections.size})</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
            {quarantinedRecords.map((record) => {
              const recordId = record.source_record.legacy_customer_id;
              
              return (
                <div 
                  key={recordId} 
                  className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors"
                >
                  {/* Record Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{record.source_record.full_name}</span>
                        <span className="text-xs text-slate-500 font-mono font-normal">(ID: {recordId})</span>
                      </h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{record.source_record.email_address}</p>
                    </div>

                    <Badge variant="destructive">
                      {record.validation_errors.length} Validation Failure(s)
                    </Badge>
                  </div>

                  {/* Validation Error Evidence */}
                  <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-900/40 space-y-2">
                    <p className="text-xs font-semibold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                      <span>Preserved Error Evidence:</span>
                    </p>
                    {record.validation_errors.map((error, idx) => (
                      <div key={idx} className="text-xs text-rose-200 font-mono flex items-start gap-2">
                        <span className="text-rose-400 font-bold flex-shrink-0">• [{error.target_field}]:</span>
                        <span>{error.error_message}</span>
                      </div>
                    ))}
                  </div>

                  {/* Inline Field Correction Inputs */}
                  <div className="space-y-3 pt-1">
                    <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Interactive Field Correction:</p>
                    {record.validation_errors.map((error) => (
                      <div key={error.target_field} className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <label className="text-xs text-slate-400 font-mono sm:w-44 shrink-0 flex items-center gap-1">
                          <span>{error.target_field}:</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Enter corrected value..."
                          defaultValue={
                            corrections
                              .get(recordId)
                              ?.fieldCorrections.find((f) => f.fieldName === error.target_field)
                              ?.correctedValue || ''
                          }
                          onChange={(e) =>
                            handleFieldCorrection(
                              recordId,
                              error.target_field,
                              e.target.value || null
                            )
                          }
                          className="flex-1 h-9 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
