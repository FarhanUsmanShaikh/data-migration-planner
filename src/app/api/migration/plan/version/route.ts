import { NextRequest, NextResponse } from "next/server";
import { MigrationStore } from "@/lib/store/migration-store";

/**
 * GET /api/migration/plan/version?planId=xxx&version=2
 * Get a specific version of a migration plan
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const planId = searchParams.get("planId");
    const versionStr = searchParams.get("version");

    if (!planId || !versionStr) {
      return NextResponse.json(
        { error: "Missing planId or version parameter", success: false },
        { status: 400 }
      );
    }

    const version = parseInt(versionStr, 10);
    if (isNaN(version)) {
      return NextResponse.json(
        { error: "Invalid version number", success: false },
        { status: 400 }
      );
    }

    const plan = MigrationStore.getPlanVersion(planId, version);

    if (!plan) {
      return NextResponse.json(
        { error: "Plan version not found", success: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      plan,
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}
