// src/pages/ApprovalsList.jsx — Owner: Pardha
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchApprovals } from "../services/mockApi";
import Layout from "../components/Layout";

function ApprovalsList() {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState([]);

  useEffect(() => {
    fetchApprovals().then((res) => setApprovals(res.data || []));
  }, []);

  const riskLabel = (score) => (score >= 15 ? "HIGH" : score >= 8 ? "MEDIUM" : "LOW");

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Approvals (List)</h1>
      <p className="text-gray-500 text-sm mb-6">Every quotation that needed, needs, or is going through discount approval</p>

      <div className="flex gap-3 mb-6">
        <span className="px-4 py-2 bg-amber-100 text-amber-800 font-semibold rounded-lg text-sm">
          {approvals.filter((a) => a.status === "pending").length} Pending
        </span>
        <span className="px-4 py-2 bg-red-100 text-red-800 font-semibold rounded-lg text-sm">1 Returned</span>
        <span className="px-4 py-2 bg-green-100 text-green-800 font-semibold rounded-lg text-sm">
          {approvals.filter((a) => a.status === "approved").length} Approved
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Quotation</th>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">Blended Risk</th>
              <th className="text-left px-4 py-3">Stage</th>
              <th className="text-left px-4 py-3">Assigned To</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {approvals.map((a) => (
              <tr
                key={a.id}
                onClick={() => navigate(`/approvals/${a.id}`)}
                className="cursor-pointer hover:bg-gray-50"
              >
                <td className="px-4 py-3 text-gray-900 font-medium">Q-{a.quotation_id}</td>
                <td className="px-4 py-3 text-gray-600">Acme Corp</td>
                <td className="px-4 py-3 font-semibold">{riskLabel(a.blended_risk_score)}</td>
                <td className="px-4 py-3 text-gray-600 capitalize">{a.level}</td>
                <td className="px-4 py-3 text-gray-500">—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 mb-4">
        Click any row to open its full approval detail, risk breakdown, and audit trail.
      </div>

      <button className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm">
        Filter: Pending Only
      </button>
    </Layout>
  );
}

export default ApprovalsList;