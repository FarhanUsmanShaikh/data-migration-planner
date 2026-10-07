import { NextRequest, NextResponse } from "next/server";
import { MigrationStore } from "@/lib/store/migration-store";
import { MigrationEngine } from "@/lib/engine/migration-engine";
import { RunStatus } from "@/lib/types/migration";
import { SEED_RECORDS } from "@/lib/data/seed-data";

/**
 * POST /api/migration/dry-run
 * Execute a dry run for a migration
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

    const run = MigrationStore.getRun(runId);
    if (!run) {
      return NextResponse.json(
        { error: "Run not found", success: false },
        { status: 404 }
      );
    }

    // Update run status
    run.status = RunStatus.DRY_RUN_IN_PROGRESS;
    run.dry_run_started_at = new Date().toISOString();
    MigrationStore.updateRun(run);

    // Perform dry run
    const dryRunResult = MigrationEngine.performDryRun(
      SEED_RECORDS,
      plan.mappings
    );

    // Update run with results
    run.status = RunStatus.DRY_RUN_COMPLETED;
    run.dry_run_completed_at = new Date().toISOString();
    run.source_record_count = dryRunResult.source_count;
    run.transformed_count = dryRunResult.transformed_count;
    run.accepted_count = dryRunResult.accepted_count;
    run.rejected_count = dryRunResult.rejected_count;
    MigrationStore.updateRun(run);

    // Save dry run result
    MigrationStore.saveDryRunResult(dryRunResult);
    MigrationStore.addQuarantineEvent(
      runId,
      planId,
      dryRunResult.rejected_count
    );

    return NextResponse.json({
      dryRunResult,
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
