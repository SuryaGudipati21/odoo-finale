// src/components/UpsellPanel.jsx
// Owner: Pardha — live upsell/cross-sell suggestions panel, shown alongside the cart (B5)
// Location: frontend/src/components/UpsellPanel.jsx

import { useState, useEffect } from "react";
import { getUpsellSuggestions } from "../services/api";
import { fetchUpsellSuggestions } from "../services/mockApi";

function UpsellPanel({ quotationId, onAddSuggestion }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    if (!quotationId || quotationId === "new") {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getUpsellSuggestions(quotationId)
      .then((data) => setSuggestions(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.warn("Real getUpsellSuggestions failed, trying mock:", err);
        fetchUpsellSuggestions(quotationId)
          .then((res) => setSuggestions(res.data || []))
          .catch((mErr) => setError(mErr.message));
      })
      .finally(() => setLoading(false));
  }, [quotationId]);

  const handleAdd = (suggestion) => {
    setAddingId(suggestion.id);
    onAddSuggestion?.(suggestion);
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
    setAddingId(null);
  };

  const handleDismiss = (id) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  if (loading) {
    return (
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500/30 rounded-full"></div>
          <p className="text-gray-400 text-sm">Loading suggestions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm">
        {error}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 text-center">
        <p className="text-gray-400 text-sm">No suggestions right now — nice, lean quote.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-600/10 to-blue-400/5 border border-purple-500/20 rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
        Suggested for This Deal
      </h3>
      <p className="text-xs text-gray-400 -mt-2">
        Ranked by co-purchase history and active promotions
      </p>

      <div className="space-y-3">
        {suggestions.map((s) => (
          <div
            key={s.id}
            className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-4 hover:border-purple-500/40 transition-colors duration-200"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-white font-semibold flex items-center gap-2">
                  {s.product_name}
                  {s.promoted && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      🔥 Promoted
                    </span>
                  )}
                </p>
                <p className="text-xs text-green-400 font-semibold mt-1">
                  +${s.margin_delta?.toLocaleString()} margin if added
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleAdd(s)}
                disabled={addingId === s.id}
                className="flex-1 px-3 py-2 bg-purple-600/30 hover:bg-purple-600/40 disabled:opacity-50 text-purple-200 text-xs font-semibold rounded-lg border border-purple-500/40 transition-colors duration-200"
              >
                + Add to Quote
              </button>
              <button
                onClick={() => handleDismiss(s.id)}
                className="px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 text-xs font-medium rounded-lg border border-gray-700/50 transition-colors duration-200"
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UpsellPanel;