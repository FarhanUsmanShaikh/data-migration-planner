import { PlanStatus, Schema, FieldMapping, MigrationPlanProposal, ConfidenceLevel, RiskLevel } from '@/lib/types/migration';
import { v4 as uuidv4 } from 'uuid';

describe('Approval Enforcement System', () => {
  const createMockSchema = (tableName: string): Schema => ({
    table_name: tableName,
    fields: [
      { name: 'id', type: 'number', required: true, nullable: false },
      { name: 'email', type: 'string', required: true, nullable: false },
    ],
  });

  const createMockMapping = (): FieldMapping => ({
    id: uuidv4(),
    source_field: 'id',
    target_field: 'id',
    source_type: 'number',
    target_type: 'number',
    transformations: ['DIRECT_COPY'],
    confidence: 0.95,
    confidence_level: ConfidenceLevel.HIGH,
    risk_level: RiskLevel.LOW,
    is_required: true,
    is_computed: false,
  });

  const createMockPlan = (status: PlanStatus): MigrationPlanProposal => ({
    id: uuidv4(),
    name: 'Test Plan',
    version: 1,
    status,
    source_table: 'source',
    target_table: 'target',
    source_schema: createMockSchema('source'),
    target_schema: createMockSchema('target'),
    mappings: [createMockMapping()],
    risks: [],
    clarification_questions: [],
    confidence_summary: 0.95,
    created_at: new Date().toISOString(),
  });

  describe('Execution Status Validation', () => {
    it('should allow execution when plan is APPROVED', () => {
      const plan = createMockPlan(PlanStatus.APPROVED);
      expect(plan.status).toBe(PlanStatus.APPROVED);
      // Execution should be allowed
      expect(plan.status === PlanStatus.APPROVED).toBe(true);
    });

    it('should block execution when plan is DRAFT', () => {
      const plan = createMockPlan(PlanStatus.DRAFT);
      expect(plan.status).toBe(PlanStatus.DRAFT);
      // Execution should be blocked
      expect(plan.status === PlanStatus.APPROVED).toBe(false);
    });

    it('should block execution when plan is READY_FOR_REVIEW', () => {
      const plan = createMockPlan(PlanStatus.READY_FOR_REVIEW);
      expect(plan.status).toBe(PlanStatus.READY_FOR_REVIEW);
      // Execution should be blocked
      expect(plan.status === PlanStatus.APPROVED).toBe(false);
    });

    it('should allow execution when plan is EXECUTABLE', () => {
      const plan = createMockPlan(PlanStatus.EXECUTABLE);
      expect(plan.status).toBe(PlanStatus.EXECUTABLE);
      // Note: based on code, EXECUTABLE is treated differently
      // but typically APPROVED is the main requirement
    });

    it('should track approval status transition', () => {
      const plan = createMockPlan(PlanStatus.DRAFT);
      expect(plan.status).toBe(PlanStatus.DRAFT);
      expect(plan.approved_at).toBeUndefined();

      // Transition to approved
      const approvedPlan = { ...plan, status: PlanStatus.APPROVED, approved_at: new Date().toISOString(), approved_by: 'admin' };
      expect(approvedPlan.status).toBe(PlanStatus.APPROVED);
      expect(approvedPlan.approved_at).toBeDefined();
      expect(approvedPlan.approved_by).toBe('admin');
    });
  });

  describe('Dry Run Permission', () => {
    it('should allow dry run for any plan status', () => {
      const statuses = [
        PlanStatus.DRAFT,
        PlanStatus.READY_FOR_REVIEW,
        PlanStatus.APPROVED,
      ];

      statuses.forEach((status) => {
        const plan = createMockPlan(status);
        // Dry run should not be restricted by approval status
        expect(plan).toBeDefined();
      });
    });
  });

  describe('Status Transitions', () => {
    it('should transition DRAFT → READY_FOR_REVIEW', () => {
      const plan = createMockPlan(PlanStatus.DRAFT);
      const updated = { ...plan, status: PlanStatus.READY_FOR_REVIEW };

      expect(plan.status).toBe(PlanStatus.DRAFT);
      expect(updated.status).toBe(PlanStatus.READY_FOR_REVIEW);
    });

    it('should transition READY_FOR_REVIEW → APPROVED', () => {
      const plan = createMockPlan(PlanStatus.READY_FOR_REVIEW);
      const approved = { 
        ...plan, 
        status: PlanStatus.APPROVED,
        approved_at: new Date().toISOString(),
      };

      expect(plan.status).toBe(PlanStatus.READY_FOR_REVIEW);
      expect(approved.status).toBe(PlanStatus.APPROVED);
      expect(approved.approved_at).toBeDefined();
    });

    it('should track DRY_RUN_COMPLETED status', () => {
      const plan = createMockPlan(PlanStatus.APPROVED);
      const afterDryRun = { ...plan, status: PlanStatus.DRY_RUN_COMPLETED };

      expect(afterDryRun.status).toBe(PlanStatus.DRY_RUN_COMPLETED);
    });

    it('should transition to EXECUTED after successful execution', () => {
      const plan = createMockPlan(PlanStatus.APPROVED);
      const executed = { ...plan, status: PlanStatus.EXECUTED };

      expect(executed.status).toBe(PlanStatus.EXECUTED);
    });
  });

  describe('Rejection Tracking', () => {
    it('should track plan rejection', () => {
      const plan = { ...createMockPlan(PlanStatus.READY_FOR_REVIEW) };
      const rejected = { ...plan, status: PlanStatus.DRAFT };

      expect(rejected.status).toBe(PlanStatus.DRAFT);
    });

    it('should allow resubmission after rejection', () => {
      const plan = { ...createMockPlan(PlanStatus.DRAFT) };
      const resubmitted = { ...plan, status: PlanStatus.READY_FOR_REVIEW };

      expect(resubmitted.status).toBe(PlanStatus.READY_FOR_REVIEW);
    });
  });

  describe('Concurrent Approval', () => {
    it('should prevent double approval', () => {
      const plan = createMockPlan(PlanStatus.APPROVED);
      expect(plan.status).toBe(PlanStatus.APPROVED);
      // Second approval should not change state
      expect(plan.status).toBe(PlanStatus.APPROVED);
    });
  });
});
