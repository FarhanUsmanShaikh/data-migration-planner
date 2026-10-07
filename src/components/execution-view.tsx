'use client';

import { useState } from 'react';
import { MigrationPlanProposal, MigrationRun, RunStatus, ReconciliationResult, ExecutionResult } from '@/lib/types/migration';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, 
  CheckCircle2, 
  RotateCcw, 
  RefreshCw, 
  Database, 
  ArrowRight, 
  Layers, 
  AlertCircle,
  Sparkles,
  Server,
  FileCheck2
} from 'lucide-react';

export default function ExecutionView({
  plan,
  run,
  setRun,
}: {
  plan: MigrationPlanProposal;
  run: MigrationRun;
  setRun: (run: MigrationRun) => void;
}) {
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [reconciliation, setReconciliation] = useState<ReconciliationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'ready' | 'executing' | 'reconciling' | 'complete'>('ready');

  const handleExecute = async () => {
    try {
      setLoading(true);
      setCurrentStep('executing');
      const res = await fetch('/api/migration/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, runId: run.id }),
      });
      const data = await res.json();
      setExecutionResult(data.executionResult);
      setRun(data.run);
      setCurrentStep('reconciling');
    } catch (error) {
      console.error('Error executing migration:', error);
      setCurrentStep('ready');
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/migration/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, runId: run.id }),
      });
      const data = await res.json();
      setReconciliation(data.reconciliationResult);
      setCurrentStep('complete');
    } catch (error) {
      console.error('Error reconciling:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async () => {
    if (!confirm('Are you sure you want to rollback? This will remove all migrated records from this run.')) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/migration/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, runId: run.id }),
      });
      const data = await res.json();
      setRun(data.run);
      setExecutionResult(null);
      setReconciliation(null);
      setCurrentStep('ready');
      alert('Rollback completed successfully. ' + data.rollbackResult.removedCount + ' records removed.');
    } catch (error) {
      console.error('Error rolling back:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setExecutionResult(null);
    setReconciliation(null);
    setCurrentStep('ready');
  };

  const isReadyForExecution = run.status === RunStatus.DRY_RUN_COMPLETED || plan.status === 'APPROVED';

  return (
    <div className="space-y-8">
      {/* Execution Progress Bar */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="grid grid-cols-4 gap-2 relative">
            {[
              { label: 'Approval Gate', step: 'ready', icon: FileCheck2 },
              { label: 'Staging Execution', step: 'executing', icon: Database },
              { label: 'Reconciliation', step: 'reconciling', icon: Layers },
              { label: 'Verified Complete', step: 'complete', icon: ShieldCheck },
            ].map((st, idx) => {
              const Icon = st.icon;
              const stepIndex = ['ready', 'executing', 'reconciling', 'complete'].indexOf(currentStep);
              const isPast = idx < stepIndex;
              const isCurrent = idx === stepIndex;

              return (
                <div key={st.step} className="flex flex-col items-center text-center space-y-2 relative">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                      isPast
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isCurrent
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400'
                        : 'bg-slate-900 text-slate-600 border border-slate-800'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs font-semibold ${isCurrent ? 'text-white' : 'text-slate-400'}`}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Controller Area */}
      {currentStep === 'ready' && (
        <Card className="border-indigo-500/20 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">Target Staging Migration Execution</CardTitle>
                <CardDescription className="text-xs text-slate-400 mt-1">
                  Commit accepted dataset records into the staging target database with deduplication.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                <span>Migration Run ID:</span>
                <span className="text-indigo-400 font-bold">{run.id}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                <span>Target Staging Store:</span>
                <span className="text-cyan-400 font-bold">{plan.target_schema.table_name}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                <span>Accepted Records Staged:</span>
                <span className="text-emerald-400 font-bold">{run.accepted_count || 30} Records</span>
              </div>
            </div>

            <Button
              onClick={handleExecute}
              disabled={loading}
              size="lg"
              variant="glow"
              className="w-full py-6 text-base gap-2 shadow-xl"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Staging Records into Target Database...</span>
                </>
              ) : (
                <>
                  <Database className="h-5 w-5" />
                  <span>Execute Approved Migration</span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Execution Results Grid */}
      {executionResult && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Inserted Records</p>
                  <p className="text-3xl font-bold text-emerald-400 font-mono mt-1">{executionResult.inserted_count}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Duplicates Skipped</p>
                  <p className="text-3xl font-bold text-amber-400 font-mono mt-1">{executionResult.skipped_duplicate_count}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                  <RotateCcw className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Quarantined / Rejected</p>
                  <p className="text-3xl font-bold text-rose-400 font-mono mt-1">{executionResult.rejected_count}</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
                  <AlertCircle className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reconciliation Parity Results */}
      {reconciliation && (
        <Card className={reconciliation.reconciliation_status === 'PASS' ? 'border-emerald-500/30' : 'border-rose-500/30'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg text-white">Source vs. Target Reconciliation</CardTitle>
                <Badge variant={reconciliation.reconciliation_status === 'PASS' ? 'success' : 'destructive'}>
                  {reconciliation.reconciliation_status}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div>
                <p className="text-slate-400">Source Count:</p>
                <p className="text-lg font-bold text-white mt-1">{reconciliation.source_count}</p>
              </div>
              <div>
                <p className="text-slate-400">Accepted Count:</p>
                <p className="text-lg font-bold text-emerald-400 mt-1">{reconciliation.accepted_count}</p>
              </div>
              <div>
                <p className="text-slate-400">Target Count:</p>
                <p className="text-lg font-bold text-cyan-400 mt-1">{reconciliation.target_count}</p>
              </div>
              <div>
                <p className="text-slate-400">Parity Difference:</p>
                <p className={`text-lg font-bold mt-1 ${reconciliation.difference === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {reconciliation.difference}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-800">
        {currentStep === 'reconciling' && !reconciliation && (
          <Button onClick={handleReconcile} disabled={loading} size="lg" variant="glow" className="gap-2">
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
            <span>Run Reconciliation Parity Check</span>
          </Button>
        )}

        {currentStep === 'complete' && reconciliation && (
          <>
            <Button
              variant="outline"
              onClick={handleRetry}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Retry / Re-run Migration</span>
            </Button>

            <Button
              variant="destructive"
              onClick={handleRollback}
              disabled={loading}
              className="gap-2 shadow-lg shadow-rose-600/20"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Rollback Staged Migration</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
