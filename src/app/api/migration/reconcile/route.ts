import { NextRequest, NextResponse } from "next/server";
import { MigrationStore } from "@/lib/store/migration-store";
import { MigrationEngine } from "@/lib/engine/migration-engine";

/**
 * POST /api/migration/reconcile
 * Perform reconciliation between source and target
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

    // Get target record count
    const targetRecords = MigrationStore.getTargetRecordByRunId(runId);
    const targetCount = targetRecords.length;

    // Perform reconciliation
    const reconciliationResult = MigrationEngine.performReconciliation(
      run.source_record_count,
      run.accepted_count,
      run.rejected_count,
      targetCount,
      runId
    );

    // Save reconciliation result
    MigrationStore.saveReconciliationResult(reconciliationResult, planId);

    return NextResponse.json({
      reconciliationResult,
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}
