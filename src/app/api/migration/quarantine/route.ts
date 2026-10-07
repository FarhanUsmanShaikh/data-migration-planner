import { NextRequest, NextResponse } from "next/server";
import { MigrationStore } from "@/lib/store/migration-store";

/**
 * GET /api/migration/quarantine?runId=xxx
 * Get quarantined records for a run
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const runId = searchParams.get("runId");

    if (!runId) {
      return NextResponse.json(
        { error: "Missing runId parameter", success: false },
        { status: 400 }
      );
    }

    const quarantinedRecords = MigrationStore.getQuarantinedRecords(runId);

    return NextResponse.json({
      records: quarantinedRecords,
      count: quarantinedRecords.length,
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}
