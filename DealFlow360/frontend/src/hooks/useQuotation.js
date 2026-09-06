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
  submitQuotationForApproval,
  confirmQuotation,
  saveQuotationDraft,
} from "../services/mockApi";

export function useQuotation(id, actorName) {
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!id) return;
    setLoading(true);
    getQuotation(id, actorName)
      .then((res) => setQuotation(res.data))
      .finally(() => setLoading(false));
  }, [id, actorName]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAddLine = async (line) => {
    const res = await addLineToQuotation(id, line, actorName);
    setQuotation({ ...res.data });
  };

  const handleApplyDiscount = async (lineId, percent) => {
    const res = await applyDiscount(id, lineId, percent, actorName);
    setQuotation({ ...res.data });
  };

  const handleDeleteLine = async (lineId) => {
    const res = await deleteLineFromQuotation(id, lineId, actorName);
    setQuotation({ ...res.data });
  };

  const handleSubmit = async (requiresApproval) => {
    const res = requiresApproval
      ? await submitQuotationForApproval(id, actorName)
      : await confirmQuotation(id, actorName);
    setQuotation({ ...res.data });
    return res;
  };

  const handleSaveDraft = async () => {
    const res = await saveQuotationDraft(id, actorName);
    setQuotation({ ...res.data });
    return res;
  };

  return { quotation, loading, handleAddLine, handleApplyDiscount, handleDeleteLine, handleSubmit, handleSaveDraft };
}