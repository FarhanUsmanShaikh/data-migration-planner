import { NextRequest, NextResponse } from "next/server";
import { MigrationStore } from "@/lib/store/migration-store";
import { FieldMapping, PlanStatus } from "@/lib/types/migration";
import { v4 as uuidv4 } from "uuid";

/**
 * POST /api/migration/plan/edit
 * Create a new version of a plan with edited mappings
 * 
 * Request body:
 * {
 *   planId: string;
 *   mappingEdits: {
 *     mappingId: string;
 *     changes: Partial<FieldMapping>;
 *   }[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, mappingEdits } = body;

    if (!planId) {
      return NextResponse.json(
        { error: "Missing planId", success: false },
        { status: 400 }
      );
    }

    const currentPlan = MigrationStore.getPlan(planId);
    if (!currentPlan) {
      return NextResponse.json(
        { error: "Plan not found", success: false },
        { status: 404 }
      );
    }

    // Create new plan version
    const newVersion = currentPlan.version + 1;
    const updatedMappings: FieldMapping[] = currentPlan.mappings.map((mapping) => {
      const edit = mappingEdits?.find((e: any) => e.mappingId === mapping.id);
      if (edit) {
        return {
          ...mapping,
          ...edit.changes,
        };
      }
      return mapping;
    });

    const newPlan = {
      ...currentPlan,
      id: currentPlan.id,
      version: newVersion,
      status: PlanStatus.DRAFT, // Reset to DRAFT after edit
      mappings: updatedMappings,
      created_at: new Date().toISOString(),
      approved_at: undefined,
      approved_by: undefined,
    };

    // Save new version
    MigrationStore.savePlanVersion(newPlan);

    return NextResponse.json({
      planId,
      oldVersion: currentPlan.version,
      newVersion,
      plan: newPlan,
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}
