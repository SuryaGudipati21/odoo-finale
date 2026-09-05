// Owner: Pardha — holds quotation/cart state, syncs with backend via services/api.js
// src/hooks/useQuotation.js
import { useState, useEffect, useCallback } from "react";
import { getQuotation, addLine, applyDiscount } from "../services/mockApi";

export function useQuotation(id) {
  const [quotation, setQuotation] = useState(null);

  const refresh = useCallback(() => {
    getQuotation(id).then(setQuotation);
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAddLine = async (line) => {
    const updated = await addLine(id, line);
    setQuotation({ ...updated });
  };

  const handleApplyDiscount = async (lineId, percent) => {
    const updated = await applyDiscount(id, lineId, percent);
    setQuotation({ ...updated });
  };

  return { quotation, handleAddLine, handleApplyDiscount };
}