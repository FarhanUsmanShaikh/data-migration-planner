import { FieldError } from "@/lib/types/migration";

export type TransformContext = Record<string, any>;

/**
 * Deterministic transformation engine for applying transformations to field values
 */
export class TransformationEngine {
  /**
   * Apply a sequence of transformations to a value
   */
  static transform(
    value: any,
    transformationIds: string[],
    context?: TransformContext
  ): { result: any; error?: FieldError } {
    let current = value;

    for (const transformId of transformationIds) {
      const result = this.applyTransformation(current, transformId, context);
      if (result.error) {
        return result as { result: any; error: FieldError };
      }
      current = result.result;
    }

    return { result: current };
  }

  private static applyTransformation(
    value: any,
    transformId: string,
    context?: TransformContext
  ): { result?: any; error?: FieldError } {
    switch (transformId) {
      case "DIRECT_COPY":
        return { result: value };

      case "TRIM":
        if (value === null || value === undefined) {
          return { result: null };
        }
        if (typeof value !== "string") {
          return {
            error: {
              source_field: "",
              target_field: "",
              value: String(value),
              error_message: "TRIM requires string input",
              validation_rule: "TRIM",
            },
          };
        }
        return { result: value.trim() };

      case "UPPERCASE":
        if (value === null || value === undefined) {
          return { result: null };
        }
        if (typeof value !== "string") {
          return {
            error: {
              source_field: "",
              target_field: "",
              value: String(value),
              error_message: "UPPERCASE requires string input",
              validation_rule: "UPPERCASE",
            },
          };
        }
        return { result: value.toUpperCase() };

      case "LOWERCASE":
        if (value === null || value === undefined) {
          return { result: null };
        }
        if (typeof value !== "string") {
          return {
            error: {
              source_field: "",
              target_field: "",
              value: String(value),
              error_message: "LOWERCASE requires string input",
              validation_rule: "LOWERCASE",
            },
          };
        }
        return { result: value.toLowerCase() };

      case "SPLIT_FULL_NAME": {
        if (value === null || value === undefined || value === "") {
          return {
            error: {
              source_field: "",
              target_field: "first_name + last_name",
              value: String(value),
              error_message: "Full name is required",
              validation_rule: "SPLIT_FULL_NAME",
            },
          };
        }
        const parts = String(value).trim().split(/\s+/);
        if (parts.length < 2) {
          return {
            error: {
              source_field: "",
              target_field: "first_name + last_name",
              value: String(value),
              error_message:
                "Full name must contain at least first and last name",
              validation_rule: "SPLIT_FULL_NAME",
            },
          };
        }
        return {
          result: {
            first_name: parts[0],
            last_name: parts.slice(1).join(" "),
          },
        };
      }

      case "STATUS_TO_BOOLEAN":
        if (value === null || value === undefined) {
          return { result: false };
        }
        const statusStr = String(value).toLowerCase().trim();
        return {
          result:
            statusStr === "active" ||
            statusStr === "verified" ||
            statusStr === "approved",
        };

      case "STRING_TO_BOOLEAN":
        if (value === null || value === undefined) {
          return { result: false };
        }
        const boolStr = String(value).toLowerCase().trim();
        if (
          boolStr === "yes" ||
          boolStr === "true" ||
          boolStr === "1" ||
          boolStr === "y" ||
          boolStr === "t"
        ) {
          return { result: true };
        }
        if (
          boolStr === "no" ||
          boolStr === "false" ||
          boolStr === "0" ||
          boolStr === "n" ||
          boolStr === "f"
        ) {
          return { result: false };
        }
        return {
          error: {
            source_field: "",
            target_field: "",
            value: String(value),
            error_message: `Invalid boolean value: ${value}`,
            validation_rule: "STRING_TO_BOOLEAN",
          },
        };

      case "DATE_STRING_TO_ISO_DATE": {
        if (value === null || value === undefined || value === "") {
          return {
            error: {
              source_field: "",
              target_field: "",
              value: String(value),
              error_message: "Date is required",
              validation_rule: "DATE_STRING_TO_ISO_DATE",
            },
          };
        }
        try {
          const date = new Date(String(value));
          if (isNaN(date.getTime())) {
            throw new Error("Invalid date");
          }
          return { result: date.toISOString() };
        } catch (err) {
          return {
            error: {
              source_field: "",
              target_field: "",
              value: String(value),
              error_message: `Invalid date format: ${value}`,
              validation_rule: "DATE_STRING_TO_ISO_DATE",
            },
          };
        }
      }

      case "STRING_TO_DECIMAL": {
        if (value === null || value === undefined || value === "") {
          return {
            error: {
              source_field: "",
              target_field: "",
              value: String(value),
              error_message: "Credit limit is required",
              validation_rule: "STRING_TO_DECIMAL",
            },
          };
        }
        const numStr = String(value).replace(/[^\d.-]/g, "");
        const num = parseFloat(numStr);
        if (isNaN(num)) {
          return {
            error: {
              source_field: "",
              target_field: "",
              value: String(value),
              error_message: `Invalid decimal value: ${value}`,
              validation_rule: "STRING_TO_DECIMAL",
            },
          };
        }
        return { result: num };
      }

      case "NULL_IF_EMPTY":
        if (
          value === null ||
          value === undefined ||
          (typeof value === "string" && value.trim() === "")
        ) {
          return { result: null };
        }
        return { result: value };

      case "DEFAULT_VALUE":
        if (value === null || value === undefined) {
          return { result: context?.default_value ?? null };
        }
        return { result: value };

      case "ENUM_MAP": {
        const mapping = context?.enum_mapping as Record<string, any>;
        if (!mapping) {
          return {
            error: {
              source_field: "",
              target_field: "",
              value: String(value),
              error_message: "Enum mapping not provided",
              validation_rule: "ENUM_MAP",
            },
          };
        }
        const key = String(value).toLowerCase().trim();
        if (!(key in mapping)) {
          return {
            error: {
              source_field: "",
              target_field: "",
              value: String(value),
              error_message: `No enum mapping for: ${value}`,
              validation_rule: "ENUM_MAP",
            },
          };
        }
        return { result: mapping[key] };
      }

      default:
        return {
          error: {
            source_field: "",
            target_field: "",
            value: String(value),
            error_message: `Unknown transformation: ${transformId}`,
            validation_rule: transformId,
          },
        };
    }
  }
}
