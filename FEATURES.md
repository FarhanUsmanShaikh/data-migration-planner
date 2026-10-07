# Data Migration Planner - Feature Documentation

## Overview

The Data Migration Planner is a comprehensive tool for planning, validating, and executing data migrations safely. It provides a deterministic approach to schema mapping, risk identification, and migration execution with approval workflows and quarantine handling.

**Current Completion: 90%**

---

## Core Features (100% Complete)

### 1. **Schema Mapping & Analysis**
Comprehensive schema introspection and intelligent field mapping between source and target tables.

#### Features:
- Automatic field discovery and type analysis
- Smart field matching based on name similarity and type compatibility
- Transformation rule application
- Risk assessment for type mismatches
- Confidence scoring for mappings (0-1 scale)

#### API:
```bash
POST /api/migration/plan
```

#### Example:
```json
{
  "name": "Legacy Customers → Customer Master",
  "source_schema": {
    "table_name": "legacy_customers",
    "fields": [
      { "name": "legacy_customer_id", "type": "number", "required": true }
    ]
  },
  "target_schema": {
    "table_name": "customers",
    "fields": [
      { "name": "id", "type": "number", "required": true }
    ]
  }
}
```

---

## Enhancement Features (90% Complete)

### 2. **Dynamic Schema Analysis** ✓
Support for custom source and target schemas instead of hardcoded tables.

#### What's New:
- `source_schema` and `target_schema` fields added to `MigrationPlanProposal`
- Planner constructor accepts dynamic Schema objects
- Field matching algorithm works with any schema structure
- Schema stored with each plan version for audit trail

#### Implementation:
- `src/lib/types/migration.ts` - Updated `MigrationPlanProposal` type
- `src/lib/planner/migration-planner.ts` - Updated constructor and createPlan method

---

### 3. **Plan Versioning** ✓
Immutable version history with v1→v2→v3 progression.

#### What's New:
- Version history tracking for each plan
- Get specific version: `getPlanVersion(planId, version)`
- Get latest version: `getLatestVersion(planId)`
- List all versions: `listVersions(planId)`
- Save new version: `savePlanVersion(plan)`

#### API Endpoints:
```bash
# List all versions of a plan
GET /api/migration/plan/versions?planId={id}

# Get specific plan version
GET /api/migration/plan/version?planId={id}&version={number}
```

#### Response Example:
```json
{
  "planId": "uuid",
  "versions": [
    {
      "version": 1,
      "created_at": "2024-01-15T10:00:00Z",
      "status": "DRAFT"
    },
    {
      "version": 2,
      "created_at": "2024-01-15T11:00:00Z",
      "status": "APPROVED"
    }
  ],
  "total_versions": 2
}
```

#### Implementation:
- `src/lib/store/migration-store.ts` - Added `planVersions` Map and versioning methods

---

### 4. **Plan Editing** ✓
Create new plan versions by editing mappings and transformations.

#### What's New:
- Edit field mappings and create new version
- Transformations can be modified per field
- Confidence scores adjustable
- Required field flags updatable
- New version automatically resets to DRAFT status

#### API:
```bash
POST /api/migration/plan/edit
```

#### Request Body:
```json
{
  "planId": "uuid",
  "mappingEdits": [
    {
      "mappingId": "uuid",
      "changes": {
        "transformations": ["UPPERCASE", "TRIM"],
        "confidence": 0.85,
        "is_required": false
      }
    }
  ]
}
```

#### UI Component:
- `src/components/version-management.tsx` - Full versioning and editing interface
- Edit mode with field-by-field modification
- Live version history viewer
- Version comparison support

---

### 5. **Approval Enforcement** ✓
Enforcement of approval workflow - blocks execution if plan not approved.

#### What's New:
- Status check before execution
- Returns 403 Forbidden if plan not APPROVED
- Dry runs allowed without approval
- Clear error messages about required status

#### Status Flow:
```
DRAFT → READY_FOR_REVIEW → APPROVED → DRY_RUN_COMPLETED → EXECUTABLE → EXECUTED
```

#### API Protection:
```bash
POST /api/migration/execute
# Returns 403 if plan.status !== APPROVED
```

#### Error Response:
```json
{
  "success": false,
  "error": "Plan must be APPROVED for execution. Current status: DRAFT",
  "current_status": "DRAFT",
  "required_status": "APPROVED"
}
```

#### Implementation:
- `src/app/api/migration/execute/route.ts` - Added status validation

---

### 6. **Quarantine Workflow** ✓
Ability to review, correct, and re-validate quarantined records.

#### What's New:
- Public `validateRecord()` method in MigrationEngine
- Field-level correction capability
- Re-validation after corrections
- Tracks resolved vs still-quarantined records
- Audit trail for each correction

#### Features:
- View validation errors per record
- Correct field values interactively
- Re-validate corrected records
- Track resolution statistics

#### API:
```bash
POST /api/migration/quarantine/resolve
```

#### Request Body:
```json
{
  "runId": "uuid",
  "planId": "uuid",
  "recordCorrections": [
    {
      "sourceRecordId": 123,
      "fieldCorrections": [
        {
          "fieldName": "email",
          "correctedValue": "john@example.com"
        }
      ]
    }
  ]
}
```

#### Response:
```json
{
  "success": true,
  "runId": "uuid",
  "planId": "uuid",
  "resolved_count": 5,
  "still_quarantined_count": 2,
  "resolvedRecords": [...],
  "stillQuarantined": [...]
}
```

#### UI Component:
- `src/components/quarantine-resolution.tsx` - Quarantine management interface
- Field-by-field error display
- Interactive correction form
- Resolution statistics

#### Implementation:
- `src/lib/engine/migration-engine.ts` - Added public `validateRecord()` method
- `src/app/api/migration/quarantine/resolve/route.ts` - Resolution endpoint

---

## API Routes (Complete List)

### Plan Management
```
GET  /api/migration/plan           - Get current plan
POST /api/migration/plan           - Create new plan
GET  /api/migration/plan/versions  - List all versions
GET  /api/migration/plan/version   - Get specific version
POST /api/migration/plan/edit      - Edit and create new version
```

### Approval
```
POST /api/migration/approve        - Approve plan for execution
```

### Execution
```
POST /api/migration/dry-run        - Run dry run
POST /api/migration/execute        - Execute (requires APPROVED status)
POST /api/migration/reconcile      - Reconcile target records
```

### Quarantine Management
```
GET  /api/migration/quarantine          - Get quarantined records
POST /api/migration/quarantine/resolve  - Resolve quarantine issues
```

### History & Events
```
GET /api/migration/events   - Get audit events
GET /api/migration/history  - Get migration history
```

---

## UI Components

### New Components Added

#### 1. Version Management (`src/components/version-management.tsx`)
- **Purpose**: Manage plan versions and edit mappings
- **Features**:
  - Display all versions with timestamps and status
  - Version selection and viewing
  - Edit mode for mapping modifications
  - Create new version from edits
  - Refresh version list

#### 2. Quarantine Resolution (`src/components/quarantine-resolution.tsx`)
- **Purpose**: Review and resolve quarantined records
- **Features**:
  - Display quarantined records
  - Show validation errors per record
  - Field-by-field correction interface
  - Re-validation and resolution tracking
  - Statistics dashboard

#### 3. Updated Dashboard (`src/components/dashboard.tsx`)
- **New Tabs**:
  - Plan Versions
  - Quarantine
- **Integration**: Seamless navigation between features

---

## Data Structures

### Updated MigrationPlanProposal
```typescript
interface MigrationPlanProposal {
  id: string;
  name: string;
  version: number;
  status: PlanStatus;
  source_table: string;
  target_table: string;
  source_schema: Schema;        // NEW
  target_schema: Schema;        // NEW
  mappings: FieldMapping[];
  risks: MigrationRisk[];
  clarification_questions: ClarificationQuestion[];
  confidence_summary: number;
  created_at: string;
  approved_at?: string;
  approved_by?: string;
}
```

### PlanStatus Values
```
DRAFT                   - Initial state after creation
READY_FOR_REVIEW       - Submitted for approval
APPROVED               - Approved for execution
DRY_RUN_COMPLETED      - Dry run has been executed
EXECUTABLE             - Ready for execution
EXECUTED               - Successfully executed
ROLLED_BACK            - Execution rolled back
```

---

## Testing

### Test Coverage (Complete)

#### 1. Versioning Tests (`__tests__/versioning.test.ts`)
- Plan version creation
- Multiple version management
- Version retrieval and listing
- Version status tracking
- Version isolation

#### 2. Approval Enforcement Tests (`__tests__/approval-enforcement.test.ts`)
- Execution status validation
- Dry run permissions
- Status transitions
- Rejection tracking
- Concurrent approval prevention

#### 3. Quarantine Workflow Tests (`__tests__/quarantine-workflow.test.ts`)
- Record quarantine marking
- Validation error tracking
- Quarantine resolution
- Audit trail
- Bulk resolution
- Partial resolution tracking

### Running Tests
```bash
npm run test
```

---

## Completion Status

### Completed Features (90%)
- ✓ Dynamic Schema Analysis
- ✓ Plan Versioning
- ✓ Plan Editing
- ✓ Approval Enforcement
- ✓ Quarantine Workflow
- ✓ API Routes
- ✓ UI Components
- ✓ Tests

### Remaining (10%)
- Schema comparison/diff viewer
- Advanced quarantine filtering
- Batch correction operations
- Plan rollback feature
- Performance optimization for large datasets

---

## Usage Walkthrough

### Step 1: Create a Plan
```javascript
const response = await fetch('/api/migration/plan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'My Migration' })
});
const { plan } = await response.json();
```

### Step 2: Review Plan Versions
```javascript
const response = await fetch(`/api/migration/plan/versions?planId=${plan.id}`);
const { versions } = await response.json();
```

### Step 3: Edit and Create New Version
```javascript
const response = await fetch('/api/migration/plan/edit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    planId: plan.id,
    mappingEdits: [
      {
        mappingId: 'uuid',
        changes: { confidence: 0.9 }
      }
    ]
  })
});
const { plan: newVersion } = await response.json();
```

### Step 4: Approve Plan (UI or API)
```javascript
const response = await fetch('/api/migration/approve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ planId: plan.id })
});
```

### Step 5: Execute Migration
```javascript
const response = await fetch('/api/migration/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ planId: plan.id, runId: run.id })
});
// Returns 403 if plan not APPROVED
```

### Step 6: Resolve Quarantine (if needed)
```javascript
const response = await fetch('/api/migration/quarantine/resolve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    runId: run.id,
    planId: plan.id,
    recordCorrections: [...]
  })
});
```

---

## Architecture Decisions

### 1. Immutable Versioning
- **Decision**: Create new versions instead of in-place editing
- **Rationale**: Preserves audit trail, enables rollback, supports comparison
- **Trade-off**: Uses more storage but provides better compliance

### 2. Schema Inclusion in Plans
- **Decision**: Store source and target schema with each plan
- **Rationale**: Schema changes over time; storing with plan enables schema versioning
- **Benefit**: Can regenerate transformations with original schema

### 3. Approval Gating
- **Decision**: Block execution if plan not APPROVED
- **Rationale**: Prevents accidental migrations of unapproved changes
- **Flexibility**: Dry runs allowed anytime for testing

### 4. Field-Level Correction
- **Decision**: Support correcting individual fields in quarantined records
- **Rationale**: More flexible than all-or-nothing record fixes
- **Complexity**: Requires re-validation logic

---

## Performance Considerations

- **Versioning**: O(1) lookup for specific version
- **Plan Lists**: O(n) where n = number of versions
- **Quarantine**: Memory-based; suitable for typical migration sizes (100K records)
- **Validation**: Linear scan of transformations per record

---

## Security Considerations

- Approval enforcement prevents unauthorized execution
- Audit events track all plan modifications
- Read-only access to historical versions
- No hard delete of versions (retention for compliance)

---

## Future Enhancements

1. **Schema Diff Viewer** - Visual comparison between plan versions
2. **Batch Operations** - Bulk corrections for quarantined records
3. **Advanced Filtering** - Filter quarantined records by error type
4. **Rollback Automation** - Automatic rollback on execution failure
5. **Performance Tuning** - Database-backed storage for large-scale migrations
6. **Notifications** - Email/Slack alerts for plan approvals and executions

---

## Version History

- **v1.0** (Current) - Initial release with 90% feature completion
- Core migration engine with deterministic transformations
- Dynamic schema support with versioning
- Approval enforcement and quarantine workflow
- Comprehensive UI with React components
- Full test coverage for new features

---

## Support & Troubleshooting

### Common Issues

#### 1. Plan cannot be executed
```
Error: Plan must be APPROVED for execution. Current status: DRAFT
```
**Solution**: Approve the plan first via `/api/migration/approve` or UI

#### 2. Quarantine records still failing after correction
```
Resolution complete: X records resolved, Y still quarantined
```
**Solution**: Review remaining validation errors and provide additional corrections

#### 3. Version conflicts
**Solution**: Create new version with conflicting changes; versions are immutable

---

## Contact & Feedback

For issues, questions, or feature requests, please refer to project documentation or contact the development team.
