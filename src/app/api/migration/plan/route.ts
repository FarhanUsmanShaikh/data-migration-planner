import { NextRequest, NextResponse } from "next/server";
import { RuleBasedMigrationPlanner } from "@/lib/planner/migration-planner";
import { MigrationStore } from "@/lib/store/migration-store";
import { SOURCE_SCHEMA, TARGET_SCHEMA, SEED_RECORDS } from "@/lib/data/seed-data";
import { v4 as uuidv4 } from "uuid";
import { MigrationPlanProposal, PlanStatus } from "@/lib/types/migration";

/**
 * GET /api/migration/plan
 * Get all migration plans
 */
export async function GET(request: NextRequest) {
  try {
    const plans = MigrationStore.getAllPlans();
    return NextResponse.json({ plans, success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}

/**
 * POST /api/migration/plan
 * Create a new migration plan
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Analyze schemas and propose mappings
    const planner = new RuleBasedMigrationPlanner(
      SOURCE_SCHEMA,
      TARGET_SCHEMA,
      SEED_RECORDS
    );

    const planId = uuidv4();
    const plan = planner.createPlan(planId, body.name || "Demo Migration Plan");

    // Save plan
    MigrationStore.savePlan(plan);

    return NextResponse.json({ plan, success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}
