import { TransformationRule } from "@/lib/types/migration";

export const TRANSFORMATION_REGISTRY: Record<string, TransformationRule> = {
  DIRECT_COPY: {
    id: "DIRECT_COPY",
    name: "Direct Copy",
    description: "Copy value as-is from source to target",
    supported_source_types: ["string", "number", "boolean", "date"],
    supported_target_types: ["string", "number", "boolean", "date"],
    is_chainable: false,
  },
  
  TRIM: {
    id: "TRIM",
    name: "Trim Whitespace",
    description: "Remove leading and trailing whitespace",
    supported_source_types: ["string"],
    supported_target_types: ["string"],
    is_chainable: true,
  },
  
  UPPERCASE: {
    id: "UPPERCASE",
    name: "Uppercase",
    description: "Convert string to uppercase",
    supported_source_types: ["string"],
    supported_target_types: ["string"],
    is_chainable: true,
  },
  
  LOWERCASE: {
    id: "LOWERCASE",
    name: "Lowercase",
    description: "Convert string to lowercase",
    supported_source_types: ["string"],
    supported_target_types: ["string"],
    is_chainable: true,
  },
  
  SPLIT_FULL_NAME: {
    id: "SPLIT_FULL_NAME",
    name: "Split Full Name",
    description: "Split full name into first_name and last_name",
    supported_source_types: ["string"],
    supported_target_types: ["string"],
    is_chainable: false,
  },
  
  STATUS_TO_BOOLEAN: {
    id: "STATUS_TO_BOOLEAN",
    name: "Status to Boolean",
    description: "Convert customer_status to active boolean (active/verified → true, others → false)",
    supported_source_types: ["string"],
    supported_target_types: ["boolean"],
    is_chainable: false,
  },
  
  STRING_TO_BOOLEAN: {
    id: "STRING_TO_BOOLEAN",
    name: "String to Boolean",
    description: "Convert string to boolean (yes/true/1/Y/T → true, no/false/0/N/F → false)",
    supported_source_types: ["string"],
    supported_target_types: ["boolean"],
    is_chainable: false,
  },
  
  DATE_STRING_TO_ISO_DATE: {
    id: "DATE_STRING_TO_ISO_DATE",
    name: "Date String to ISO Date",
    description: "Parse date string and convert to ISO 8601 format",
    supported_source_types: ["string"],
    supported_target_types: ["date"],
    is_chainable: false,
  },
  
  STRING_TO_DECIMAL: {
    id: "STRING_TO_DECIMAL",
    name: "String to Decimal",
    description: "Convert string to decimal number",
    supported_source_types: ["string", "number"],
    supported_target_types: ["decimal", "number"],
    is_chainable: false,
  },
  
  DEFAULT_VALUE: {
    id: "DEFAULT_VALUE",
    name: "Default Value",
    description: "Use a default value if source is empty or null",
    supported_source_types: ["string", "number", "boolean"],
    supported_target_types: ["string", "number", "boolean"],
    is_chainable: false,
  },
  
  NULL_IF_EMPTY: {
    id: "NULL_IF_EMPTY",
    name: "Null If Empty",
    description: "Convert empty string to null",
    supported_source_types: ["string"],
    supported_target_types: ["string"],
    is_chainable: true,
  },
  
  ENUM_MAP: {
    id: "ENUM_MAP",
    name: "Enum Map",
    description: "Map source values to target enum values",
    supported_source_types: ["string", "number"],
    supported_target_types: ["string", "number", "boolean"],
    is_chainable: false,
  },
};

export function getTransformationRule(ruleId: string): TransformationRule | undefined {
  return TRANSFORMATION_REGISTRY[ruleId];
}

export function listTransformationRules(): TransformationRule[] {
  return Object.values(TRANSFORMATION_REGISTRY);
}
