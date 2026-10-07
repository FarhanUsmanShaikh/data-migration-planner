import { MigrationStore } from '@/lib/store/migration-store';
import { MigrationPlanProposal, PlanStatus, Schema, SchemaField, FieldMapping, ConfidenceLevel, RiskLevel } from '@/lib/types/migration';
import { v4 as uuidv4 } from 'uuid';

describe('Plan Versioning System', () => {
  beforeEach(() => {
    MigrationStore.reset();
  });

  const createMockSchema = (tableName: string): Schema => ({
    table_name: tableName,
    fields: [
      { name: 'id', type: 'number', required: true, nullable: false },
      { name: 'name', type: 'string', required: true, nullable: false },
      { name: 'email', type: 'string', required: true, nullable: false },
    ],
  });

  const createMockMapping = (): FieldMapping => ({
    id: uuidv4(),
    source_field: 'legacy_id',
    target_field: 'id',
    source_type: 'number',
    target_type: 'number',
    transformations: ['DIRECT_COPY'],
    confidence: 0.95,
    confidence_level: ConfidenceLevel.HIGH,
    risk_level: RiskLevel.LOW,
    is_required: true,
    is_computed: false,
    explanation: 'Direct copy of ID',
  });

  const createMockPlan = (version: number = 1): MigrationPlanProposal => ({
    id: uuidv4(),
    name: 'Test Migration Plan',
    version,
    status: version === 1 ? PlanStatus.DRAFT : PlanStatus.APPROVED,
    source_table: 'legacy_customers',
    target_table: 'customers',
    source_schema: createMockSchema('legacy_customers'),
    target_schema: createMockSchema('customers'),
    mappings: [createMockMapping()],
    risks: [],
    clarification_questions: [],
    confidence_summary: 0.95,
    created_at: new Date().toISOString(),
  });

  describe('Plan Version Creation', () => {
    it('should save initial plan version', () => {
      const plan = createMockPlan(1);
      MigrationStore.savePlan(plan);

      const retrieved = MigrationStore.getPlan(plan.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.version).toBe(1);
    });

    it('should create multiple versions of same plan', () => {
      const planId = uuidv4();
      const v1 = { ...createMockPlan(1), id: planId };
      const v2 = { ...createMockPlan(2), id: planId, status: PlanStatus.APPROVED };

      MigrationStore.savePlan(v1);
      MigrationStore.savePlanVersion(v2);

      const versions = MigrationStore.listVersions(planId);
      expect(versions.length).toBe(2);
      expect(versions[0].version).toBe(1);
      expect(versions[1].version).toBe(2);
    });

    it('should track version status changes', () => {
      const planId = uuidv4();
      const v1 = { ...createMockPlan(1), id: planId };
      const v2 = { ...createMockPlan(2), id: planId, status: PlanStatus.APPROVED };

      MigrationStore.savePlan(v1);
      MigrationStore.savePlanVersion(v2);

      const versions = MigrationStore.listVersions(planId);
      expect(versions[0].status).toBe(PlanStatus.DRAFT);
      expect(versions[1].status).toBe(PlanStatus.APPROVED);
    });
  });

  describe('Plan Version Retrieval', () => {
    it('should retrieve specific plan version', () => {
      const planId = uuidv4();
      const v1 = { ...createMockPlan(1), id: planId };
      const v2 = { ...createMockPlan(2), id: planId };

      MigrationStore.savePlan(v1);
      MigrationStore.savePlanVersion(v2);

      const retrieved = MigrationStore.getPlanVersion(planId, 2);
      expect(retrieved?.version).toBe(2);
    });

    it('should return undefined for non-existent version', () => {
      const planId = uuidv4();
      const plan = { ...createMockPlan(1), id: planId };
      MigrationStore.savePlan(plan);

      const retrieved = MigrationStore.getPlanVersion(planId, 999);
      expect(retrieved).toBeUndefined();
    });

    it('should get latest version of plan', () => {
      const planId = uuidv4();
      const v1 = { ...createMockPlan(1), id: planId };
      const v2 = { ...createMockPlan(2), id: planId };
      const v3 = { ...createMockPlan(3), id: planId };

      MigrationStore.savePlan(v1);
      MigrationStore.savePlanVersion(v2);
      MigrationStore.savePlanVersion(v3);

      const latest = MigrationStore.getLatestVersion(planId);
      expect(latest?.version).toBe(3);
    });
  });

  describe('Plan Version Listing', () => {
    it('should list all versions in order', () => {
      const planId = uuidv4();
      const v1 = { ...createMockPlan(1), id: planId };
      const v2 = { ...createMockPlan(2), id: planId };
      const v3 = { ...createMockPlan(3), id: planId };

      MigrationStore.savePlan(v1);
      MigrationStore.savePlanVersion(v2);
      MigrationStore.savePlanVersion(v3);

      const versions = MigrationStore.listVersions(planId);
      expect(versions.length).toBe(3);
      expect(versions.map((v) => v.version)).toEqual([1, 2, 3]);
    });

    it('should include creation timestamps', () => {
      const planId = uuidv4();
      const v1 = { ...createMockPlan(1), id: planId };

      MigrationStore.savePlan(v1);

      const versions = MigrationStore.listVersions(planId);
      expect(versions[0].created_at).toBeDefined();
    });

    it('should return empty list for non-existent plan', () => {
      const versions = MigrationStore.listVersions(uuidv4());
      expect(versions).toEqual([]);
    });
  });

  describe('Version Isolation', () => {
    it('should keep version mappings separate', () => {
      const planId = uuidv4();
      const mapping1 = createMockMapping();
      const mapping2 = { ...createMockMapping(), transformations: ['UPPERCASE'] };

      const v1 = { ...createMockPlan(1), id: planId, mappings: [mapping1] };
      const v2 = { ...createMockPlan(2), id: planId, mappings: [mapping2] };

      MigrationStore.savePlan(v1);
      MigrationStore.savePlanVersion(v2);

      const retrieved_v1 = MigrationStore.getPlanVersion(planId, 1);
      const retrieved_v2 = MigrationStore.getPlanVersion(planId, 2);

      expect(retrieved_v1?.mappings[0].transformations).toEqual(['DIRECT_COPY']);
      expect(retrieved_v2?.mappings[0].transformations).toEqual(['UPPERCASE']);
    });
  });
});
