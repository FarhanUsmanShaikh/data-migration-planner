import { NextRequest, NextResponse } from "next/server";
import { MigrationStore } from "@/lib/store/migration-store";
import { PlanStatus, RunStatus } from "@/lib/types/migration";
import { v4 as uuidv4 } from "uuid";
import { SEED_RECORDS } from "@/lib/data/seed-data";

/**
 * POST /api/migration/approve
 * Approve a migration plan and prepare for execution
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json(
        { error: "Missing planId", success: false },
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

    // Update plan status
    plan.status = PlanStatus.APPROVED;
    plan.approved_at = new Date().toISOString();
    plan.approved_by = "Demo User";
    MigrationStore.updatePlan(plan);

    // Create a migration run
    const runId = uuidv4();
    const run = {
      id: runId,
      plan_id: planId,
      plan_version_id: plan.id,
      status: RunStatus.INITIALIZED,
      source_record_count: SEED_RECORDS.length,
      transformed_count: 0,
      accepted_count: 0,
      rejected_count: 0,
      inserted_count: 0,
      skipped_duplicate_count: 0,
      retry_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    MigrationStore.saveRun(run);
    MigrationStore.addApprovalEvent(planId, plan.version);

    return NextResponse.json({
      plan,
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
