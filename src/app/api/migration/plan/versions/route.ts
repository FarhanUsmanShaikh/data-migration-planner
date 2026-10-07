import { NextRequest, NextResponse } from "next/server";
import { MigrationStore } from "@/lib/store/migration-store";

/**
 * GET /api/migration/plan/[id]/versions
 * List all versions of a migration plan
 */
export async function GET(request: NextRequest) {
  try {
    const planId = request.nextUrl.searchParams.get("planId") || request.nextUrl.searchParams.get("id");

    if (!planId) {
      return NextResponse.json(
        { error: "Missing planId", success: false },
        { status: 400 }
      );
    }

    const versions = MigrationStore.listVersions(planId);

    if (versions.length === 0) {
      return NextResponse.json(
        { 
          error: "Plan not found or no versions exist", 
          success: false 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      planId,
      versions,
      total_versions: versions.length,
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}
