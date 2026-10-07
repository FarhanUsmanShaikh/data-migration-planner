'use client';

import { useEffect, useState } from 'react';
import { MigrationPlanProposal, MigrationRun } from '@/lib/types/migration';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  Play, 
  AlertTriangle, 
  History, 
  RefreshCw, 
  Sparkles,
  CheckCircle2,
  FileCheck2,
  GitBranch,
  ShieldAlert,
  Sliders,
  Activity,
  Zap,
  ChevronRight,
  Server
} from 'lucide-react';

import MappingView from './mapping-view';
import DryRunView from './dry-run-view';
import ExecutionView from './execution-view';
import HistoryView from './history-view';
import VersionManagement from './version-management';
import QuarantineResolution from './quarantine-resolution';

type ViewType = 'dashboard' | 'mapping' | 'versions' | 'dry-run' | 'quarantine' | 'execution' | 'history';

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [plan, setPlan] = useState<MigrationPlanProposal | null>(null);
  const [run, setRun] = useState<MigrationRun | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeMigration();
  }, []);

  const initializeMigration = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/migration/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Legacy Customers → Customer Master' }),
      });
      const data = await res.json();
      setPlan(data.plan);
    } catch (error) {
      console.error('Error initializing migration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!plan) return;
    try {
      const res = await fetch('/api/migration/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id }),
      });
      const data = await res.json();
      setPlan(data.plan);
      setRun(data.run);
      setCurrentView('dry-run');
    } catch (error) {
      console.error('Error approving plan:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100">
        <div className="relative flex items-center justify-center mb-6">
          <div className="animate-ping absolute inline-flex h-16 w-16 rounded-full bg-indigo-500 opacity-20"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-white mb-2">Initializing Migration Workbench</h2>
        <p className="text-sm text-slate-400">Inspecting source schemas & transformation registries...</p>
      </div>
    );
  }

  const steps = [
    { id: 'dashboard', label: 'Overview', icon: Activity },
    { id: 'mapping', label: 'Schema Mapping', icon: Layers, badge: plan?.mappings.length },
    { id: 'versions', label: 'Versions & Edits', icon: GitBranch, badge: `v${plan?.version || 1}` },
    { id: 'dry-run', label: 'Dry Run Preview', icon: Play },
    { id: 'quarantine', label: 'Quarantine Queue', icon: AlertTriangle, badge: run?.rejected_count },
    { id: 'execution', label: 'Target Execution', icon: ShieldCheck },
    { id: 'history', label: 'Audit Timeline', icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-white">Data Migration Planner</h1>
                  <Badge variant="info" className="text-[10px] uppercase font-mono">Enterprise v1.0</Badge>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>Target: Mock Staging Engine</span>
                  <span className="h-1 w-1 rounded-full bg-slate-700"></span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Deterministic Staging Online
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {plan && (
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300">
                  <span>Status:</span>
                  <Badge variant={plan.status === 'APPROVED' ? 'success' : 'warning'}>
                    {plan.status}
                  </Badge>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={initializeMigration}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset / New Migration</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Workflow Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60 overflow-x-auto scrollbar-none">
          <nav className="flex space-x-1 py-2">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentView === step.id;
              const isDisabled = step.id !== 'dashboard' && step.id !== 'mapping' && !plan;
              
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentView(step.id as ViewType)}
                  disabled={isDisabled}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-1 ring-indigo-400/40'
                      : isDisabled
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{step.label}</span>
                  {step.badge !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {step.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {currentView === 'dashboard' && (
          <DashboardOverview
            plan={plan}
            run={run}
            onApprove={handleApprove}
            onNavigate={(view) => setCurrentView(view)}
          />
        )}

        {currentView === 'mapping' && plan && (
          <MappingView plan={plan} onApprove={handleApprove} />
        )}

        {currentView === 'versions' && plan && (
          <VersionManagement 
            plan={plan} 
            onVersionSelected={setPlan}
            onPlanUpdated={setPlan}
          />
        )}

        {currentView === 'dry-run' && plan && run && (
          <DryRunView plan={plan} run={run} setRun={setRun} />
        )}

        {currentView === 'quarantine' && plan && run && (
          <QuarantineResolution plan={plan} run={run} />
        )}

        {currentView === 'execution' && plan && run && (
          <ExecutionView plan={plan} run={run} setRun={setRun} />
        )}

        {currentView === 'history' && plan && (
          <HistoryView planId={plan.id} />
        )}
      </main>
    </div>
  );
}

function DashboardOverview({
  plan,
  run,
  onApprove,
  onNavigate,
}: {
  plan: MigrationPlanProposal | null;
  run: MigrationRun | null;
  onApprove: () => void;
  onNavigate: (view: ViewType) => void;
}) {
  if (!plan) return null;

  const isApproved = plan.status === 'APPROVED';

  return (
    <div className="space-y-8">
      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-950 p-6 md:p-8 border border-indigo-500/20 shadow-2xl backdrop-blur-xl">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
              <span>Bounded Dataset Migration Pipeline</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {plan.name}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Deterministic dynamic schema matching, risk evaluation, version control, and staging target execution with quarantine resolution.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={() => onNavigate('mapping')}
              className="gap-2"
            >
              <Sliders className="h-4 w-4" />
              <span>Review Field Mappings</span>
            </Button>

            <Button
              variant={isApproved ? 'secondary' : 'glow'}
              size="lg"
              onClick={onApprove}
              disabled={isApproved}
              className="gap-2 shadow-xl"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>{isApproved ? 'Plan Approved' : 'Approve Migration Plan'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Source Dataset Card */}
        <Card className="hover:border-indigo-500/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Source Table
            </CardTitle>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Database className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">
              {plan.source_schema.table_name}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
              <Badge variant="outline" className="font-mono text-[10px]">
                {plan.source_schema.fields.length} Fields
              </Badge>
              <span>30 Records Sample</span>
            </div>
          </CardContent>
        </Card>

        {/* Target Table Card */}
        <Card className="hover:border-indigo-500/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Target Table
            </CardTitle>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Server className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">
              {plan.target_schema.table_name}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
              <Badge variant="outline" className="font-mono text-[10px]">
                {plan.target_schema.fields.length} Fields
              </Badge>
              <span className="text-emerald-400 font-medium">
                {run?.inserted_count || 0} Staged
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Plan Version & Status */}
        <Card className="hover:border-indigo-500/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Plan Version & Gate
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <GitBranch className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white font-mono">v{plan.version}.0</span>
              <Badge variant={isApproved ? 'success' : 'warning'}>
                {plan.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5 text-slate-500" />
              <span>{isApproved ? 'Execution unlocked' : 'Approval required for execution'}</span>
            </p>
          </CardContent>
        </Card>

        {/* Dry Run Pass Rate */}
        <Card className="hover:border-indigo-500/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Dry Run Validation
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {run?.accepted_count ? (
              <div>
                <div className="text-2xl font-bold text-emerald-400 font-mono">
                  {Math.round((run.accepted_count / run.source_record_count) * 100)}% Pass
                </div>
                <p className="text-xs text-slate-400 mt-2 font-mono">
                  {run.accepted_count} Accepted / {run.rejected_count} Quarantined
                </p>
              </div>
            ) : (
              <div>
                <div className="text-xl font-medium text-slate-500">Pending Preview</div>
                <p className="text-xs text-slate-400 mt-2">Run dry run test to validate</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Workflow Navigation Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Step 1: Mapping & Risks */}
        <Card className="glass-panel-hover group cursor-pointer" onClick={() => onNavigate('mapping')}>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="info">Phase 1</Badge>
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sliders className="h-5 w-5 text-indigo-400" />
              <span>Schema Analysis & Rules</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              {plan.mappings.length} field mappings proposed with confidence scoring and risk evaluation.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-xs text-slate-300 font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              <span>Identified Risks:</span>
              <Badge variant={plan.risks.length > 0 ? 'warning' : 'success'}>
                {plan.risks.length} Detected
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Dry Run & Quarantine */}
        <Card className="glass-panel-hover group cursor-pointer" onClick={() => onNavigate('dry-run')}>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="info">Phase 2</Badge>
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="h-5 w-5 text-cyan-400" />
              <span>Deterministic Dry Run</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Test full dataset transformation in-memory without mutating target database.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-xs text-slate-300 font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              <span>Quarantine Queue:</span>
              <Badge variant={run?.rejected_count ? 'warning' : 'secondary'}>
                {run?.rejected_count || 0} Records
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Target Execution & Rollback */}
        <Card className="glass-panel-hover group cursor-pointer" onClick={() => onNavigate('execution')}>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="info">Phase 3</Badge>
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <span>Approved Target Staging</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Execute approved migration with duplicate prevention and instant rollback.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-xs text-slate-300 font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              <span>Reconciliation Parity:</span>
              <Badge variant={run?.status === 'EXECUTION_COMPLETED' ? 'success' : 'outline'}>
                {run?.status || 'NOT_STARTED'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Safety & Compliance Footprint */}
      <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Idempotent Execution Engine Active</h4>
            <p className="text-xs text-slate-400">Record hashes prevent duplicate insertion upon retries. Full audit trail recorded for all events.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
          <span>Target Mode:</span>
          <span className="text-emerald-400 font-semibold">Mock Staging (Isolation Mode)</span>
        </div>
      </div>
    </div>
  );
}
