import {
  Schema,
  SchemaField,
  FieldMapping,
  MigrationRisk,
  ClarificationQuestion,
  ConfidenceLevel,
  RiskLevel,
  LegacyCustomer,
  CustomerMaster,
  MigrationPlanProposal,
  PlanStatus,
} from "@/lib/types/migration";
import { TRANSFORMATION_REGISTRY } from "@/lib/transformations/registry";
import { v4 as uuidv4 } from "uuid";

/**
 * Rule-based Migration Planner
 * Analyzes schemas and proposes mappings without executing migrations
 */
export class RuleBasedMigrationPlanner {
  private sourceSchema: Schema;
  private targetSchema: Schema;
  private sampleRecords: LegacyCustomer[];

  constructor(
    sourceSchema: Schema,
    targetSchema: Schema,
    sampleRecords: LegacyCustomer[]
  ) {
    this.sourceSchema = sourceSchema;
    this.targetSchema = targetSchema;
    this.sampleRecords = sampleRecords;
  }

  /**
   * Inspect source schema (controlled tool)
   */
  inspectSourceSchema(): Schema {
    return this.sourceSchema;
  }

  /**
   * Inspect target schema (controlled tool)
   */
  inspectTargetSchema(): Schema {
    return this.targetSchema;
  }

  /**
   * Inspect sample records (controlled tool)
   */
  inspectSampleRecords(): LegacyCustomer[] {
    return this.sampleRecords;
  }

  /**
   * Propose field mappings between source and target schemas
   */
  proposeMappings(): FieldMapping[] {
    const mappings: FieldMapping[] = [];

    // Define known mappings based on field names and types
    const knownMappings = [
      {
        source: "legacy_customer_id",
        target: "id",
        transformations: ["DIRECT_COPY"],
      },
      {
        source: "full_name",
        target: "first_name + last_name",
        transformations: ["SPLIT_FULL_NAME"],
      },
      {
        source: "email_address",
        target: "email",
        transformations: ["TRIM", "LOWERCASE"],
      },
      {
        source: "phone",
        target: "phone_number",
        transformations: ["TRIM", "NULL_IF_EMPTY"],
      },
      {
        source: "customer_status",
        target: "active",
        transformations: ["STATUS_TO_BOOLEAN"],
      },
      {
        source: "signup_date",
        target: "registered_at",
        transformations: ["DATE_STRING_TO_ISO_DATE"],
      },
      {
        source: "city",
        target: "city",
        transformations: ["TRIM", "NULL_IF_EMPTY"],
      },
      {
        source: "country_code",
        target: "country_code",
        transformations: ["UPPERCASE"],
      },
      {
        source: "marketing_opt_in",
        target: "marketing_opt_in",
        transformations: ["STRING_TO_BOOLEAN"],
      },
      {
        source: "credit_limit",
        target: "credit_limit",
        transformations: ["STRING_TO_DECIMAL"],
      },
    ];

    for (const mapping of knownMappings) {
      const sourceField = this.sourceSchema.fields.find(
        (f) => f.name === mapping.source
      );
      const targetField = this.targetSchema.fields.find(
        (f) => f.name === mapping.target
      );

      if (sourceField && targetField) {
        const confidence = this.calculateConfidence(
          sourceField,
          targetField,
          mapping.transformations
        );
        const riskLevel = this.assessRiskLevel(sourceField, targetField);

        mappings.push({
          id: uuidv4(),
          source_field: sourceField.name,
          target_field: targetField.name,
          source_type: sourceField.type,
          target_type: targetField.type,
          transformations: mapping.transformations,
          confidence,
          confidence_level: this.getConfidenceLevel(confidence),
          risk_level: riskLevel,
          is_required: targetField.required,
          is_computed: false,
          explanation: this.generateExplanation(sourceField, targetField, mapping.transformations),
        });
      }
    }

    return mappings;
  }

  /**
   * Identify risks in the proposed mappings
   */
  identifyRisks(mappings: FieldMapping[]): MigrationRisk[] {
    const risks: MigrationRisk[] = [];

    // Check for missing required fields
    for (const targetField of this.targetSchema.fields) {
      const mapped = mappings.some((m) => m.target_field === targetField.name);
      if (!mapped && targetField.required) {
        risks.push({
          id: uuidv4(),
          risk_type: "MISSING_REQUIRED_FIELD",
          description: `Required target field '${targetField.name}' is not mapped`,
          affected_field: targetField.name,
          recommendation: `Map a source field to '${targetField.name}'`,
          severity: RiskLevel.HIGH,
        });
      }
    }

    // Check for type incompatibilities
    for (const mapping of mappings) {
      if (mapping.source_type !== mapping.target_type) {
        const transformations = mapping.transformations;
        if (transformations.length === 0) {
          risks.push({
            id: uuidv4(),
            risk_type: "TYPE_MISMATCH",
            description: `Type mismatch: '${mapping.source_field}' (${mapping.source_type}) → '${mapping.target_field}' (${mapping.target_type}) without transformation`,
            affected_field: mapping.target_field,
            recommendation: `Add appropriate transformation to convert from ${mapping.source_type} to ${mapping.target_type}`,
            severity: RiskLevel.HIGH,
          });
        }
      }
    }

    // Check for data quality issues in sample records
    const dataQualityRisks = this.analyzeDataQuality();
    risks.push(...dataQualityRisks);

    return risks;
  }

  /**
   * Generate clarification questions based on detected risks
   */
  generateClarificationQuestions(
    mappings: FieldMapping[],
    risks: MigrationRisk[]
  ): ClarificationQuestion[] {
    const questions: ClarificationQuestion[] = [];

    // Question about status mapping
    if (mappings.some((m) => m.source_field === "customer_status")) {
      questions.push({
        id: uuidv4(),
        question:
          "Should customer_status values other than 'active' and 'verified' map to active = false?",
        suggested_answer: "Yes",
        answered_at: undefined,
      });
    }

    // Question about null handling
    const phoneMapping = mappings.find((m) => m.source_field === "phone");
    if (phoneMapping) {
      questions.push({
        id: uuidv4(),
        question: "Is it acceptable to store empty phone numbers as NULL?",
        suggested_answer: "Yes",
        answered_at: undefined,
      });
    }

    // Question about name splitting
    const nameMapping = mappings.find((m) => m.source_field === "full_name");
    if (nameMapping) {
      const recordsWithMultipleNames = this.sampleRecords.filter(
        (r) => r.full_name && r.full_name.split(/\s+/).length > 2
      );
      if (recordsWithMultipleNames.length > 0) {
        questions.push({
          id: uuidv4(),
          question: `Some records have multi-part names (e.g., "${recordsWithMultipleNames[0].full_name}"). Should extra name components be combined into the last_name field?`,
          suggested_answer: "Yes",
          answered_at: undefined,
        });
      }
    }

    // Question about credit limit defaults
    const creditMapping = mappings.find((m) => m.source_field === "credit_limit");
    if (creditMapping) {
      const recordsWithoutCredit = this.sampleRecords.filter(
        (r) => !r.credit_limit || r.credit_limit === ""
      );
      if (recordsWithoutCredit.length > 0) {
        questions.push({
          id: uuidv4(),
          question: `${recordsWithoutCredit.length} records have missing credit_limit. What should the default value be?`,
          suggested_answer: "0.00",
          answered_at: undefined,
        });
      }
    }

    return questions;
  }

  /**
   * Create a complete migration plan proposal
   */
  createPlan(planId: string, planName: string): MigrationPlanProposal {
    const mappings = this.proposeMappings();
    const risks = this.identifyRisks(mappings);
    const questions = this.generateClarificationQuestions(mappings, risks);

    const confidence_summary =
      mappings.length > 0
        ? mappings.reduce((sum, m) => sum + m.confidence, 0) / mappings.length
        : 0;

    return {
      id: planId,
      name: planName,
      version: 1,
      status: PlanStatus.DRAFT,
      source_table: this.sourceSchema.table_name,
      target_table: this.targetSchema.table_name,
      source_schema: this.sourceSchema, // NEW: Include source schema in plan
      target_schema: this.targetSchema, // NEW: Include target schema in plan
      mappings,
      risks,
      clarification_questions: questions,
      confidence_summary,
      created_at: new Date().toISOString(),
    };
  }

  // ========================================================================
  // PRIVATE HELPER METHODS
  // ========================================================================

  private calculateConfidence(
    sourceField: SchemaField,
    targetField: SchemaField,
    transformations: string[]
  ): number {
    let confidence = 0.5; // Base 50%

    // Check type compatibility
    if (sourceField.type === targetField.type) {
      confidence += 0.3; // +30% for matching types
    } else {
      // Check if transformations can bridge the gap
      const allTransformationsSupported = transformations.every((t) => {
        const rule = TRANSFORMATION_REGISTRY[t];
        return (
          rule &&
          rule.supported_source_types.includes(sourceField.type) &&
          rule.supported_target_types.includes(targetField.type)
        );
      });
      if (allTransformationsSupported) {
        confidence += 0.2; // +20% if transformations are supported
      }
    }

    // Check nullable compatibility
    if (sourceField.nullable === targetField.nullable) {
      confidence += 0.1; // +10% for matching nullability
    }

    // Check field name similarity
    if (sourceField.name === targetField.name) {
      confidence += 0.1; // +10% for exact name match
    } else if (
      sourceField.name.toLowerCase().includes(targetField.name.toLowerCase())
    ) {
      confidence += 0.05; // +5% for partial name match
    }

    return Math.min(confidence, 1);
  }

  private getConfidenceLevel(confidence: number): ConfidenceLevel {
    if (confidence >= 0.75) {
      return ConfidenceLevel.HIGH;
    } else if (confidence >= 0.5) {
      return ConfidenceLevel.MEDIUM;
    }
    return ConfidenceLevel.LOW;
  }

  private assessRiskLevel(
    sourceField: SchemaField,
    targetField: SchemaField
  ): RiskLevel {
    if (sourceField.type !== targetField.type) {
      return RiskLevel.MEDIUM;
    }
    if (sourceField.nullable && !targetField.nullable) {
      return RiskLevel.HIGH;
    }
    return RiskLevel.LOW;
  }

  private analyzeDataQuality(): MigrationRisk[] {
    const risks: MigrationRisk[] = [];

    // Check for missing full names
    const recordsWithoutFullName = this.sampleRecords.filter(
      (r) => !r.full_name || r.full_name.trim() === ""
    );
    if (recordsWithoutFullName.length > 0) {
      risks.push({
        id: uuidv4(),
        risk_type: "MISSING_DATA",
        description: `${recordsWithoutFullName.length} records have missing full_name`,
        affected_field: "full_name",
        recommendation:
          "Review records with missing names and decide on treatment (quarantine or default)",
        severity: RiskLevel.MEDIUM,
      });
    }

    // Check for invalid emails
    const recordsWithInvalidEmail = this.sampleRecords.filter(
      (r) => !this.isValidEmail(r.email_address)
    );
    if (recordsWithInvalidEmail.length > 0) {
      risks.push({
        id: uuidv4(),
        risk_type: "INVALID_DATA",
        description: `${recordsWithInvalidEmail.length} records have invalid email addresses`,
        affected_field: "email_address",
        recommendation:
          "Invalid emails will be quarantined during migration",
        severity: RiskLevel.MEDIUM,
      });
    }

    // Check for invalid dates
    const recordsWithInvalidDate = this.sampleRecords.filter(
      (r) => !this.isValidDate(r.signup_date)
    );
    if (recordsWithInvalidDate.length > 0) {
      risks.push({
        id: uuidv4(),
        risk_type: "INVALID_DATA",
        description: `${recordsWithInvalidDate.length} records have invalid signup_date`,
        affected_field: "signup_date",
        recommendation: "Invalid dates will be quarantined during migration",
        severity: RiskLevel.MEDIUM,
      });
    }

    // Check for unsupported customer statuses
    const validStatuses = ["active", "verified", "approved", "inactive", "pending"];
    const recordsWithInvalidStatus = this.sampleRecords.filter(
      (r) =>
        !validStatuses.includes(String(r.customer_status).toLowerCase().trim())
    );
    if (recordsWithInvalidStatus.length > 0) {
      risks.push({
        id: uuidv4(),
        risk_type: "INVALID_DATA",
        description: `${recordsWithInvalidStatus.length} records have unsupported customer_status values`,
        affected_field: "customer_status",
        recommendation:
          "Unsupported statuses will map to active=false. Review if acceptable.",
        severity: RiskLevel.LOW,
      });
    }

    // Check for missing country code
    const recordsWithoutCountry = this.sampleRecords.filter(
      (r) => !r.country_code || r.country_code.trim() === ""
    );
    if (recordsWithoutCountry.length > 0) {
      risks.push({
        id: uuidv4(),
        risk_type: "MISSING_REQUIRED_DATA",
        description: `${recordsWithoutCountry.length} records have missing country_code (required field)`,
        affected_field: "country_code",
        recommendation:
          "Records without country code will be quarantined",
        severity: RiskLevel.HIGH,
      });
    }

    return risks;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidDate(dateString: string): boolean {
    if (!dateString || dateString.trim() === "") {
      return false;
    }
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  private generateExplanation(
    sourceField: SchemaField,
    targetField: SchemaField,
    transformations: string[]
  ): string {
    const transformNames = transformations
      .map((t) => TRANSFORMATION_REGISTRY[t]?.name || t)
      .join(" → ");
    return `Maps ${sourceField.name} (${sourceField.type}) to ${targetField.name} (${targetField.type}) using transformations: ${transformNames}`;
  }
}
