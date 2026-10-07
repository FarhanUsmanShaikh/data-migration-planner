// ============================================================================
// CORE MIGRATION TYPES
// ============================================================================

export enum ConfidenceLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export enum RiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export enum PlanStatus {
  DRAFT = "DRAFT",
  READY_FOR_REVIEW = "READY_FOR_REVIEW",
  APPROVED = "APPROVED",
  DRY_RUN_COMPLETED = "DRY_RUN_COMPLETED",
  EXECUTABLE = "EXECUTABLE",
  EXECUTED = "EXECUTED",
  ROLLED_BACK = "ROLLED_BACK",
}

export enum RunStatus {
  INITIALIZED = "INITIALIZED",
  DRY_RUN_IN_PROGRESS = "DRY_RUN_IN_PROGRESS",
  DRY_RUN_COMPLETED = "DRY_RUN_COMPLETED",
  READY_FOR_EXECUTION = "READY_FOR_EXECUTION",
  EXECUTION_IN_PROGRESS = "EXECUTION_IN_PROGRESS",
  EXECUTION_COMPLETED = "EXECUTION_COMPLETED",
  ROLLBACK_IN_PROGRESS = "ROLLBACK_IN_PROGRESS",
  ROLLBACK_COMPLETED = "ROLLBACK_COMPLETED",
  FAILED = "FAILED",
}

export enum ReconciliationStatus {
  PASS = "PASS",
  FAIL = "FAIL",
  WARNING = "WARNING",
}

export enum EventType {
  PLAN_CREATED = "PLAN_CREATED",
  PLAN_VERSION_CREATED = "PLAN_VERSION_CREATED",
  PLAN_APPROVED = "PLAN_APPROVED",
  PLAN_REJECTED = "PLAN_REJECTED",
  DRY_RUN_STARTED = "DRY_RUN_STARTED",
  DRY_RUN_COMPLETED = "DRY_RUN_COMPLETED",
  RECORD_QUARANTINED = "RECORD_QUARANTINED",
  MIGRATION_EXECUTION_STARTED = "MIGRATION_EXECUTION_STARTED",
  MIGRATION_EXECUTION_COMPLETED = "MIGRATION_EXECUTION_COMPLETED",
  MIGRATION_RETRY_STARTED = "MIGRATION_RETRY_STARTED",
  DUPLICATE_SKIPPED = "DUPLICATE_SKIPPED",
  RECONCILIATION_COMPLETED = "RECONCILIATION_COMPLETED",
  ROLLBACK_STARTED = "ROLLBACK_STARTED",
  ROLLBACK_COMPLETED = "ROLLBACK_COMPLETED",
}

// ============================================================================
// SCHEMA MODELS
// ============================================================================

export interface SchemaField {
  name: string;
  type: string; // "string", "number", "boolean", "date", "decimal"
  required: boolean;
  nullable: boolean;
  description?: string;
}

export interface Schema {
  table_name: string;
  fields: SchemaField[];
}

// ============================================================================
// SOURCE RECORD
// ============================================================================

export interface LegacyCustomer {
  legacy_customer_id: number;
  full_name: string;
  email_address: string;
  phone: string | null;
  customer_status: string;
  signup_date: string;
  city: string | null;
  country_code: string;
  marketing_opt_in: string | null;
  credit_limit: string | null;
}

// ============================================================================
// TARGET RECORD
// ============================================================================

export interface CustomerMaster {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  active: boolean;
  registered_at: string; // ISO date
  city: string | null;
  country_code: string;
  marketing_opt_in: boolean;
  credit_limit: number;
  
  // Provenance
  source_record_id: number;
  migration_run_id: string;
  migration_plan_version_id: string;
}

// ============================================================================
// TRANSFORMATION & MAPPING
// ============================================================================

export interface TransformationRule {
  id: string;
  name: string;
  description: string;
  supported_source_types: string[];
  supported_target_types: string[];
  implementation_code?: string; // For reference
  is_chainable: boolean;
}

export interface FieldMapping {
  id: string;
  source_field: string;
  target_field: string;
  source_type: string;
  target_type: string;
  transformations: string[]; // Array of transformation rule IDs
  confidence: number; // 0 to 1
  confidence_level: ConfidenceLevel;
  risk_level: RiskLevel;
  is_required: boolean;
  is_computed: boolean;
  explanation?: string;
}

// ============================================================================
// MIGRATION PLAN
// ============================================================================

export interface MigrationRisk {
  id: string;
  risk_type: string;
  description: string;
  affected_field?: string;
  recommendation?: string;
  severity: RiskLevel;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  suggested_answer?: string;
  answer?: string;
  answered_at?: string;
}

export interface MigrationPlanProposal {
  id: string;
  name: string;
  version: number;
  status: PlanStatus;
  source_table: string;
  target_table: string;
  source_schema: Schema; // NEW: Dynamic schema support
  target_schema: Schema; // NEW: Dynamic schema support
  mappings: FieldMapping[];
  risks: MigrationRisk[];
  clarification_questions: ClarificationQuestion[];
  confidence_summary: number;
  created_at: string;
  approved_at?: string;
  approved_by?: string;
}

// ============================================================================
// DRY RUN & EXECUTION
// ============================================================================

export interface FieldError {
  source_field: string;
  target_field: string;
  value: string | null;
  error_message: string;
  validation_rule: string;
}

export interface TransformedRecord {
  source_record: LegacyCustomer;
  transformed_data: Partial<CustomerMaster> & { [key: string]: any };
  validation_errors: FieldError[];
  is_accepted: boolean;
  error_message?: string;
}

export interface DryRunResult {
  migration_run_id: string;
  source_count: number;
  transformed_count: number;
  accepted_count: number;
  rejected_count: number;
  records: TransformedRecord[];
  started_at: string;
  completed_at: string;
}

export interface ExecutionResult {
  migration_run_id: string;
  inserted_count: number;
  skipped_duplicate_count: number;
  rejected_count: number;
  executed_at: string;
}

export interface ReconciliationResult {
  migration_run_id: string;
  source_count: number;
  accepted_count: number;
  rejected_count: number;
  target_count: number;
  difference: number;
  reconciliation_status: ReconciliationStatus;
  executed_at: string;
}

// ============================================================================
// MIGRATION RUN
// ============================================================================

export interface MigrationRun {
  id: string;
  plan_id: string;
  plan_version_id: string;
  status: RunStatus;
  
  source_record_count: number;
  transformed_count: number;
  accepted_count: number;
  rejected_count: number;
  inserted_count: number;
  skipped_duplicate_count: number;
  
  dry_run_started_at?: string;
  dry_run_completed_at?: string;
  execution_started_at?: string;
  execution_completed_at?: string;
  rollback_started_at?: string;
  rollback_completed_at?: string;
  
  retry_count: number;
  last_retry_at?: string;
  
  created_at: string;
  updated_at: string;
  
  // Related data
  quarantined_records?: TransformedRecord[];
  reconciliation?: ReconciliationResult;
}

// ============================================================================
// AUDIT EVENTS
// ============================================================================

export interface MigrationEvent {
  id: string;
  plan_id: string;
  migration_run_id?: string;
  event_type: EventType;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}
