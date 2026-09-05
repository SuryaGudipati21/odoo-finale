// src/components/UpsellPanel.jsx
// Owner: Pardha — fetches real upsell suggestions from backend
import { useState, useEffect } from "react";
import { getUpsellSuggestions } from "../services/api";

function UpsellPanel({ quotationId, onAddSuggestion }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getUpsellSuggestions(quotationId)
      .then(setSuggestions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [quotationId]);

  const handleAdd = (suggestion) => {
    onAddSuggestion?.(suggestion);
    setSuggestions(prev => prev.filter(s => s.product_id !== suggestion.product_id));
  };

  const handleDismiss = (productId) => {
    setSuggestions(prev => prev.filter(s => s.product_id !== productId));
  };

  if (loading) return <p>Loading suggestions...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (suggestions.length === 0) return null;

  return (
    <div>
      <h3>Suggested for this deal</h3>
      <ul>
        {suggestions.map(s => (
          <li key={s.product_id}>
            {s.product_name}
            {s.is_promoted && " 🔥"}
            {" — +₹"}{s.margin_delta} margin
            <button onClick={() => handleAdd(s)}>Add to Quote</button>
            <button onClick={() => handleDismiss(s.product_id)}>Dismiss</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UpsellPanel;