// Owner: Shared — convenience form validation only (required fields, number formats). Backend re-validates everything authoritatively.
// Location: frontend/src/utils/validation.js
//
// These are UI-speed checks so reps/customers get instant feedback instead of
// a round-trip to find out a field was invalid. The backend is the source of
// truth on every rule here (especially discount ceilings — see riskScore.js
// and section A3) and must re-validate regardless of what passes client-side.

export function isRequired(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

export function isValidNumber(value) {
  if (value === "" || value === null || value === undefined) return false;
  return !Number.isNaN(Number(value));
}

export function isPositiveNumber(value) {
  return isValidNumber(value) && Number(value) > 0;
}

export function isNonNegativeNumber(value) {
  return isValidNumber(value) && Number(value) >= 0;
}

export function isWithinRange(value, min, max) {
  if (!isValidNumber(value)) return false;
  const num = Number(value);
  return num >= min && num <= max;
}

export function isValidEmail(value) {
  if (!value) return false;
  // Simple, permissive pattern — good enough for client-side UX; backend
  // should do the authoritative check (and actually send a verification/magic link).
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPercent(value, { min = 0, max = 100 } = {}) {
  return isWithinRange(value, min, max);
}

/**
 * Validates a quotation line's core fields (quantity, unit price, discount).
 * Returns an object of field -> error message, empty object if valid.
 */
export function validateQuotationLine(line) {
  const errors = {};

  if (!isPositiveNumber(line?.quantity)) {
    errors.quantity = "Quantity must be a positive number";
  }

  if (!isNonNegativeNumber(line?.unit_price)) {
    errors.unit_price = "Unit price must be 0 or greater";
  }

  if (
    line?.discount_percent !== undefined &&
    line?.discount_percent !== null &&
    line?.discount_percent !== "" &&
    !isValidPercent(line.discount_percent, { min: 0, max: 100 })
  ) {
    errors.discount_percent = "Discount must be between 0 and 100";
  }

  return errors;
}

/**
 * Validates the counter-discount fields on the Customer Negotiation form
 * (mirrors the inline checks already in CustomerNegotiation.jsx — centralized
 * here so that component can be simplified to call this instead of duplicating
 * the logic).
 */
export function validateCounterDiscount({ counter_discount, counter_discount_reason }) {
  const errors = {};

  if (counter_discount === "" || counter_discount === undefined || counter_discount === null) {
    return errors; // optional field — no discount requested
  }

  if (!isValidNumber(counter_discount)) {
    errors.counter_discount = "Must be a valid number";
  } else if (Number(counter_discount) > 50) {
    errors.counter_discount = "Discount cannot exceed 50%";
  } else if (Number(counter_discount) < 0) {
    errors.counter_discount = "Discount cannot be negative";
  }

  if (!isRequired(counter_discount_reason)) {
    errors.counter_discount_reason = "Please provide a reason for discount request";
  }

  return errors;
}

/**
 * Validates login credentials before hitting the API.
 */
export function validateLoginForm({ email, password }) {
  const errors = {};
  if (!isValidEmail(email)) errors.email = "Enter a valid email address";
  if (!isRequired(password)) errors.password = "Password is required";
  return errors;
}

/**
 * Generic helper: true if a validation-errors object has no keys.
 */
export function isValid(errors) {
  return Object.keys(errors).length === 0;
}