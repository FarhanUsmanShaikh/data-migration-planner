import { NextRequest, NextResponse } from "next/server";
import { MigrationStore } from "@/lib/store/migration-store";
import { MigrationEngine } from "@/lib/engine/migration-engine";
import { TransformedRecord } from "@/lib/types/migration";
import { v4 as uuidv4 } from "uuid";

/**
 * POST /api/migration/quarantine/resolve
 * Resolve quarantined records by correcting field values and re-validating
 * 
 * Request body:
 * {
 *   runId: string;
 *   planId: string;
 *   recordCorrections: {
 *     sourceRecordId: number;
 *     fieldCorrections: {
 *       fieldName: string;
 *       correctedValue: string | null;
 *     }[]
 *   }[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { runId, planId, recordCorrections } = body;

    if (!runId || !planId || !recordCorrections) {
      return NextResponse.json(
        { error: "Missing runId, planId, or recordCorrections", success: false },
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

    const quarantinedRecords = MigrationStore.getQuarantinedRecords(runId);
    if (!quarantinedRecords || quarantinedRecords.length === 0) {
      return NextResponse.json(
        { error: "No quarantined records found for this run", success: false },
        { status: 404 }
      );
    }

    // Apply corrections to quarantined records
    const resolvedRecords: TransformedRecord[] = [];
    const stillQuarantined: TransformedRecord[] = [];

    for (const quarantinedRecord of quarantinedRecords) {
      const correction = recordCorrections.find(
        (c: any) => c.sourceRecordId === quarantinedRecord.source_record.legacy_customer_id
      );

      if (correction) {
        // Apply field corrections
        const correctedData = { ...quarantinedRecord.transformed_data };
        for (const fieldCorrection of correction.fieldCorrections) {
          correctedData[fieldCorrection.fieldName] = fieldCorrection.correctedValue;
        }

        // Re-validate the corrected record
        const validationErrors = MigrationEngine.validateRecord(
          correctedData,
          plan.mappings,
          plan.target_schema
        );

        if (validationErrors.length === 0) {
          // Record is now valid
          resolvedRecords.push({
            ...quarantinedRecord,
            transformed_data: correctedData,
            validation_errors: [],
            is_accepted: true,
            error_message: undefined,
          });
        } else {
          // Still has errors
          stillQuarantined.push({
            ...quarantinedRecord,
            transformed_data: correctedData,
            validation_errors: validationErrors,
            is_accepted: false,
          });
        }
      } else {
        // No correction provided, keep quarantined
        stillQuarantined.push(quarantinedRecord);
      }
    }

    // Log resolution event
    MigrationStore.addEvent({
      id: uuidv4(),
      plan_id: planId,
      migration_run_id: runId,
      event_type: "RECORD_QUARANTINE_RESOLVED" as any,
      description: `Quarantine resolution: ${resolvedRecords.length} records resolved, ${stillQuarantined.length} still quarantined`,
      metadata: {
        resolved_count: resolvedRecords.length,
        still_quarantined_count: stillQuarantined.length,
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      runId,
      planId,
      resolvedRecords,
      stillQuarantined,
      resolved_count: resolvedRecords.length,
      still_quarantined_count: stillQuarantined.length,
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}
