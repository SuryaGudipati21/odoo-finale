// Owner: Pardha — quotation list/pipeline entry point
// src/pages/SalesWorkspace.jsx
// Owner: Pardha — quotation list/pipeline entry point

import { useState } from "react";
import { mockQuotation } from "../data/mockData";
import QuotationBuilder from "./QuotationBuilder";

function SalesWorkspace() {
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);

  // Single mock quotation for now — real version will list multiple quotations
  // fetched from GET /quotations (endpoint not yet documented in TEAM_STATE — flag if needed)
  const quotations = [mockQuotation];

  if (selectedQuotationId) {
    return (
      <div>
        <button onClick={() => setSelectedQuotationId(null)}>← Back to list</button>
        <QuotationBuilder />
      </div>
    );
  }

  return (
    <div>
      <h2>Sales Workspace</h2>
      <h3>Quotations</h3>
      <ul>
        {quotations.map(q => (
          <li key={q.id}>
            <button onClick={() => setSelectedQuotationId(q.id)}>
              Quotation #{q.id} — {q.customer_id} — {q.status}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SalesWorkspace;