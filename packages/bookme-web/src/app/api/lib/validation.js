/**
 * BookMe API Contract Validation Layer
 * Shared validation utilities for all API routes.
 */

const DANGEROUS_CHARS = /[<>{}]/g;
const PROJECT_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

/**
 * Sanitize string input: trim whitespace and remove dangerous characters.
 * Returns empty string for non-string inputs.
 * @param {*} input
 * @returns {string}
 */
export function sanitize(input) {
  if (typeof input !== 'string') return '';
  return input.trim().replace(DANGEROUS_CHARS, '');
}

/**
 * Validate a project ID format.
 * Accepts alphanumeric characters, hyphens, and underscores (1-128 chars).
 * @param {string} id
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateProjectId(id) {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'Project ID is required' };
  }
  const trimmed = id.trim();
  if (!PROJECT_ID_PATTERN.test(trimmed)) {
    return {
      valid: false,
      error: 'Project ID must be 1-128 alphanumeric characters, hyphens, or underscores',
    };
  }
  return { valid: true, error: null };
}

/**
 * Validate a request body against a schema definition.
 *
 * Schema format per field:
 *   { type: 'string'|'number'|'boolean'|'array'|'object',
 *     required: boolean,
 *     default: any,
 *     minLength: number,   // string only
 *     maxLength: number,   // string only
 *     min: number,         // number only
 *     max: number,         // number only
 *     enum: any[]          // allowed values
 *   }
 *
 * @param {object} body - parsed request body
 * @param {object} schema - field definitions
 * @returns {{ valid: boolean, errors: string[], data: object }}
 */
export function validateRequest(body, schema) {
  const errors = [];
  const data = {};

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object'], data: {} };
  }

  for (const [field, rules] of Object.entries(schema)) {
    let value = body[field];

    // Apply default if value is missing / undefined / null
    if (value === undefined || value === null) {
      if (rules.required) {
        errors.push(`Field "${field}" is required`);
        continue;
      }
      data[field] = rules.default !== undefined ? rules.default : undefined;
      continue;
    }

    // Type checking
    const expectedType = rules.type || 'string';
    if (expectedType === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`Field "${field}" must be an array`);
        continue;
      }
    } else if (typeof value !== expectedType) {
      errors.push(`Field "${field}" must be of type ${expectedType}`);
      continue;
    }

    // String-specific validations
    if (expectedType === 'string') {
      value = sanitize(value);

      if (rules.minLength !== undefined && value.length < rules.minLength) {
        errors.push(`Field "${field}" must be at least ${rules.minLength} characters`);
        continue;
      }
      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        errors.push(`Field "${field}" must be at most ${rules.maxLength} characters`);
        continue;
      }
    }

    // Number-specific validations
    if (expectedType === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`Field "${field}" must be at least ${rules.min}`);
        continue;
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`Field "${field}" must be at most ${rules.max}`);
        continue;
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`Field "${field}" must be one of: ${rules.enum.join(', ')}`);
      continue;
    }

    data[field] = value;
  }

  return { valid: errors.length === 0, errors, data };
}

/**
 * Build a standard JSON error response.
 * @param {string} message
 * @param {number} status
 * @param {*} details - optional additional details (e.g. validation errors array)
 * @returns {Response}
 */
export function errorResponse(message, status = 400, details = null) {
  const body = { error: message };
  if (details !== null) {
    body.details = details;
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Build a standard JSON success response.
 * @param {*} data
 * @param {number} status
 * @returns {Response}
 */
export function successResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
