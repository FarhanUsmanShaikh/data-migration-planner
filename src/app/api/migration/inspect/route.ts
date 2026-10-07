import { NextRequest, NextResponse } from "next/server";
import { SOURCE_SCHEMA, TARGET_SCHEMA, SEED_RECORDS } from "@/lib/data/seed-data";

/**
 * GET /api/migration/inspect?type=source|target|records
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "source";

    switch (type) {
      case "source":
        return NextResponse.json({
          schema: SOURCE_SCHEMA,
          record_count: SEED_RECORDS.length,
          success: true,
        });

      case "target":
        return NextResponse.json({
          schema: TARGET_SCHEMA,
          success: true,
        });

      case "records":
        return NextResponse.json({
          records: SEED_RECORDS,
          record_count: SEED_RECORDS.length,
          success: true,
        });

      default:
        return NextResponse.json(
          { error: "Invalid type parameter", success: false },
          { status: 400 }
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}
