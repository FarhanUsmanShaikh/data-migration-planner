import { NextRequest, NextResponse } from "next/server";
import { MigrationStore } from "@/lib/store/migration-store";
import { MigrationEngine } from "@/lib/engine/migration-engine";
import { RunStatus, PlanStatus } from "@/lib/types/migration";

/**
 * POST /api/migration/execute
 * Execute the migration (insert accepted records)
 * Requires plan to be in APPROVED status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, runId } = body;

    if (!planId || !runId) {
      return NextResponse.json(
        { error: "Missing planId or runId", success: false },
        { status: 400 }
      );
    }

    const plan = MigrationStore.getPlan(planId);
    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found", success: false },
        { status: 404 }
      );
    }

    // NEW: Check approval status
    if (plan.status !== PlanStatus.APPROVED) {
      return NextResponse.json(
        { 
          error: `Plan must be APPROVED for execution. Current status: ${plan.status}`, 
          success: false,
          current_status: plan.status,
          required_status: PlanStatus.APPROVED,
        },
        { status: 403 }
      );
    }

    const run = MigrationStore.getRun(runId);
    if (!run) {
      return NextResponse.json(
        { error: "Run not found", success: false },
        { status: 404 }
      );
    }

    const dryRunResult = MigrationStore.getDryRunResult(runId);
    if (!dryRunResult) {
      return NextResponse.json(
        { error: "Dry run not found", success: false },
        { status: 404 }
      );
    }

    // Update run status
    run.status = RunStatus.EXECUTION_IN_PROGRESS;
    run.execution_started_at = new Date().toISOString();
    run.retry_count = (run.retry_count || 0) + 1;
    run.last_retry_at = new Date().toISOString();
    MigrationStore.updateRun(run);

    // Execute migration
    const targetRecords = MigrationStore.getTargetRecords();
    const executionResult = MigrationEngine.executeMigration(
      dryRunResult,
      plan.id,
      targetRecords
    );

    // Store target records
    for (const [key, record] of targetRecords.entries()) {
      if (record.migration_run_id === dryRunResult.migration_run_id) {
        MigrationStore.insertTargetRecord(key, record);
      }
    }

    // Update run with execution results
    run.status = RunStatus.EXECUTION_COMPLETED;
    run.execution_completed_at = new Date().toISOString();
    run.inserted_count = executionResult.inserted_count;
    run.skipped_duplicate_count = executionResult.skipped_duplicate_count;
    MigrationStore.updateRun(run);

    // Save execution result
    MigrationStore.saveExecutionResult(executionResult, planId);

    return NextResponse.json({
      executionResult,
      run,
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}
