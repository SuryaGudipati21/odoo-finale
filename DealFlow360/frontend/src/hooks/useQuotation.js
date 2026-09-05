// Owner: Pardha — holds quotation/cart state, syncs with backend via services/api.js
// src/hooks/useQuotation.js
// FIXED: was importing the wrong `addLine` (a generic mockApi export that returns
// a single line, not the full quotation) — switched to `addLineToQuotation`,
// which is the one that actually mutates and returns the whole quotation.

import { useState, useEffect, useCallback } from "react";
import {
  getQuotation,
  addLineToQuotation,
  applyDiscount,
  deleteLineFromQuotation,
} from "../services/mockApi";

export function useQuotation(id) {
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!id) return;
    setLoading(true);
    getQuotation(id)
      .then((res) => setQuotation(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAddLine = async (line) => {
    const res = await addLineToQuotation(id, line);
    setQuotation({ ...res.data });
  };

  const handleApplyDiscount = async (lineId, percent) => {
    const res = await applyDiscount(id, lineId, percent);
    setQuotation({ ...res.data });
  };

  const handleDeleteLine = async (lineId) => {
    const res = await deleteLineFromQuotation(id, lineId);
    setQuotation({ ...res.data });
  };

  return { quotation, loading, handleAddLine, handleApplyDiscount, handleDeleteLine };
}