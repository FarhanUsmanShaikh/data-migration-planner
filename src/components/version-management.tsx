'use client';

import { useEffect, useState } from 'react';
import { MigrationPlanProposal, FieldMapping } from '@/lib/types/migration';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GitBranch, 
  Edit3, 
  Save, 
  Clock, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles,
  ArrowRight,
  Eye,
  X
} from 'lucide-react';

interface PlanVersion {
  version: number;
  created_at: string;
  status: string;
}

interface VersionManagementProps {
  plan: MigrationPlanProposal;
  onVersionSelected: (plan: MigrationPlanProposal) => void;
  onPlanUpdated: (plan: MigrationPlanProposal) => void;
}

export default function VersionManagement({
  plan,
  onVersionSelected,
  onPlanUpdated,
}: VersionManagementProps) {
  const [versions, setVersions] = useState<PlanVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [editingMappings, setEditingMappings] = useState<Map<string, Partial<FieldMapping>>>(new Map());
  const [showEditMode, setShowEditMode] = useState(false);

  useEffect(() => {
    fetchVersions();
  }, [plan.id]);

  const fetchVersions = async () => {
    try {
      setLoadingVersions(true);
      const res = await fetch(`/api/migration/plan/versions?planId=${plan.id}`);
      const data = await res.json();
      if (data.success) {
        setVersions(data.versions);
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleSelectVersion = async (version: number) => {
    try {
      const res = await fetch(
        `/api/migration/plan/version?planId=${plan.id}&version=${version}`
      );
      const data = await res.json();
      if (data.success) {
        onVersionSelected(data.plan);
      }
    } catch (error) {
      console.error('Error selecting version:', error);
    }
  };

  const handleEditMapping = (mappingId: string, changes: Partial<FieldMapping>) => {
    const newEdits = new Map(editingMappings);
    newEdits.set(mappingId, changes);
    setEditingMappings(newEdits);
  };

  const handleSaveVersion = async () => {
    try {
      const mappingEdits = Array.from(editingMappings.entries()).map(([mappingId, changes]) => ({
        mappingId,
        changes,
      }));

      const res = await fetch('/api/migration/plan/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          mappingEdits,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onPlanUpdated(data.plan);
        setEditingMappings(new Map());
        setShowEditMode(false);
        fetchVersions();
      }
    } catch (error) {
      console.error('Error saving version:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Version Control Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-indigo-400" />
              <span>Plan Version Control & History</span>
            </h2>
            <Badge variant="info">Active v{plan.version}.0</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Immutable progression history (v1 → v2 → v3). Edit mappings to generate new iterations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={showEditMode ? 'destructive' : 'glow'}
            size="sm"
            onClick={() => setShowEditMode(!showEditMode)}
            className="gap-2 shadow-lg"
          >
            {showEditMode ? (
              <>
                <X className="h-3.5 w-3.5" />
                <span>Cancel Editing</span>
              </>
            ) : (
              <>
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Mappings & Bump Version</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchVersions}
            className="gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Version Timeline Card */}
      <Card>
        <CardHeader className="border-b border-slate-800/80 pb-4">
          <CardTitle className="text-lg text-white">Version Timeline</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Select a historic version to inspect proposal snapshots.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {loadingVersions ? (
            <div className="flex items-center justify-center py-8 gap-2 text-xs text-slate-400 font-mono">
              <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
              <span>Loading version history...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((v) => {
                const isCurrent = v.version === plan.version;

                return (
                  <div
                    key={v.version}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isCurrent
                        ? 'bg-indigo-950/20 border-indigo-500/30 ring-1 ring-indigo-500/20'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white font-mono">Version {v.version}.0</span>
                        {isCurrent && <Badge variant="success">Current Active</Badge>}
                        <Badge variant={v.status === 'APPROVED' ? 'success' : 'warning'}>
                          {v.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span>Created: {new Date(v.created_at).toLocaleString()}</span>
                      </p>
                    </div>

                    <Button
                      variant={isCurrent ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => handleSelectVersion(v.version)}
                      disabled={isCurrent}
                      className="gap-2 shrink-0"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>{isCurrent ? 'Viewing' : 'Inspect Version'}</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interactive Edit Drawer */}
      {showEditMode && (
        <Card className="border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900">
          <CardHeader className="border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Edit3 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg text-white">Edit Field Rules & Create New Version</CardTitle>
                <CardDescription className="text-xs text-slate-400 mt-0.5">
                  Modifications will generate <strong className="text-white">v{plan.version + 1}.0</strong> in DRAFT status.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {plan.mappings.map((mapping) => (
                <div key={mapping.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-indigo-300 font-bold flex items-center gap-2">
                      <span>{mapping.source_field}</span>
                      <ArrowRight className="h-3 w-3 text-slate-500" />
                      <span>{mapping.target_field}</span>
                    </span>
                    <span className="text-slate-500">[{mapping.source_type} → {mapping.target_type}]</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] text-slate-400 font-mono">Transformation Rules (comma separated)</label>
                      <input
                        type="text"
                        defaultValue={mapping.transformations.join(', ')}
                        onChange={(e) =>
                          handleEditMapping(mapping.id, {
                            transformations: e.target.value.split(',').map((t) => t.trim()),
                          })
                        }
                        className="w-full h-8 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400 font-mono">Confidence Score</label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        defaultValue={mapping.confidence}
                        onChange={(e) =>
                          handleEditMapping(mapping.id, {
                            confidence: parseFloat(e.target.value),
                          })
                        }
                        className="w-full h-8 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <Button
                variant="glow"
                onClick={handleSaveVersion}
                disabled={editingMappings.size === 0}
                className="gap-2 shadow-lg"
              >
                <Save className="h-4 w-4" />
                <span>Save as Version {plan.version + 1}.0</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
