import {
  MigrationPlanProposal,
  MigrationRun,
  DryRunResult,
  ExecutionResult,
  ReconciliationResult,
  MigrationEvent,
  EventType,
  CustomerMaster,
  TransformedRecord,
  LegacyCustomer,
} from "@/lib/types/migration";
import { v4 as uuidv4 } from "uuid";

/**
 * In-memory migration store
 * In a production system, this would use a database
 */
export class MigrationStore {
  private static plans: Map<string, MigrationPlanProposal> = new Map();
  private static planVersions: Map<string, Map<number, MigrationPlanProposal>> = new Map(); // NEW: Version history
  private static runs: Map<string, MigrationRun> = new Map();
  private static dryRunResults: Map<string, DryRunResult> = new Map();
  private static executionResults: Map<string, ExecutionResult> = new Map();
  private static reconciliationResults: Map<string, ReconciliationResult> =
    new Map();
  private static events: MigrationEvent[] = [];
  private static targetRecords: Map<string, CustomerMaster> = new Map();
  private static quarantinedRecords: Map<string, TransformedRecord[]> = new Map();

  // ========================================================================
  // MIGRATION PLANS
  // ========================================================================

  static savePlan(plan: MigrationPlanProposal): void {
    this.plans.set(plan.id, plan);
    this.addEvent({
      id: uuidv4(),
      plan_id: plan.id,
      event_type: EventType.PLAN_CREATED,
      description: `Migration plan created: ${plan.name} v${plan.version}`,
      metadata: { plan_name: plan.name, version: plan.version },
      created_at: new Date().toISOString(),
    });
    
    // NEW: Initialize version history for this plan
    if (!this.planVersions.has(plan.id)) {
      this.planVersions.set(plan.id, new Map());
    }
    this.planVersions.get(plan.id)!.set(plan.version, plan);
  }

  static getPlan(planId: string): MigrationPlanProposal | undefined {
    return this.plans.get(planId);
  }

  // NEW: Get specific version of a plan
  static getPlanVersion(planId: string, version: number): MigrationPlanProposal | undefined {
    return this.planVersions.get(planId)?.get(version);
  }

  // NEW: Get latest version of a plan
  static getLatestVersion(planId: string): MigrationPlanProposal | undefined {
    const versions = this.planVersions.get(planId);
    if (!versions || versions.size === 0) return undefined;
    
    const latestVersion = Math.max(...versions.keys());
    return versions.get(latestVersion);
  }

  // NEW: List all versions of a plan
  static listVersions(planId: string): Array<{ version: number; created_at: string; status: string }> {
    const versions = this.planVersions.get(planId) || new Map();
    return Array.from(versions.values()).map(plan => ({
      version: plan.version,
      created_at: plan.created_at,
      status: plan.status,
    })).sort((a, b) => a.version - b.version);
  }

  // NEW: Save a new version of a plan
  static savePlanVersion(plan: MigrationPlanProposal): void {
    this.plans.set(plan.id, plan);
    
    if (!this.planVersions.has(plan.id)) {
      this.planVersions.set(plan.id, new Map());
    }
    this.planVersions.get(plan.id)!.set(plan.version, plan);
    
    this.addEvent({
      id: uuidv4(),
      plan_id: plan.id,
      event_type: EventType.PLAN_VERSION_CREATED,
      description: `Migration plan version created: ${plan.name} v${plan.version}`,
      metadata: { plan_name: plan.name, version: plan.version },
      created_at: new Date().toISOString(),
    });
  }

  static getAllPlans(): MigrationPlanProposal[] {
    return Array.from(this.plans.values());
  }

  static updatePlan(plan: MigrationPlanProposal): void {
    this.plans.set(plan.id, plan);
  }

  // ========================================================================
  // MIGRATION RUNS
  // ========================================================================

  static saveRun(run: MigrationRun): void {
    this.runs.set(run.id, run);
  }

  static getRun(runId: string): MigrationRun | undefined {
    return this.runs.get(runId);
  }

  static getAllRuns(): MigrationRun[] {
    return Array.from(this.runs.values());
  }

  static updateRun(run: MigrationRun): void {
    this.runs.set(run.id, run);
  }

  // ========================================================================
  // DRY RUN RESULTS
  // ========================================================================

  static saveDryRunResult(result: DryRunResult): void {
    this.dryRunResults.set(result.migration_run_id, result);
    this.quarantinedRecords.set(
      result.migration_run_id,
      result.records.filter((r) => !r.is_accepted)
    );
    this.addEvent({
      id: uuidv4(),
      plan_id: "", // Will be set by caller
      migration_run_id: result.migration_run_id,
      event_type: EventType.DRY_RUN_COMPLETED,
      description: `Dry run completed: ${result.accepted_count} accepted, ${result.rejected_count} rejected out of ${result.source_count}`,
      metadata: {
        source_count: result.source_count,
        accepted_count: result.accepted_count,
        rejected_count: result.rejected_count,
      },
      created_at: new Date().toISOString(),
    });
  }

  static getDryRunResult(runId: string): DryRunResult | undefined {
    return this.dryRunResults.get(runId);
  }

  // ========================================================================
  // EXECUTION RESULTS
  // ========================================================================

  static saveExecutionResult(result: ExecutionResult, planId: string): void {
    this.executionResults.set(result.migration_run_id, result);
    this.addEvent({
      id: uuidv4(),
      plan_id: planId,
      migration_run_id: result.migration_run_id,
      event_type: EventType.MIGRATION_EXECUTION_COMPLETED,
      description: `Migration executed: ${result.inserted_count} inserted, ${result.skipped_duplicate_count} duplicates skipped`,
      metadata: {
        inserted_count: result.inserted_count,
        skipped_duplicate_count: result.skipped_duplicate_count,
        rejected_count: result.rejected_count,
      },
      created_at: new Date().toISOString(),
    });
  }

  static getExecutionResult(runId: string): ExecutionResult | undefined {
    return this.executionResults.get(runId);
  }

  // ========================================================================
  // RECONCILIATION RESULTS
  // ========================================================================

  static saveReconciliationResult(
    result: ReconciliationResult,
    planId: string
  ): void {
    this.reconciliationResults.set(result.migration_run_id, result);
    this.addEvent({
      id: uuidv4(),
      plan_id: planId,
      migration_run_id: result.migration_run_id,
      event_type: EventType.RECONCILIATION_COMPLETED,
      description: `Reconciliation ${result.reconciliation_status}: ${result.target_count} records in target (expected ${result.accepted_count})`,
      metadata: {
        source_count: result.source_count,
        accepted_count: result.accepted_count,
        target_count: result.target_count,
        status: result.reconciliation_status,
      },
      created_at: new Date().toISOString(),
    });
  }

  static getReconciliationResult(runId: string): ReconciliationResult | undefined {
    return this.reconciliationResults.get(runId);
  }

  // ========================================================================
  // TARGET RECORDS
  // ========================================================================

  static getTargetRecords(): Map<string, CustomerMaster> {
    return this.targetRecords;
  }

  static insertTargetRecord(key: string, record: CustomerMaster): void {
    this.targetRecords.set(key, record);
  }

  static getTargetRecordByRunId(runId: string): CustomerMaster[] {
    const records: CustomerMaster[] = [];
    for (const record of this.targetRecords.values()) {
      if (record.migration_run_id === runId) {
        records.push(record);
      }
    }
    return records;
  }

  static deleteTargetRecordsByRunId(runId: string): number {
    let count = 0;
    const keysToDelete: string[] = [];
    for (const [key, record] of this.targetRecords.entries()) {
      if (record.migration_run_id === runId) {
        keysToDelete.push(key);
        count++;
      }
    }
    for (const key of keysToDelete) {
      this.targetRecords.delete(key);
    }
    return count;
  }

  // ========================================================================
  // QUARANTINED RECORDS
  // ========================================================================

  static getQuarantinedRecords(runId: string): TransformedRecord[] {
    return this.quarantinedRecords.get(runId) || [];
  }

  static addQuarantineEvent(
    runId: string,
    planId: string,
    count: number
  ): void {
    this.addEvent({
      id: uuidv4(),
      plan_id: planId,
      migration_run_id: runId,
      event_type: EventType.RECORD_QUARANTINED,
      description: `${count} records quarantined due to validation errors`,
      metadata: { quarantined_count: count },
      created_at: new Date().toISOString(),
    });
  }

  // ========================================================================
  // EVENTS
  // ========================================================================

  static addEvent(event: MigrationEvent): void {
    this.events.push(event);
  }

  static getEvents(planId?: string): MigrationEvent[] {
    if (planId) {
      return this.events.filter((e) => e.plan_id === planId);
    }
    return this.events;
  }

  static getAllEvents(): MigrationEvent[] {
    return [...this.events].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // ========================================================================
  // APPROVAL EVENTS
  // ========================================================================

  static addApprovalEvent(planId: string, planVersion: number): void {
    this.addEvent({
      id: uuidv4(),
      plan_id: planId,
      event_type: EventType.PLAN_APPROVED,
      description: `Migration plan v${planVersion} approved for execution`,
      metadata: { version: planVersion },
      created_at: new Date().toISOString(),
    });
  }

  static addRollbackEvent(
    runId: string,
    planId: string,
    recordsRemoved: number
  ): void {
    this.addEvent({
      id: uuidv4(),
      plan_id: planId,
      migration_run_id: runId,
      event_type: EventType.ROLLBACK_COMPLETED,
      description: `Rollback completed: ${recordsRemoved} records removed`,
      metadata: { records_removed: recordsRemoved },
      created_at: new Date().toISOString(),
    });
  }

  // ========================================================================
  // UTILITIES
  // ========================================================================

  static reset(): void {
    this.plans.clear();
    this.planVersions.clear(); // NEW: Clear version history
    this.runs.clear();
    this.dryRunResults.clear();
    this.executionResults.clear();
    this.reconciliationResults.clear();
    this.events = [];
    this.targetRecords.clear();
    this.quarantinedRecords.clear();
  }

  static getStats() {
    return {
      plans: this.plans.size,
      runs: this.runs.size,
      events: this.events.length,
      targetRecords: this.targetRecords.size,
      totalQuarantined: Array.from(this.quarantinedRecords.values()).reduce(
        (sum, arr) => sum + arr.length,
        0
      ),
    };
  }
}
