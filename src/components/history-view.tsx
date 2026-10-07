'use client';

import { useEffect, useState } from 'react';
import { MigrationEvent, EventType } from '@/lib/types/migration';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Layers, 
  RotateCcw,
  Sparkles,
  RefreshCw,
  ChevronRight
} from 'lucide-react';

export default function HistoryView({ planId }: { planId: string }) {
  const [events, setEvents] = useState<MigrationEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
    const interval = setInterval(loadEvents, 2500);
    return () => clearInterval(interval);
  }, [planId]);

  const loadEvents = async () => {
    try {
      const res = await fetch(`/api/migration/events?planId=${planId}`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderEventIcon = (eventType: EventType) => {
    switch (eventType) {
      case EventType.PLAN_CREATED:
      case EventType.PLAN_VERSION_CREATED:
        return <FileText className="h-4 w-4 text-indigo-400" />;
      case EventType.PLAN_APPROVED:
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case EventType.DRY_RUN_STARTED:
      case EventType.DRY_RUN_COMPLETED:
        return <Sparkles className="h-4 w-4 text-cyan-400" />;
      case EventType.MIGRATION_EXECUTION_STARTED:
      case EventType.MIGRATION_EXECUTION_COMPLETED:
        return <ShieldCheck className="h-4 w-4 text-emerald-400" />;
      case EventType.RECONCILIATION_COMPLETED:
        return <Layers className="h-4 w-4 text-purple-400" />;
      case EventType.RECORD_QUARANTINED:
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case EventType.ROLLBACK_STARTED:
      case EventType.ROLLBACK_COMPLETED:
        return <RotateCcw className="h-4 w-4 text-rose-400" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin" />
        <p className="text-sm text-slate-400 font-mono">Loading Chronological Audit Timeline...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Timeline Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-400" />
              <span>Migration Audit & Event Timeline Log</span>
            </h2>
            <Badge variant="info">{events.length} Events Logged</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Chronological audit history tracking plan updates, approval gates, dry runs, and rollbacks.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadEvents}
          className="gap-2"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Timeline</span>
        </Button>
      </div>

      {/* Audit Log Stream */}
      <Card>
        <CardHeader className="border-b border-slate-800/80 pb-4">
          <CardTitle className="text-lg text-white">Event Stream</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {events.length === 0 ? (
            <p className="text-slate-500 text-xs font-mono text-center py-8">No audit events recorded yet.</p>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
              {events.map((event) => (
                <div key={event.id} className="relative group">
                  {/* Timeline Dot Icon */}
                  <div className="absolute -left-6 top-1 h-5 w-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                    {renderEventIcon(event.event_type)}
                  </div>

                  {/* Event Card */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                        {event.event_type.replace(/_/g, ' ')}
                      </h4>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(event.created_at).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{event.description}</p>

                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <details className="text-[11px] text-indigo-400 pt-1 group-open:text-slate-300">
                        <summary className="cursor-pointer font-mono font-medium hover:underline flex items-center gap-1">
                          <span>View Event Metadata Payload</span>
                        </summary>
                        <pre className="mt-2 p-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-slate-300 font-mono overflow-x-auto">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
