# Data Migration Planner — Assignment Submission

A robust, enterprise-grade application built with Next.js, React, TypeScript, and Tailwind CSS to plan, validate, version, and safely execute data migrations between a source dataset and target schema.

---

## 🎯 Assignment Scope & Limits

- **Scope**: Single bounded dataset migration (Source: `legacy_customers` → Target: `customers`).
- **Sample Limits**: Bounded sample size (up to 1,000 records).
- **Transformations**: Supported deterministic rules (`UPPERCASE`, `LOWERCASE`, `TRIM`, `DATE_FORMAT`, `CAST_NUMBER`, `REGEX_REPLACE`, `MAP_LOOKUP`, `DEFAULT_VALUE`, `SPLIT_NAME`).
- **Target Database**: Staging mock store with zero external cloud or production database dependencies.

---

## ✨ Key Implemented Features

### 1. Planning & Analysis
- **Dynamic Schema Inspection**: Introspects source and target schemas, field types, and constraints.
- **Automated Mapping & Confidence Scoring**: Proposes field-level mappings with confidence scores (0.0 to 1.0).
- **Risk Identification**: Detects data truncation, precision loss, and unmapped required fields.
- **Clarification Question Generator**: Auto-generates structured questions for ambiguous or unmapped required fields.

### 2. Governance & Workflow Control
- **User Approval Gate**: Strict status lifecycle (`DRAFT` → `APPROVED` → `EXECUTED`). Returns HTTP 403 if execution is attempted without approval.
- **Plan Versioning**: Immutable version history (v1 → v2 → v3) with edition tracking, diffing, and retrieval endpoints.

### 3. Execution & Quarantine
- **Deterministic Dry Run**: Non-destructive preview execution in-memory without mutating the target database.
- **Field-Level Error Evidence & Quarantine**: Quarantines rejected records with field-level failure evidence (`field_name`, `invalid_value`, `error_reason`) and provides an interactive resolution UI.
- **Safe Execution & Deduplication**: Idempotent migration engine prevents duplicate insertions when a migration is retried.

### 4. Verification & Audit
- **Reconciliation Engine**: Compares source vs. target record totals (`source_count`, `transformed_count`, `accepted_count`, `rejected_count`).
- **Rollback Support**: Reverts target database changes by execution run ID.
- **Event Audit Timeline**: Log of all system events (`PLAN_CREATED`, `PLAN_APPROVED`, `DRY_RUN_COMPLETED`, `MIGRATION_EXECUTED`, `QUARANTINE_RESOLVED`, `MIGRATION_ROLLED_BACK`).

---

## 🧪 Empirical Test & Verification Results

- **Automated Unit Tests**: 67 / 67 Tests Passing (`PASS __tests__/*.test.ts`)
- **TypeScript Check**: `0 Errors` (Strict Mode)
- **Production Build**: `✓ Next.js Turbopack build succeeded` (16 operational routes)

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Run Test Suite
```bash
npx jest
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```
