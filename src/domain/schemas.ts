/**
 * Zod Validation Schemas for IRM Core Domain Entities
 *
 * CISO Gap Closure: Input Validation & Sanitization
 * This module provides schema validation for all core IRM entities (Risk, Control, Vendor, Issue)
 * to ensure data integrity, type safety, and protection against injection attacks.
 */

import { z } from 'zod';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sanitizes string input by removing HTML/script tags and potential injection vectors
 * @param input - The string to sanitize
 * @returns Sanitized string safe for storage and display
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove other dangerous HTML tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    // Remove event handlers in attributes
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    // Trim whitespace
    .trim();
}

/**
 * Creates a sanitized string schema
 * @returns Zod schema for sanitized string inputs
 */
function createSanitizedString(minLength = 1, maxLength = 500) {
  return z
    .string()
    .min(minLength, `String must be at least ${minLength} character(s)`)
    .max(maxLength, `String must be at most ${maxLength} character(s)`)
    .transform(sanitizeInput);
}

// ============================================================================
// ID Format Validators
// ============================================================================

const riskIdRegex = /^RSK-\d{3,}$/;
const controlIdRegex = /^CTL-\d{3,}$/;
const vendorIdRegex = /^VND-\d{3,}$/;
const issueIdRegex = /^ISS-\d{3,}$/;

const riskIdSchema = z
  .string()
  .regex(riskIdRegex, 'Risk ID must match format RSK-XXX');

const controlIdSchema = z
  .string()
  .regex(controlIdRegex, 'Control ID must match format CTL-XXX');

const vendorIdSchema = z
  .string()
  .regex(vendorIdRegex, 'Vendor ID must match format VND-XXX');

const issueIdSchema = z
  .string()
  .regex(issueIdRegex, 'Issue ID must match format ISS-XXX');

// ============================================================================
// Risk Schema
// ============================================================================

/**
 * Risk entity schema
 * Represents a risk identified in the organization with assessment scores and mitigation tracking
 */
export const riskSchema = z.object({
  id: riskIdSchema,
  title: createSanitizedString(3, 200),
  category: z.enum([
    'Credit',
    'Market',
    'Operational',
    'Compliance',
    'Cyber',
    'ThirdParty',
    'Strategic',
    'Liquidity',
  ]),
  description: createSanitizedString(10, 2000),
  businessUnit: createSanitizedString(1, 100),
  impact: z.enum([1, 2, 3, 4, 5] as const),
  likelihood: z.enum([1, 2, 3, 4, 5] as const),
  inherentScore: z.number().min(1).max(25),
  residualScore: z.number().min(1).max(25),
  owner: createSanitizedString(1, 100),
  status: z.enum(['Active', 'Mitigated', 'Accepted', 'Retired', 'Under Review']),
  controlIds: z.array(controlIdSchema).default([]),
  kpiIds: z.array(z.string()).default([]),
  lastAssessmentDate: z.coerce.date(),
  nextReviewDate: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Risk = z.infer<typeof riskSchema>;

// ============================================================================
// Control Schema
// ============================================================================

/**
 * Control entity schema
 * Represents a control implemented to mitigate risks within a defined framework
 */
export const controlSchema = z.object({
  id: controlIdSchema,
  title: createSanitizedString(3, 200),
  description: createSanitizedString(10, 2000),
  framework: z.enum(['Basel III', 'SOX', 'GDPR', 'NIST', 'ISO27001']),
  status: z.enum([
    'Implemented',
    'Partially Implemented',
    'Not Implemented',
    'Under Review',
  ]),
  owner: createSanitizedString(1, 100),
  testDate: z.coerce.date(),
  nextReviewDate: z.coerce.date(),
  riskIds: z.array(riskIdSchema).default([]),
  effectiveness: z.enum(['Effective', 'Partially Effective', 'Ineffective']),
  evidence: createSanitizedString(0, 3000),
  controlType: z.enum(['Detective', 'Preventive', 'Corrective']),
  testFrequency: z.enum(['Quarterly', 'Semi-Annual', 'Annual', 'On-Demand']),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Control = z.infer<typeof controlSchema>;

// ============================================================================
// Vendor Schema
// ============================================================================

/**
 * Vendor entity schema
 * Represents a third-party vendor with risk assessment and SLA tracking
 */
export const vendorSchema = z.object({
  id: vendorIdSchema,
  name: createSanitizedString(1, 200),
  tier: z.enum([1, 2, 3] as const),
  category: createSanitizedString(1, 100),
  criticality: z.enum(['Critical', 'High', 'Medium', 'Low']),
  dataSensitivity: z.enum(['High', 'Medium', 'Low']),
  inherentRisk: z.enum([1, 2, 3, 4, 5] as const),
  residualRisk: z.enum([1, 2, 3, 4, 5] as const),
  slaStatus: z.enum(['Green', 'Yellow', 'Red']),
  contractExpiry: z.coerce.date(),
  regulatoryRelevance: z.boolean(),
  services: z.array(createSanitizedString(1, 100)).default([]),
  location: createSanitizedString(1, 100),
  lastAssessmentDate: z.coerce.date(),
  nextReviewDate: z.coerce.date(),
  controlIds: z.array(controlIdSchema).default([]),
  contractValue: z.number().positive().optional(),
  backupVendor: vendorIdSchema.optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Vendor = z.infer<typeof vendorSchema>;

// ============================================================================
// Issue Schema
// ============================================================================

/**
 * Issue entity schema
 * Represents a finding or issue discovered through audits or reviews
 */
export const issueSchema = z.object({
  id: issueIdSchema,
  title: createSanitizedString(3, 200),
  severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
  source: z.enum([
    'Internal Audit',
    'External Audit',
    'Regulatory Exam',
    'Self-Identified',
    'TPRM Review',
  ]),
  status: z.enum([
    'Open',
    'In Progress',
    'Remediation Planned',
    'Closed',
    'Overdue',
  ]),
  owner: createSanitizedString(1, 100),
  dueDate: z.coerce.date(),
  riskIds: z.array(riskIdSchema).default([]),
  controlIds: z.array(controlIdSchema).default([]),
  remediationPlan: createSanitizedString(0, 3000),
  remediationDueDate: z.coerce.date().optional(),
  mraType: z.enum(['MRA', 'MRIA']).nullable().default(null),
  rootCause: createSanitizedString(0, 2000),
  impactStatement: createSanitizedString(0, 2000),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  closedAt: z.coerce.date().optional(),
});

export type Issue = z.infer<typeof issueSchema>;

// ============================================================================
// Entity Validation Helper
// ============================================================================

type EntityType = 'Risk' | 'Control' | 'Vendor' | 'Issue';

interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
}

/**
 * Validates data against the appropriate schema based on entity type
 * @param entityType - The type of entity to validate ('Risk', 'Control', 'Vendor', 'Issue')
 * @param data - The data to validate
 * @returns Validation result with success status, parsed data, or error messages
 */
export function validateEntity<T = unknown>(
  entityType: EntityType,
  data: unknown,
): ValidationResult<T> {
  try {
    let schema: z.ZodSchema;

    switch (entityType) {
      case 'Risk':
        schema = riskSchema;
        break;
      case 'Control':
        schema = controlSchema;
        break;
      case 'Vendor':
        schema = vendorSchema;
        break;
      case 'Issue':
        schema = issueSchema;
        break;
      default:
        return {
          success: false,
          errors: {
            entityType: [`Unknown entity type: ${entityType}`],
          },
        };
    }

    const result = schema.safeParse(data);

    if (result.success) {
      return {
        success: true,
        data: result.data as T,
      };
    }

    // Format Zod errors into a readable structure
    const errors: Record<string, string[]> = {};
    result.error.errors.forEach((err) => {
      const path = err.path.join('.');
      const message = err.message;

      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(message);
    });

    return {
      success: false,
      errors,
    };
  } catch (err) {
    return {
      success: false,
      errors: {
        validation: [
          err instanceof Error ? err.message : 'Unknown validation error',
        ],
      },
    };
  }
}

// ============================================================================
// Batch Validation Helper
// ============================================================================

interface BatchValidationResult<T> {
  valid: T[];
  invalid: Array<{
    index: number;
    data: unknown;
    errors: Record<string, string[]>;
  }>;
}

/**
 * Validates an array of entities in batch
 * @param entityType - The type of entity to validate
 * @param dataArray - Array of data to validate
 * @returns Batch validation result with valid and invalid items
 */
export function validateBatch<T = unknown>(
  entityType: EntityType,
  dataArray: unknown[],
): BatchValidationResult<T> {
  const valid: T[] = [];
  const invalid: Array<{
    index: number;
    data: unknown;
    errors: Record<string, string[]>;
  }> = [];

  dataArray.forEach((data, index) => {
    const result = validateEntity<T>(entityType, data);

    if (result.success && result.data) {
      valid.push(result.data);
    } else {
      invalid.push({
        index,
        data,
        errors: result.errors || {},
      });
    }
  });

  return { valid, invalid };
}

// ============================================================================
// Schema Exports Summary
// ============================================================================

export default {
  riskSchema,
  controlSchema,
  vendorSchema,
  issueSchema,
  sanitizeInput,
  validateEntity,
  validateBatch,
};
