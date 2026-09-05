// Owner: Pardha — polls/reads approval status for a quotation
// Location: frontend/src/hooks/useApprovalStatus.js

import { useState, useEffect, useRef, useCallback } from "react";
import { fetchApprovalDetail, submitApprovalAction } from "../services/mockApi";
// NOTE: swap the two imports above for services/api.js (getApprovalDetail / approvalAction)
// once the backend endpoints are confirmed stable — same call shape is kept intentionally
// so that swap is a one-line change.

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
        const res = await fetchApprovalDetail(approvalId);
        setApproval(res.data);
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
    if (!poll || !approval || approval.status !== "pending") {
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
        const res = await submitApprovalAction(approvalId, action, reason);
        // Optimistically merge, then re-fetch silently to pick up any
        // server-side side effects (e.g. auto-advance to next level).
        setApproval((prev) => (prev ? { ...prev, status: res.data.status } : prev));
        await load({ silent: true });
        return res;
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