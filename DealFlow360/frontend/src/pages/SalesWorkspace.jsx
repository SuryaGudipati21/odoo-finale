// Owner: Pardha — Sales Dashboard / Home (B1/B2)
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

function SalesWorkspace() {
  const navigate = useNavigate();

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Sales Dashboard / Home</h1>
      <p className="text-gray-500 text-sm mb-6">Central hub, links out to every module below</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-gray-500 text-sm mb-1">Pending Approvals</p>
          <p className="text-gray-900 text-xl font-semibold">4 quotations waiting</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-gray-500 text-sm mb-1">Open Quotations</p>
          <p className="text-gray-900 text-xl font-semibold">12 active deals</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-gray-500 text-sm mb-1">At-Risk Deals</p>
          <p className="text-gray-900 text-xl font-semibold">3 flagged by Deal Health</p>
        </div>
      </div>

      <div className="flex gap-3 mb-8">
        <button
          onClick={() => navigate("/quotations/builder/new")}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-150"
        >
          + New Quotation
        </button>
        <button
          onClick={() => navigate("/approvals")}
          className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-150"
        >
          View Approvals
        </button>
      </div>

      <h2 className="text-lg font-semibold text-blue-600 mb-3">Recent Activity</h2>
      <ul className="space-y-2 text-gray-700 text-sm">
        <li>— Acme Corp quotation approved by Finance</li>
        <li>— Beta Industries requested a discount change</li>
        <li>— East Depot stock updated for Order #2291</li>
      </ul>
    </Layout>
  );
}

export default SalesWorkspace;