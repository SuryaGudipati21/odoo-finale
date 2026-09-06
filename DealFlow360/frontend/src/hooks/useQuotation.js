// Owner: Pardha / Sanjay — holds quotation/cart state, syncs directly with backend via services/api.js
// src/hooks/useQuotation.js

import { useState, useEffect, useCallback } from "react";
import * as api from "../services/api";
import * as mockApi from "../services/mockApi";

export function useQuotation(id, actorName, selectedCustomerId) {
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isNew = !id || id === "new";

  const refresh = useCallback(async () => {
    if (isNew) {
      setQuotation((prev) => {
        if (prev && prev.id === "new") {
          return {
            ...prev,
            customer_id: prev.customer_id || selectedCustomerId || 1,
          };
        }
        return {
          id: "new",
          customer_id: selectedCustomerId || 1,
          customer_name: "",
          status: "DRAFT",
          risk_score: 0,
          total_amount: 0,
          lines: [],
          activity: [],
        };
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.getQuotation(id);
      setQuotation(data);
    } catch (err) {
      console.warn("Real API getQuotation failed, falling back to mock:", err);
      try {
        const res = await mockApi.getQuotation(id, actorName);
        setQuotation(res.data);
      } catch (mockErr) {
        setError(mockErr.message || "Failed to load quotation");
      }
    } finally {
      setLoading(false);
    }
  }, [id, isNew, actorName]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (isNew && selectedCustomerId) {
      setQuotation((prev) => {
        if (!prev) return prev;
        if (prev.customer_id === selectedCustomerId) return prev;
        return { ...prev, customer_id: selectedCustomerId };
      });
    }
  }, [isNew, selectedCustomerId]);

  const handleAddLine = async (newLine, customerIdOverride) => {
    const custId = customerIdOverride || quotation?.customer_id || selectedCustomerId || 1;

    const unitPrice = Number(newLine.unit_price ?? newLine.price ?? 0);
    const quantity = Number(newLine.quantity || 1);
    const discountPercent = Number(newLine.discount_percent || 0);
    const lineTotal = Number(
      newLine.line_total ??
        Math.round(unitPrice * quantity * (1 - discountPercent / 100))
    );

    const formattedLine = {
      id: newLine.id || Date.now(),
      product_id: Number(newLine.product_id || newLine.id),
      product_name: newLine.product_name || "Product",
      category: newLine.category || "Hardware",
      quantity,
      unit_price: unitPrice,
      discount_percent: discountPercent,
      line_total: lineTotal,
    };

    // If quotation is being drafted in memory (id === "new" or unsaved)
    if (!quotation?.id || quotation?.id === "new") {
      setQuotation((prev) => {
        const currentLines = Array.isArray(prev?.lines) ? prev.lines : [];
        const updatedLines = [...currentLines, formattedLine];
        const newTotal = updatedLines.reduce(
          (sum, l) => sum + (Number(l.line_total) || 0),
          0
        );
        return {
          ...(prev || {}),
          id: "new",
          customer_id: custId,
          lines: updatedLines,
          total_amount: newTotal,
        };
      });
      return formattedLine;
    }

    // Existing persisted quotation: append line and update backend
    const currentLines = Array.isArray(quotation.lines) ? [...quotation.lines] : [];
    const updatedLines = [...currentLines, formattedLine];

    try {
      const updated = await api.updateQuotationLines(quotation.id, updatedLines);
      setQuotation(updated);
      return updated;
    } catch (err) {
      console.warn("Backend updateQuotationLines failed, updating local state:", err);
      const newTotal = updatedLines.reduce(
        (sum, l) => sum + (Number(l.line_total) || 0),
        0
      );
      setQuotation((prev) => ({
        ...prev,
        lines: updatedLines,
        total_amount: newTotal,
      }));
      return formattedLine;
    }
  };

  const handleApplyDiscount = async (lineId, percent) => {
    if (!quotation) return;
    const currentLines = Array.isArray(quotation.lines) ? quotation.lines : [];
    const updatedLines = currentLines.map((l) => {
      if (l.id === lineId) {
        const disc = Number(percent) || 0;
        const lineTotal = Math.round(
          Number(l.unit_price || 0) * Number(l.quantity || 1) * (1 - disc / 100)
        );
        return { ...l, discount_percent: disc, line_total: lineTotal };
      }
      return l;
    });
    const newTotal = updatedLines.reduce((sum, l) => sum + (Number(l.line_total) || 0), 0);

    if (!quotation.id || quotation.id === "new") {
      setQuotation((prev) => ({ ...prev, lines: updatedLines, total_amount: newTotal }));
      return;
    }

    try {
      const updated = await api.updateQuotationLines(quotation.id, updatedLines);
      setQuotation(updated);
    } catch (err) {
      console.warn("Backend updateQuotationLines failed, updating local state:", err);
      setQuotation((prev) => ({ ...prev, lines: updatedLines, total_amount: newTotal }));
    }
  };

  const handleDeleteLine = async (lineId) => {
    if (!quotation) return;
    const currentLines = Array.isArray(quotation.lines) ? quotation.lines : [];
    const updatedLines = currentLines.filter((l) => l.id !== lineId);
    const newTotal = updatedLines.reduce((sum, l) => sum + (Number(l.line_total) || 0), 0);

    if (!quotation.id || quotation.id === "new") {
      setQuotation((prev) => ({
        ...prev,
        lines: updatedLines,
        total_amount: newTotal,
      }));
      return;
    }

    try {
      const updated = await api.deleteQuotationLine(quotation.id, lineId);
      setQuotation(updated);
    } catch (err) {
      console.warn("Backend deleteQuotationLine failed, updating local state:", err);
      setQuotation((prev) => ({
        ...prev,
        lines: updatedLines,
        total_amount: newTotal,
      }));
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!quotation || !quotation.id || quotation.id === "new") return;
    try {
      const updated = await api.updateQuotationStatus(quotation.id, newStatus);
      setQuotation(updated);
      return updated;
    } catch (err) {
      console.error("Backend updateQuotationStatus failed:", err);
      throw err;
    }
  };

  const handleUpdateCustomer = async (newCustomerId) => {
    if (!quotation) return;
    if (!quotation.id || quotation.id === "new") {
      setQuotation((prev) => ({ ...prev, customer_id: newCustomerId }));
      return;
    }
    try {
      const updated = await api.updateQuotation(quotation.id, { customer_id: newCustomerId });
      setQuotation(updated);
      return updated;
    } catch (err) {
      console.error("Backend update customer failed:", err);
      throw err;
    }
  };

  const handleSubmit = async (requiresApproval, overrideCustomerId) => {
    let activeQuote = quotation;
    const custId = overrideCustomerId || quotation?.customer_id || selectedCustomerId || 1;

    if (!activeQuote || !activeQuote.id || activeQuote.id === "new") {
      const lines = activeQuote?.lines || [];
      if (lines.length === 0) {
        throw new Error("Please add products to your quotation before submitting.");
      }
      const created = await api.createQuotation(custId, lines);
      activeQuote = created;
      setQuotation(created);
    }

    try {
      const res = requiresApproval
        ? await api.submitQuotation(activeQuote.id)
        : await api.confirmQuotationRep(activeQuote.id);
      setQuotation(res);
      return { success: true, data: res };
    } catch (err) {
      console.warn("Backend submitQuotation failed, using mock:", err);
      const res = requiresApproval
        ? await mockApi.submitQuotationForApproval(activeQuote.id, actorName)
        : await mockApi.confirmQuotation(activeQuote.id, actorName);
      setQuotation({ ...res.data });
      return res;
    }
  };

  const handleSaveDraft = async (overrideCustomerId) => {
    if (!quotation) return;
    const custId = overrideCustomerId || quotation.customer_id || selectedCustomerId || 1;
    const lines = quotation.lines || [];

    if (!quotation.id || quotation.id === "new") {
      try {
        const created = await api.createQuotation(custId, lines);
        setQuotation(created);
        return { success: true, data: created };
      } catch (err) {
        console.warn("Backend createQuotation failed, using mock:", err);
        const res = await mockApi.saveQuotationDraft("new", actorName);
        setQuotation({ ...res.data });
        return res;
      }
    }

    try {
      const res = await api.updateQuotationLines(quotation.id, lines);
      setQuotation(res);
      return { success: true, data: res };
    } catch (err) {
      console.warn("Backend save draft failed, using mock:", err);
      const res = await mockApi.saveQuotationDraft(quotation.id, actorName);
      setQuotation({ ...res.data });
      return res;
    }
  };

  return {
    quotation,
    setQuotation,
    loading,
    error,
    refresh,
    handleAddLine,
    handleApplyDiscount,
    handleDeleteLine,
    handleUpdateStatus,
    handleUpdateCustomer,
    handleSubmit,
    handleSaveDraft,
  };
}