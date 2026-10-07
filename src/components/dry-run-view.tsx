'use client';

import { useState } from 'react';
import { MigrationPlanProposal, MigrationRun, DryRunResult, RunStatus } from '@/lib/types/migration';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  RefreshCw, 
  BarChart3, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';

export default function DryRunView({
  plan,
  run,
  setRun,
}: {
  plan: MigrationPlanProposal;
  run: MigrationRun;
  setRun: (run: MigrationRun) => void;
}) {
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'accepted' | 'rejected'>('summary');

  const handleRunDryRun = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/migration/dry-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, runId: run.id }),
      });
      const data = await res.json();
      setDryRunResult(data.dryRunResult);
      setRun(data.run);
    } catch (error) {
      console.error('Error running dry run:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!dryRunResult && run.status === RunStatus.INITIALIZED) {
    return (
      <Card className="border-indigo-500/20 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/30 shadow-2xl p-4">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
            <Play className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl text-white">Deterministic Dry Run Testing</CardTitle>
          <CardDescription className="text-sm text-slate-400 max-w-xl mx-auto mt-2 leading-relaxed">
            Execute all transformation rules and validation checks in-memory without altering the target database. Identify quarantined records and evidence before committing.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pt-6">
          <Button 
            onClick={handleRunDryRun} 
            disabled={loading} 
            size="lg"
            variant="glow"
            className="gap-2 shadow-xl px-8"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Transforming & Validating Records...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Run Deterministic Dry Run</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!dryRunResult) return null;

  const acceptedRecords = dryRunResult.records.filter(r => r.is_accepted);
  const rejectedRecords = dryRunResult.records.filter(r => !r.is_accepted);
  const passPercentage = Math.round((dryRunResult.accepted_count / dryRunResult.source_count) * 100);

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-400" />
              <span>Dry Run Execution Results</span>
            </h2>
            <Badge variant="success" className="font-mono">COMPLETED</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Transformed and evaluated 30 records against schema validation rules.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRunDryRun}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-Run Dry Run</span>
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Source Records</p>
                <p className="text-2xl font-bold text-white font-mono mt-1">{dryRunResult.source_count}</p>
              </div>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <FileText className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium font-mono">Accepted & Validated</p>
                <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">{dryRunResult.accepted_count}</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium font-mono">Quarantined / Rejected</p>
                <p className="text-2xl font-bold text-rose-400 font-mono mt-1">{dryRunResult.rejected_count}</p>
              </div>
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Validation Pass Rate</p>
                <p className="text-2xl font-bold text-cyan-400 font-mono mt-1">{passPercentage}%</p>
              </div>
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Details */}
      <Card>
        <CardHeader className="border-b border-slate-800/80 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'summary'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Executive Summary
              </button>
              <button
                onClick={() => setActiveTab('accepted')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'accepted'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>Accepted Records</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
                  {acceptedRecords.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('rejected')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'rejected'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>Quarantined Records</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
                  {rejectedRecords.length}
                </span>
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-300">Ready for Migration Execution</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {dryRunResult.accepted_count} records successfully passed all deterministic data type casts, format rules, and required field constraints.
                  </p>
                </div>
              </div>

              {rejectedRecords.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-rose-300">Quarantine Required Before Target Staging</h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {rejectedRecords.length} records were flagged with validation errors. Visit the <strong className="text-white">Quarantine Queue</strong> tab to inspect evidence and correct field values.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'accepted' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">ID</th>
                    <th className="py-3 px-4 font-semibold">Full Name</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">Validation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {acceptedRecords.map((record, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-white font-bold">{record.source_record.legacy_customer_id}</td>
                      <td className="py-3 px-4 text-slate-200">{record.source_record.full_name}</td>
                      <td className="py-3 px-4 text-slate-300 truncate max-w-xs">{record.source_record.email_address}</td>
                      <td className="py-3 px-4">
                        <Badge variant="success">Validated</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'rejected' && (
            <div className="space-y-4">
              {rejectedRecords.map((record, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950/80 border border-rose-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{record.source_record.full_name}</h4>
                      <p className="text-xs text-slate-500 font-mono">Legacy ID: {record.source_record.legacy_customer_id}</p>
                    </div>
                    <Badge variant="destructive">Quarantined</Badge>
                  </div>

                  {record.validation_errors.length > 0 && (
                    <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/40 space-y-1">
                      <p className="text-[11px] font-semibold text-rose-300 uppercase tracking-wider">Field Errors:</p>
                      {record.validation_errors.map((err, errIdx) => (
                        <p key={errIdx} className="text-xs text-rose-200 font-mono flex items-center gap-2">
                          <span className="text-rose-400 font-bold">• [{err.source_field}]:</span>
                          <span>{err.error_message}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
