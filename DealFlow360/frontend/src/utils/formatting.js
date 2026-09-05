// Owner: Shared — currency/date display formatting helpers
// Location: frontend/src/utils/formatting.js
//
// Every component so far (SubscriptionBilling, CustomerNegotiation, WarehouseSplit)
// has been re-declaring its own local formatCurrency/formatDate. Centralizing here
// so formatting stays consistent app-wide and locale/currency changes are one edit,
// not five.

/**
 * Formats a number as USD currency, e.g. 1200 -> "$1,200.00"
 * @param {number} value
 * @param {object} options
 * @param {string} options.currency - ISO currency code (default "USD")
 * @param {boolean} options.compact - use compact notation for large numbers (e.g. "$1.2K")
 */
export function formatCurrency(value, { currency = "USD", compact = false } = {}) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  }).format(amount);
}

/**
 * Formats a number as USD with no decimal places, e.g. 1200 -> "$1,200"
 * Useful for large totals/summary cards where cents are just noise.
 */
export function formatCurrencyWhole(value, options = {}) {
  return formatCurrency(value, { ...options, compact: false }).replace(/\.\d{2}$/, "");
}

/**
 * Formats a date string/Date as "Sep 4, 2024"
 */
export function formatDate(dateInput) {
  if (!dateInput) return "—";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Formats a date string/Date as "Sep 4, 2024, 3:45 PM"
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return "—";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Formats a date as relative time when recent, falling back to formatDate
 * beyond a week — handy for "last activity" fields on the Deal Health dashboard.
 */
export function formatRelativeDate(dateInput) {
  if (!dateInput) return "—";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return formatDate(dateInput);
}

/**
 * Formats a plain number/decimal as a percentage string, e.g. 12.5 -> "12.5%"
 * Assumes the input is already a percentage value (not a 0-1 fraction).
 */
export function formatPercent(value, { decimals = 1 } = {}) {
  const num = Number(value) || 0;
  const rounded = Number(num.toFixed(decimals));
  return `${rounded}%`;
}

/**
 * Formats a plain integer/decimal with thousands separators, e.g. 12000 -> "12,000"
 */
export function formatNumber(value, { decimals = 0 } = {}) {
  const num = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Truncates long text with an ellipsis — used for line-item comments,
 * customer names in tight table cells, etc.
 */
export function truncateText(text, maxLength = 60) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

/**
 * Capitalizes the first letter of each word — used for status labels
 * like "pending_approval" -> "Pending Approval".
 */
export function formatStatusLabel(status = "") {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}