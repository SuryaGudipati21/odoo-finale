// Owner: Sanjay — fetches warehouse split recommendation for a quotation
// Owner: Sanjay — fetches warehouse split recommendation for a quotation
// Location: frontend/src/hooks/useWarehouseSplit.js

import { useState, useEffect, useCallback } from "react";
import { fetchWarehouseSplit, confirmWarehouseSplit } from "../services/mockApi";

/**
 * Loads the recommended warehouse split for a quotation and exposes a
 * confirm action. Extracted from WarehouseSplit.jsx so the split-fetching
 * logic can be reused (e.g. a summary widget on the Deal Health dashboard)
 * without duplicating the fetch/confirm plumbing.
 *
 * @param {string|number} quotationId
 */
export function useWarehouseSplit(quotationId) {
  const [warehouseData, setWarehouseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    if (!quotationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWarehouseSplit(quotationId);
      setWarehouseData(res.data);
    } catch (err) {
      setError(err.message || "Failed to load warehouse split");
    } finally {
      setLoading(false);
    }
  }, [quotationId]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmSplit = useCallback(
    async (overrides) => {
      if (!quotationId) return;
      setConfirming(true);
      setError(null);
      try {
        const res = await confirmWarehouseSplit(quotationId, overrides || warehouseData);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
        return res;
      } catch (err) {
        setError(err.message || "Failed to confirm warehouse split");
        throw err;
      } finally {
        setConfirming(false);
      }
    },
    [quotationId, warehouseData]
  );

  const totalCost = warehouseData
    ? warehouseData.order_lines.reduce(
        (total, line) =>
          total + line.warehouse_splits.reduce((lineTotal, split) => lineTotal + split.cost, 0),
        0
      )
    : 0;

  return {
    warehouseData,
    loading,
    error,
    confirming,
    success,
    totalCost,
    refresh: load,
    confirmSplit,
  };
}