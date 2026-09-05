// Owner: Pardha — approval history list, used in ApprovalScreen
// Location: frontend/src/components/AuditTrail.jsx

import React from "react";

const LEVEL_LABELS = {
  manager: "Sales Manager",
  finance: "Finance",
};

const STATUS_STYLES = {
  approved: {
    badge: "bg-green-500/20 text-green-300 border-green-500/30",
    dot: "bg-green-500/20 border-green-500/40",
    icon: "✓",
  },
  rejected: {
    badge: "bg-red-500/20 text-red-300 border-red-500/30",
    dot: "bg-red-500/20 border-red-500/40",
    icon: "✕",
  },
  pending: {
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    dot: "bg-amber-500/20 border-amber-500/40",
    icon: "…",
  },
  request_revision: {
    badge: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    dot: "bg-orange-500/20 border-orange-500/40",
    icon: "↺",
  },
};

const formatTimestamp = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatStatusLabel = (status = "") =>
  status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Renders a chronological approval/audit history.
 * Accepts either:
 *   - `steps`: array from an approval object (level, status, reviewed_by, reason, timestamp)
 *   - `entries`: a more generic audit log array (action, user, reason, timestamp)
 * `steps` is treated as the primary shape since that's what ApprovalScreen currently has.
 */
const AuditTrail = ({ steps = [], entries = [], title = "Approval History" }) => {
  const items = steps.length ? steps : entries;

  if (!items.length) {
    return (
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 text-center">
        <p className="text-gray-400 text-sm">No approval activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
        {title}
      </h3>

      <div className="space-y-4">
        {items.map((item, idx) => {
          const status = item.status || "pending";
          const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
          const levelLabel = LEVEL_LABELS[item.level] || item.level || item.action || "Step";
          const timestamp = formatTimestamp(item.timestamp || item.reviewed_at);
          const isLast = idx === items.length - 1;

          return (
            <div key={idx} className="relative flex gap-4">
              {/* Timeline connector */}
              {!isLast && (
                <div className="absolute left-4 top-9 w-0.5 h-[calc(100%-1rem)] bg-gray-700/40"></div>
              )}

              {/* Status dot */}
              <div className="mt-1 shrink-0 relative z-10">
                <div
                  className={`w-8 h-8 rounded-full border flex items-center justify-center ${style.dot}`}
                >
                  <span className="text-sm">{style.icon}</span>
                </div>
              </div>

              {/* Content card */}
              <div className="flex-1 bg-gray-900/40 border border-gray-700/30 rounded-lg p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-white font-semibold">{levelLabel}</p>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border ${style.badge}`}
                  >
                    {formatStatusLabel(status)}
                  </span>
                </div>

                {(item.reviewed_by || item.user) && (
                  <p className="text-sm text-gray-400 mt-2">
                    Reviewed by{" "}
                    <span className="text-gray-300 font-medium">
                      {item.reviewed_by || item.user}
                    </span>
                  </p>
                )}

                {timestamp && <p className="text-xs text-gray-500 mt-1">{timestamp}</p>}

                {item.reason && (
                  <div className="mt-3 pt-3 border-t border-gray-700/40">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                      Reason
                    </p>
                    <p className="text-sm text-gray-300">{item.reason}</p>
                  </div>
                )}

                {!item.reviewed_by && !item.user && status === "pending" && (
                  <p className="text-xs text-gray-500 mt-2">Awaiting review</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AuditTrail;