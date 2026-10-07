import { NextRequest, NextResponse } from "next/server";
import { MigrationStore } from "@/lib/store/migration-store";

/**
 * GET /api/migration/events?planId=xxx
 * Get all events for a plan or all events
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const planId = searchParams.get("planId");

    const events = planId
      ? MigrationStore.getEvents(planId)
      : MigrationStore.getAllEvents();

    return NextResponse.json({
      events,
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}
