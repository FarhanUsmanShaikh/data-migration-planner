# Data Migration Planner - API Documentation

## Base URL
```
http://localhost:3000/api/migration
```

## Authentication
Currently no authentication required. In production, add API key validation.

---

## Endpoints

### Plan Management

#### 1. Create Migration Plan
**Endpoint**: `POST /plan`

**Description**: Create a new migration plan with auto-generated schema analysis

**Request**:
```bash
curl -X POST http://localhost:3000/api/migration/plan \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Legacy Customers → Customer Master"
  }'
```

**Response** (200):
```json
{
  "plan": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Legacy Customers → Customer Master",
    "version": 1,
    "status": "DRAFT",
    "source_table": "legacy_customers",
    "target_table": "customers",
    "source_schema": {
      "table_name": "legacy_customers",
      "fields": [
        {
          "name": "legacy_customer_id",
          "type": "number",
          "required": true,
          "nullable": false
        },
        {
          "name": "full_name",
          "type": "string",
          "required": true,
          "nullable": false
        }
      ]
    },
    "target_schema": {
      "table_name": "customers",
      "fields": [
        {
          "name": "id",
          "type": "number",
          "required": true,
          "nullable": false
        },
        {
          "name": "first_name",
          "type": "string",
          "required": true,
          "nullable": false
        }
      ]
    },
    "mappings": [
      {
        "id": "mapping-uuid",
        "source_field": "legacy_customer_id",
        "target_field": "id",
        "source_type": "number",
        "target_type": "number",
        "transformations": ["DIRECT_COPY"],
        "confidence": 0.95,
        "confidence_level": "HIGH",
        "risk_level": "LOW",
        "is_required": true,
        "is_computed": false,
        "explanation": "Direct copy of ID"
      }
    ],
    "risks": [],
    "clarification_questions": [],
    "confidence_summary": 0.92,
    "created_at": "2024-01-15T10:00:00Z"
  },
  "success": true
}
```

---

#### 2. Get Plan
**Endpoint**: `GET /plan/{id}`

**Description**: Retrieve a migration plan by ID

**Request**:
```bash
curl http://localhost:3000/api/migration/plan/550e8400-e29b-41d4-a716-446655440000
```

**Response** (200):
```json
{
  "plan": { /* plan object */ },
  "success": true
}
```

**Response** (404):
```json
{
  "error": "Plan not found",
  "success": false
}
```

---

#### 3. List Plan Versions
**Endpoint**: `GET /plan/versions?planId={id}`

**Description**: List all versions of a migration plan

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| planId | string | Yes | Plan ID |

**Request**:
```bash
curl "http://localhost:3000/api/migration/plan/versions?planId=550e8400-e29b-41d4-a716-446655440000"
```

**Response** (200):
```json
{
  "planId": "550e8400-e29b-41d4-a716-446655440000",
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
  "total_versions": 2,
  "success": true
}
```

---

#### 4. Get Specific Plan Version
**Endpoint**: `GET /plan/version?planId={id}&version={number}`

**Description**: Retrieve a specific version of a plan

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| planId | string | Yes | Plan ID |
| version | number | Yes | Version number |

**Request**:
```bash
curl "http://localhost:3000/api/migration/plan/version?planId=550e8400-e29b-41d4-a716-446655440000&version=2"
```

**Response** (200):
```json
{
  "plan": { /* plan v2 object */ },
  "success": true
}
```

**Response** (404):
```json
{
  "error": "Plan version not found",
  "success": false
}
```

---

#### 5. Edit Plan (Create New Version)
**Endpoint**: `POST /plan/edit`

**Description**: Modify mappings and create a new plan version

**Request Body**:
```json
{
  "planId": "550e8400-e29b-41d4-a716-446655440000",
  "mappingEdits": [
    {
      "mappingId": "mapping-uuid-1",
      "changes": {
        "transformations": ["UPPERCASE", "TRIM"],
        "confidence": 0.85,
        "is_required": false
      }
    },
    {
      "mappingId": "mapping-uuid-2",
      "changes": {
        "confidence": 0.9
      }
    }
  ]
}
```

**Request**:
```bash
curl -X POST http://localhost:3000/api/migration/plan/edit \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "550e8400-e29b-41d4-a716-446655440000",
    "mappingEdits": [
      {
        "mappingId": "mapping-uuid",
        "changes": {
          "confidence": 0.85
        }
      }
    ]
  }'
```

**Response** (200):
```json
{
  "planId": "550e8400-e29b-41d4-a716-446655440000",
  "oldVersion": 1,
  "newVersion": 2,
  "plan": { /* new plan version */ },
  "success": true
}
```

---

### Approval

#### 6. Approve Plan
**Endpoint**: `POST /approve`

**Description**: Approve a plan for execution

**Request Body**:
```json
{
  "planId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Request**:
```bash
curl -X POST http://localhost:3000/api/migration/approve \
  -H "Content-Type: application/json" \
  -d '{"planId": "550e8400-e29b-41d4-a716-446655440000"}'
```

**Response** (200):
```json
{
  "plan": {
    /* plan object with status: APPROVED */
  },
  "run": {
    "id": "run-uuid",
    "plan_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "INITIALIZED"
  },
  "success": true
}
```

---

### Execution

#### 7. Perform Dry Run
**Endpoint**: `POST /dry-run`

**Description**: Execute a dry run without committing data

**Request Body**:
```json
{
  "planId": "550e8400-e29b-41d4-a716-446655440000",
  "runId": "run-uuid"
}
```

**Request**:
```bash
curl -X POST http://localhost:3000/api/migration/dry-run \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "550e8400-e29b-41d4-a716-446655440000",
    "runId": "run-uuid"
  }'
```

**Response** (200):
```json
{
  "dryRunResult": {
    "migration_run_id": "run-uuid",
    "source_count": 30,
    "transformed_count": 30,
    "accepted_count": 28,
    "rejected_count": 2,
    "records": [
      {
        "source_record": { /* legacy customer */ },
        "transformed_data": { /* customer master */ },
        "validation_errors": [],
        "is_accepted": true
      }
    ],
    "started_at": "2024-01-15T10:00:00Z",
    "completed_at": "2024-01-15T10:00:05Z"
  },
  "run": {
    "status": "DRY_RUN_COMPLETED",
    "accepted_count": 28,
    "rejected_count": 2
  },
  "success": true
}
```

---

#### 8. Execute Migration
**Endpoint**: `POST /execute`

**Description**: Execute the migration (requires APPROVED status)

**Request Body**:
```json
{
  "planId": "550e8400-e29b-41d4-a716-446655440000",
  "runId": "run-uuid"
}
```

**Request**:
```bash
curl -X POST http://localhost:3000/api/migration/execute \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "550e8400-e29b-41d4-a716-446655440000",
    "runId": "run-uuid"
  }'
```

**Response** (200):
```json
{
  "executionResult": {
    "migration_run_id": "run-uuid",
    "inserted_count": 28,
    "skipped_duplicate_count": 0,
    "rejected_count": 0,
    "executed_at": "2024-01-15T10:00:10Z"
  },
  "run": {
    "status": "EXECUTION_COMPLETED",
    "inserted_count": 28
  },
  "success": true
}
```

**Response** (403 - Not Approved):
```json
{
  "error": "Plan must be APPROVED for execution. Current status: DRAFT",
  "current_status": "DRAFT",
  "required_status": "APPROVED",
  "success": false
}
```

---

### Quarantine Management

#### 9. Get Quarantined Records
**Endpoint**: `GET /quarantine?runId={id}`

**Description**: Retrieve quarantined records from a migration run

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| runId | string | Yes | Migration run ID |

**Request**:
```bash
curl "http://localhost:3000/api/migration/quarantine?runId=run-uuid"
```

**Response** (200):
```json
{
  "records": [
    {
      "source_record": {
        "legacy_customer_id": 5,
        "full_name": "Jane Smith",
        "email_address": "invalid-email"
      },
      "transformed_data": {
        "email": "invalid-email"
      },
      "validation_errors": [
        {
          "source_field": "email_address",
          "target_field": "email",
          "value": "invalid-email",
          "error_message": "Invalid email format",
          "validation_rule": "EMAIL_VALIDATION"
        }
      ],
      "is_accepted": false,
      "error_message": "Record rejected: 1 validation error(s)"
    }
  ],
  "count": 1,
  "success": true
}
```

---

#### 10. Resolve Quarantine
**Endpoint**: `POST /quarantine/resolve`

**Description**: Correct quarantined records and re-validate

**Request Body**:
```json
{
  "runId": "run-uuid",
  "planId": "plan-uuid",
  "recordCorrections": [
    {
      "sourceRecordId": 5,
      "fieldCorrections": [
        {
          "fieldName": "email",
          "correctedValue": "jane@example.com"
        }
      ]
    }
  ]
}
```

**Request**:
```bash
curl -X POST http://localhost:3000/api/migration/quarantine/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "runId": "run-uuid",
    "planId": "plan-uuid",
    "recordCorrections": [
      {
        "sourceRecordId": 5,
        "fieldCorrections": [
          {
            "fieldName": "email",
            "correctedValue": "jane@example.com"
          }
        ]
      }
    ]
  }'
```

**Response** (200):
```json
{
  "runId": "run-uuid",
  "planId": "plan-uuid",
  "resolved_count": 1,
  "still_quarantined_count": 0,
  "resolvedRecords": [
    {
      "source_record": { /* corrected record */ },
      "transformed_data": { /* updated data */ },
      "validation_errors": [],
      "is_accepted": true
    }
  ],
  "stillQuarantined": [],
  "success": true
}
```

---

### History & Events

#### 11. Get Migration Events
**Endpoint**: `GET /events?planId={id}`

**Description**: Retrieve audit events for a plan

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| planId | string | No | Filter by plan ID |

**Request**:
```bash
curl "http://localhost:3000/api/migration/events?planId=550e8400-e29b-41d4-a716-446655440000"
```

**Response** (200):
```json
{
  "events": [
    {
      "id": "event-uuid",
      "plan_id": "550e8400-e29b-41d4-a716-446655440000",
      "event_type": "PLAN_CREATED",
      "description": "Migration plan created: Legacy Customers → Customer Master v1",
      "metadata": {
        "plan_name": "Legacy Customers → Customer Master",
        "version": 1
      },
      "created_at": "2024-01-15T10:00:00Z"
    },
    {
      "id": "event-uuid-2",
      "plan_id": "550e8400-e29b-41d4-a716-446655440000",
      "event_type": "PLAN_VERSION_CREATED",
      "description": "Migration plan version created: Legacy Customers → Customer Master v2",
      "metadata": {
        "plan_name": "Legacy Customers → Customer Master",
        "version": 2
      },
      "created_at": "2024-01-15T11:00:00Z"
    }
  ],
  "success": true
}
```

---

## Error Responses

### Common Error Codes

#### 400 Bad Request
```json
{
  "error": "Missing required parameter",
  "success": false
}
```

#### 404 Not Found
```json
{
  "error": "Resource not found",
  "success": false
}
```

#### 403 Forbidden
```json
{
  "error": "Operation not allowed",
  "success": false
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "success": false
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## Rate Limiting

Currently no rate limiting. In production, implement:
- 100 requests/minute per IP
- 1000 requests/hour per API key

---

## Versioning

Current API Version: **1.0**

---

## Example Workflow

```bash
# 1. Create plan
PLAN_ID=$(curl -X POST http://localhost:3000/api/migration/plan \
  -H "Content-Type: application/json" \
  -d '{"name": "My Migration"}' | jq -r '.plan.id')

# 2. List versions
curl "http://localhost:3000/api/migration/plan/versions?planId=$PLAN_ID"

# 3. Edit plan
curl -X POST http://localhost:3000/api/migration/plan/edit \
  -H "Content-Type: application/json" \
  -d "{\"planId\": \"$PLAN_ID\", \"mappingEdits\": [...]}"

# 4. Approve plan
curl -X POST http://localhost:3000/api/migration/approve \
  -H "Content-Type: application/json" \
  -d "{\"planId\": \"$PLAN_ID\"}"

# 5. Execute (dry-run)
RUN_ID=$(curl -X POST http://localhost:3000/api/migration/dry-run \
  -H "Content-Type: application/json" \
  -d "{\"planId\": \"$PLAN_ID\", \"runId\": \"run-123\"}" | jq -r '.dryRunResult.migration_run_id')

# 6. Check quarantine
curl "http://localhost:3000/api/migration/quarantine?runId=$RUN_ID"

# 7. Resolve quarantine
curl -X POST http://localhost:3000/api/migration/quarantine/resolve \
  -H "Content-Type: application/json" \
  -d "{\"runId\": \"$RUN_ID\", \"planId\": \"$PLAN_ID\", \"recordCorrections\": [...]}"

# 8. Execute (actual)
curl -X POST http://localhost:3000/api/migration/execute \
  -H "Content-Type: application/json" \
  -d "{\"planId\": \"$PLAN_ID\", \"runId\": \"$RUN_ID\"}"
```

---

## Changelog

### Version 1.0 (Current)
- Initial API release
- Plan versioning support
- Approval enforcement
- Quarantine management
- Full CRUD operations

---

## Support

For API issues or questions, check the [FEATURES.md](./FEATURES.md) for detailed feature documentation.
