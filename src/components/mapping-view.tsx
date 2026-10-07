'use client';

import { useMemo, useState } from 'react';
import { MigrationPlanProposal, ConfidenceLevel, RiskLevel } from '@/lib/types/migration';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Sliders, 
  Sparkles, 
  ShieldCheck, 
  FileCheck2,
  Lock,
  Search,
  Filter
} from 'lucide-react';

export default function MappingView({
  plan,
  onApprove,
}: {
  plan: MigrationPlanProposal;
  onApprove: () => void;
}) {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const stats = useMemo(() => {
    return {
      totalMappings: plan.mappings.length,
      highConfidence: plan.mappings.filter(m => m.confidence_level === ConfidenceLevel.HIGH).length,
      mediumConfidence: plan.mappings.filter(m => m.confidence_level === ConfidenceLevel.MEDIUM).length,
      lowConfidence: plan.mappings.filter(m => m.confidence_level === ConfidenceLevel.LOW).length,
      risks: plan.risks.length,
      questions: plan.clarification_questions.length,
    };
  }, [plan]);

  const filteredMappings = useMemo(() => {
    return plan.mappings.filter((mapping) => {
      const matchesSearch = 
        mapping.source_field.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mapping.target_field.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filter === 'high') return matchesSearch && mapping.confidence_level === ConfidenceLevel.HIGH;
      if (filter === 'medium') return matchesSearch && mapping.confidence_level === ConfidenceLevel.MEDIUM;
      if (filter === 'low') return matchesSearch && mapping.confidence_level === ConfidenceLevel.LOW;
      return matchesSearch;
    });
  }, [plan, filter, searchTerm]);

  const isApproved = plan.status === 'APPROVED';

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sliders className="h-5 w-5 text-indigo-400" />
              <span>Schema Mapping & Introspection</span>
            </h2>
            <Badge variant="info" className="font-mono">v{plan.version}.0</Badge>
          </div>
          <p className="text-xs text-slate-400">
            Dynamic field matching analysis comparing <code className="text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded font-mono">{plan.source_schema.table_name}</code> to <code className="text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded font-mono">{plan.target_schema.table_name}</code>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={isApproved ? 'secondary' : 'glow'}
            size="lg"
            onClick={onApprove}
            disabled={isApproved}
            className="gap-2 shadow-xl"
          >
            {isApproved ? (
              <>
                <Lock className="h-4 w-4" />
                <span>Plan Approved</span>
              </>
            ) : (
              <>
                <FileCheck2 className="h-4 w-4" />
                <span>Approve & Unlock Execution</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="hover:border-slate-700">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Total Mappings</p>
                <p className="text-2xl font-bold text-white font-mono mt-1">{stats.totalMappings}</p>
              </div>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Sliders className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-700">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">High Confidence</p>
                <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">{stats.highConfidence}</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-700">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Medium Confidence</p>
                <p className="text-2xl font-bold text-amber-400 font-mono mt-1">{stats.mediumConfidence}</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-700">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Detected Risks</p>
                <p className="text-2xl font-bold text-rose-400 font-mono mt-1">{stats.risks}</p>
              </div>
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-700 col-span-2 sm:col-span-1">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Clarification Queries</p>
                <p className="text-2xl font-bold text-cyan-400 font-mono mt-1">{stats.questions}</p>
              </div>
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <HelpCircle className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Field Mapping Grid */}
      <Card>
        <CardHeader className="border-b border-slate-800/80 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Proposed Field Mappings</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Field matching score based on schema names, types, and deterministic transform rules.
              </CardDescription>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter fields..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 pl-8 pr-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {(['all', 'high', 'medium', 'low'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setFilter(lvl)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all capitalize ${
                      filter === lvl
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
                <tr>
                  <th className="py-3.5 px-6 font-semibold">Source Field</th>
                  <th className="py-3.5 px-6 font-semibold">Match Flow</th>
                  <th className="py-3.5 px-6 font-semibold">Target Field</th>
                  <th className="py-3.5 px-6 font-semibold">Transformations</th>
                  <th className="py-3.5 px-6 font-semibold">Confidence</th>
                  <th className="py-3.5 px-6 font-semibold">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredMappings.map((mapping, idx) => {
                  const confidencePercent = Math.round(mapping.confidence * 100);
                  
                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold">{mapping.source_field}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="h-px w-6 bg-slate-800"></span>
                          <ArrowRight className="h-3.5 w-3.5 text-indigo-400" />
                          <span className="h-px w-6 bg-slate-800"></span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-300 font-semibold">{mapping.target_field}</span>
                          {mapping.is_required && (
                            <span className="text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                              Required
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6 font-sans">
                        <div className="flex flex-wrap gap-1.5">
                          {mapping.transformations.length > 0 ? (
                            mapping.transformations.map((t) => (
                              <Badge key={t} variant="info" className="text-[10px] font-mono">
                                {t}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-slate-500 text-xs italic">DIRECT_COPY</span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                confidencePercent >= 85
                                  ? 'bg-emerald-400'
                                  : confidencePercent >= 60
                                  ? 'bg-amber-400'
                                  : 'bg-rose-400'
                              }`}
                              style={{ width: `${confidencePercent}%` }}
                            ></div>
                          </div>
                          <span className="text-slate-300 font-mono text-xs">{confidencePercent}%</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 font-sans">
                        <Badge
                          variant={
                            mapping.risk_level === RiskLevel.HIGH
                              ? 'destructive'
                              : mapping.risk_level === RiskLevel.MEDIUM
                              ? 'warning'
                              : 'success'
                          }
                        >
                          {mapping.risk_level}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Identified Risks Section */}
      {plan.risks.length > 0 && (
        <Card className="border-rose-500/20 bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/20">
          <CardHeader>
            <CardTitle className="text-lg text-rose-300 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-400" />
              <span>Identified Mapping Risks & Data Quality Warnings</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Potential data loss, precision reduction, or missing target field requirements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {plan.risks.map((risk) => (
              <div 
                key={risk.id} 
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{risk.risk_type}</span>
                    <Badge variant={risk.severity === RiskLevel.HIGH ? 'destructive' : 'warning'}>
                      {risk.severity} Severity
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{risk.description}</p>
                  {risk.recommendation && (
                    <p className="text-xs text-indigo-300 mt-1 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-indigo-400" />
                      <span>Recommendation: {risk.recommendation}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Clarification Questions Section */}
      {plan.clarification_questions.length > 0 && (
        <Card className="border-cyan-500/20 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/20">
          <CardHeader>
            <CardTitle className="text-lg text-cyan-300 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-cyan-400" />
              <span>Generated Clarification Questions</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Automatic questions generated to resolve ambiguous mappings or missing required fields.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {plan.clarification_questions.map((q) => (
              <div key={q.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <p className="text-sm font-medium text-white">{q.question}</p>
                {q.suggested_answer && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-xs text-cyan-300 font-mono">
                    <span>Suggested Action:</span>
                    <span className="text-white">{q.suggested_answer}</span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
