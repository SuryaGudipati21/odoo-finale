import { useState, useEffect, useRef, useCallback } from "react";
import { fetchApprovalDetail, submitApprovalAction } from "../services/mockApi";
import { getApprovalDetail, approvalAction } from "../services/api";

const DEFAULT_POLL_INTERVAL = 8000; // ms — only polls while status is "pending"

/**
 * Loads an approval record and (optionally) polls it while it's still pending,
 * e.g. so a Sales Manager sees Finance's decision land without a manual refresh.
 *
 * @param {string|number} approvalId
 * @param {object} options
 * @param {boolean} options.poll        - enable/disable polling (default true)
 * @param {number}  options.pollInterval- ms between polls while pending (default 8000)
 */
export function useApprovalStatus(approvalId, options = {}) {
  const { poll = true, pollInterval = DEFAULT_POLL_INTERVAL } = options;

  const [approval, setApproval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const intervalRef = useRef(null);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!approvalId) return;
      if (!silent) setLoading(true);
      setError(null);
      try {
        let approvalData = null;
        try {
          approvalData = await getApprovalDetail(approvalId);
        } catch {
          const res = await fetchApprovalDetail(approvalId);
          approvalData = res.data;
        }

        if (approvalData) {
          approvalData.status = (approvalData.status || "pending").toLowerCase();
          setApproval(approvalData);
        }
      } catch (err) {
        setError(err.message || "Failed to load approval");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [approvalId]
  );

  // Initial load
  useEffect(() => {
    load();
  }, [load]);

  // Polling — only while pending, only if enabled
  useEffect(() => {
    const currentStatus = (approval?.status || "").toLowerCase();
    if (!poll || !approval || currentStatus !== "pending") {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      load({ silent: true });
    }, pollInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [poll, pollInterval, approval, load]);

  const submitDecision = useCallback(
    async (action, reason) => {
      if (!approvalId) return;
      setSubmitting(true);
      setError(null);
      try {
        let result = null;
        try {
          result = await approvalAction(approvalId, action, reason);
        } catch {
          const res = await submitApprovalAction(approvalId, action, reason);
          result = res.data;
        }
        // Also keep mock store synced
        submitApprovalAction(approvalId, action, reason).catch(() => {});

        const newStatus = (result?.status || (action === "approve" ? "approved" : action === "request_revision" ? "revision_requested" : "rejected")).toLowerCase();
        setApproval((prev) => {
          if (!prev) return null;
          const updatedSteps = Array.isArray(prev.steps) ? [...prev.steps] : [];
          const targetStep = updatedSteps.find((s) => (s.status || "").toLowerCase() === "pending") || updatedSteps[updatedSteps.length - 1];
          if (targetStep) {
            targetStep.status = newStatus;
            targetStep.reviewed_by = targetStep.level === "finance" ? "Finance Director" : "Sales Manager";
            targetStep.reason = reason || `Decision ${newStatus} confirmed`;
          }
          return {
            ...prev,
            status: newStatus,
            steps: updatedSteps,
          };
        });

        // Delay background reload so UI transitions smoothly
        setTimeout(() => {
          load({ silent: true }).catch(() => {});
        }, 1200);

        return { data: result };
      } catch (err) {
        setError(err.message || "Failed to submit decision");
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [approvalId, load]
  );

  return {
    approval,
    loading,
    error,
    submitting,
    refresh: () => load(),
    submitDecision,
  };
}