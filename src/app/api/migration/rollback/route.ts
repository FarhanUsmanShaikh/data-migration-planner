import { NextRequest, NextResponse } from "next/server";
import { MigrationStore } from "@/lib/store/migration-store";
import { MigrationEngine } from "@/lib/engine/migration-engine";
import { RunStatus } from "@/lib/types/migration";

/**
 * POST /api/migration/rollback
 * Rollback a completed migration
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

    const run = MigrationStore.getRun(runId);
    if (!run) {
      return NextResponse.json(
        { error: "Run not found", success: false },
        { status: 404 }
      );
    }

    // Update run status
    run.status = RunStatus.ROLLBACK_IN_PROGRESS;
    run.rollback_started_at = new Date().toISOString();
    MigrationStore.updateRun(run);

    // Perform rollback
    const targetRecords = MigrationStore.getTargetRecords();
    const rollbackResult = MigrationEngine.rollbackMigration(runId, targetRecords);

    // Update run status
    run.status = RunStatus.ROLLBACK_COMPLETED;
    run.rollback_completed_at = new Date().toISOString();
    MigrationStore.updateRun(run);

    // Record rollback event
    MigrationStore.addRollbackEvent(runId, planId, rollbackResult.removedCount);

    return NextResponse.json({
      rollbackResult,
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
