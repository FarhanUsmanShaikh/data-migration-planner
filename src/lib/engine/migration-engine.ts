import {
  LegacyCustomer,
  CustomerMaster,
  FieldMapping,
  DryRunResult,
  ExecutionResult,
  ReconciliationResult,
  ReconciliationStatus,
  MigrationRun,
  RunStatus,
  FieldError,
  TransformedRecord,
} from "@/lib/types/migration";
import { TransformationEngine } from "@/lib/transformations/engine";
import { v4 as uuidv4 } from "uuid";

/**
 * Deterministic Migration Engine
 * Executes approved migration plans
 */
export class MigrationEngine {
  /**
   * Perform a deterministic dry run
   */
  static performDryRun(
    sourceRecords: LegacyCustomer[],
    mappings: FieldMapping[]
  ): DryRunResult {
    const runId = uuidv4();
    const transformedRecords: TransformedRecord[] = [];

    let acceptedCount = 0;
    let rejectedCount = 0;

    for (const sourceRecord of sourceRecords) {
      const result = this.transformAndValidateRecord(sourceRecord, mappings);
      transformedRecords.push(result);

      if (result.is_accepted) {
        acceptedCount++;
      } else {
        rejectedCount++;
      }
    }

    return {
      migration_run_id: runId,
      source_count: sourceRecords.length,
      transformed_count: sourceRecords.length,
      accepted_count: acceptedCount,
      rejected_count: rejectedCount,
      records: transformedRecords,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    };
  }

  /**
   * Public method to validate a data object against mappings and schema
   * Used for quarantine record resolution
   */
  static validateRecord(
    data: Partial<CustomerMaster> & { [key: string]: any },
    mappings: FieldMapping[],
    _targetSchema: any
  ): FieldError[] {
    const validationErrors: FieldError[] = [];

    // Check all required fields are present
    const requiredMappings = mappings.filter((m) => m.is_required);
    for (const mapping of requiredMappings) {
      if (!(mapping.target_field in data) || data[mapping.target_field] === null || data[mapping.target_field] === undefined) {
        validationErrors.push({
          source_field: mapping.source_field,
          target_field: mapping.target_field,
          value: null,
          error_message: `Required field '${mapping.target_field}' is missing`,
          validation_rule: "REQUIRED_FIELD",
        });
      }
    }

    // Validate each field that has data
    for (const mapping of mappings) {
      const value = data[mapping.target_field];
      if (value !== null && value !== undefined) {
        const validationResult = this.validateFieldValue(
          mapping.target_field,
          value,
          mapping.target_type
        );
        if (validationResult.error) {
          validationErrors.push(validationResult.error);
        }
      }
    }

    return validationErrors;
  }

  /**
   * Transform and validate a single record
   */
  private static transformAndValidateRecord(
    sourceRecord: LegacyCustomer,
    mappings: FieldMapping[]
  ): TransformedRecord {
    const transformed: Partial<CustomerMaster> & { [key: string]: any } = {};
    const validationErrors: FieldError[] = [];
    let hasErrors = false;

    for (const mapping of mappings) {
      const sourceValue = (sourceRecord as any)[mapping.source_field];

      // Handle special case for SPLIT_FULL_NAME
      if (
        mapping.transformations.includes("SPLIT_FULL_NAME") &&
        mapping.target_field === "first_name + last_name"
      ) {
        const result = TransformationEngine.transform(
          sourceValue,
          mapping.transformations
        );

        if (result.error) {
          validationErrors.push({
            source_field: mapping.source_field,
            target_field: mapping.target_field,
            value: sourceValue ? String(sourceValue) : null,
            error_message: result.error.error_message,
            validation_rule: result.error.validation_rule,
          });
          hasErrors = true;
        } else if (result.result) {
          transformed.first_name = result.result.first_name;
          transformed.last_name = result.result.last_name;
        }
      }
      // Handle transformation for regular fields
      else {
        const result = TransformationEngine.transform(
          sourceValue,
          mapping.transformations
        );

        if (result.error) {
          validationErrors.push({
            source_field: mapping.source_field,
            target_field: mapping.target_field,
            value: sourceValue ? String(sourceValue) : null,
            error_message: result.error.error_message,
            validation_rule: result.error.validation_rule,
          });
          if (mapping.is_required) {
            hasErrors = true;
          }
        } else {
          // Validate the transformed value
          const validationResult = this.validateFieldValue(
            mapping.target_field,
            result.result,
            mapping.target_type
          );

          if (validationResult.error) {
            validationErrors.push(validationResult.error);
            if (mapping.is_required) {
              hasErrors = true;
            }
          } else {
            transformed[mapping.target_field] = result.result;
          }
        }
      }
    }

    // Final validation: check all required fields are present
    const requiredMappings = mappings.filter((m) => m.is_required);
    for (const mapping of requiredMappings) {
      if (!(mapping.target_field in transformed)) {
        if (mapping.target_field !== "first_name + last_name") {
          validationErrors.push({
            source_field: mapping.source_field,
            target_field: mapping.target_field,
            value: null,
            error_message: `Required field '${mapping.target_field}' is missing`,
            validation_rule: "REQUIRED_FIELD",
          });
          hasErrors = true;
        }
      }
    }

    // Ensure duplicate name fields are combined
    if (transformed.first_name && transformed.last_name) {
      // Good, they're already separate
    } else if (!transformed.first_name || !transformed.last_name) {
      hasErrors = true;
      if (!validationErrors.find((e) => e.target_field === "first_name + last_name")) {
        validationErrors.push({
          source_field: "full_name",
          target_field: "first_name + last_name",
          value: (sourceRecord as any).full_name || null,
          error_message:
            "Failed to split full name into first_name and last_name",
          validation_rule: "SPLIT_FULL_NAME",
        });
      }
    }

    return {
      source_record: sourceRecord,
      transformed_data: transformed,
      validation_errors: validationErrors,
      is_accepted: !hasErrors,
      error_message: hasErrors
        ? `Record rejected: ${validationErrors.length} validation error(s)`
        : undefined,
    };
  }

  /**
   * Validate a single field value
   */
  private static validateFieldValue(
    fieldName: string,
    value: any,
    fieldType: string
  ): { error?: FieldError } {
    switch (fieldName) {
      case "email": {
        if (value === null) {
          return {
            error: {
              source_field: "",
              target_field: "email",
              value: null,
              error_message: "Email is required",
              validation_rule: "TARGET_EMAIL_VALIDATION",
            },
          };
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return {
            error: {
              source_field: "",
              target_field: "email",
              value: String(value),
              error_message: "Invalid email format",
              validation_rule: "TARGET_EMAIL_VALIDATION",
            },
          };
        }
        break;
      }

      case "active": {
        if (typeof value !== "boolean") {
          return {
            error: {
              source_field: "",
              target_field: "active",
              value: String(value),
              error_message: "Active must be a boolean",
              validation_rule: "TARGET_BOOLEAN_VALIDATION",
            },
          };
        }
        break;
      }

      case "registered_at": {
        if (value === null) {
          return {
            error: {
              source_field: "",
              target_field: "registered_at",
              value: null,
              error_message: "Registered_at is required",
              validation_rule: "TARGET_DATE_VALIDATION",
            },
          };
        }
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return {
            error: {
              source_field: "",
              target_field: "registered_at",
              value: String(value),
              error_message: "Invalid ISO date format",
              validation_rule: "TARGET_DATE_VALIDATION",
            },
          };
        }
        break;
      }

      case "marketing_opt_in": {
        if (typeof value !== "boolean") {
          return {
            error: {
              source_field: "",
              target_field: "marketing_opt_in",
              value: String(value),
              error_message: "Marketing_opt_in must be a boolean",
              validation_rule: "TARGET_BOOLEAN_VALIDATION",
            },
          };
        }
        break;
      }

      case "credit_limit": {
        if (typeof value !== "number") {
          return {
            error: {
              source_field: "",
              target_field: "credit_limit",
              value: String(value),
              error_message: "Credit_limit must be a number",
              validation_rule: "TARGET_NUMBER_VALIDATION",
            },
          };
        }
        break;
      }

      case "country_code": {
        if (value === null || value === undefined || value === "") {
          return {
            error: {
              source_field: "",
              target_field: "country_code",
              value: String(value),
              error_message: "Country_code is required",
              validation_rule: "TARGET_REQUIRED_VALIDATION",
            },
          };
        }
        break;
      }
    }

    return {};
  }

  /**
   * Execute migration (insert accepted records into target)
   * Prevents duplicates using source_record_id + migration_run_id
   */
  static executeMigration(
    dryRunResult: DryRunResult,
    planVersionId: string,
    existingRecords: Map<string, CustomerMaster>
  ): ExecutionResult {
    const acceptedRecords = dryRunResult.records.filter((r) => r.is_accepted);
    let insertedCount = 0;
    let skippedDuplicateCount = 0;
    let rejectedCount = 0;

    for (const record of acceptedRecords) {
      const uniqueKey = `${record.source_record.legacy_customer_id}-${dryRunResult.migration_run_id}`;

      // Check for duplicate
      if (existingRecords.has(uniqueKey)) {
        skippedDuplicateCount++;
        continue;
      }

      // Insert record
      const targetRecord: CustomerMaster = {
        id: record.source_record.legacy_customer_id,
        first_name: record.transformed_data.first_name || "",
        last_name: record.transformed_data.last_name || "",
        email: record.transformed_data.email || "",
        phone_number: record.transformed_data.phone_number || null,
        active: record.transformed_data.active ?? false,
        registered_at: record.transformed_data.registered_at || new Date().toISOString(),
        city: record.transformed_data.city || null,
        country_code: record.transformed_data.country_code || "",
        marketing_opt_in: record.transformed_data.marketing_opt_in ?? false,
        credit_limit: record.transformed_data.credit_limit || 0,
        source_record_id: record.source_record.legacy_customer_id,
        migration_run_id: dryRunResult.migration_run_id,
        migration_plan_version_id: planVersionId,
      };

      // Store in map to track duplicates
      existingRecords.set(uniqueKey, targetRecord);
      insertedCount++;
    }

    rejectedCount = dryRunResult.rejected_count;

    return {
      migration_run_id: dryRunResult.migration_run_id,
      inserted_count: insertedCount,
      skipped_duplicate_count: skippedDuplicateCount,
      rejected_count: rejectedCount,
      executed_at: new Date().toISOString(),
    };
  }

  /**
   * Perform reconciliation
   */
  static performReconciliation(
    sourceCount: number,
    acceptedCount: number,
    rejectedCount: number,
    targetCount: number,
    migrationRunId: string
  ): ReconciliationResult {
    const difference = targetCount - acceptedCount;

    let status: ReconciliationStatus;
    if (difference === 0 && targetCount === acceptedCount) {
      status = ReconciliationStatus.PASS;
    } else if (
      difference === 0 &&
      targetCount + rejectedCount === sourceCount
    ) {
      status = ReconciliationStatus.PASS;
    } else {
      status = ReconciliationStatus.FAIL;
    }

    return {
      migration_run_id: migrationRunId,
      source_count: sourceCount,
      accepted_count: acceptedCount,
      rejected_count: rejectedCount,
      target_count: targetCount,
      difference,
      reconciliation_status: status,
      executed_at: new Date().toISOString(),
    };
  }

  /**
   * Rollback migration (remove migration-owned records)
   */
  static rollbackMigration(
    migrationRunId: string,
    targetRecords: Map<string, CustomerMaster>
  ): { removedCount: number } {
    const toRemove: string[] = [];

    for (const [key, record] of targetRecords.entries()) {
      if (record.migration_run_id === migrationRunId) {
        toRemove.push(key);
      }
    }

    for (const key of toRemove) {
      targetRecords.delete(key);
    }

    return { removedCount: toRemove.length };
  }
}
