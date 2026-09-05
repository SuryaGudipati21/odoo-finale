// Owner: Sanjay — fulfillment split visualization + manual override
import React, { useState, useEffect } from "react";
import { fetchWarehouseSplit, confirmWarehouseSplit } from "../services/mockApi";

const WarehouseSplit = ({ quotationId }) => {
  const [warehouseData, setWarehouseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSplits, setSelectedSplits] = useState({});
  const [manualOverride, setManualOverride] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadWarehouseData = async () => {
      try {
        setLoading(true);
        const response = await fetchWarehouseSplit(quotationId);
        setWarehouseData(response.data);
        setSelectedSplits(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadWarehouseData();
  }, [quotationId]);

  const handleConfirmSplit = async () => {
    try {
      setConfirming(true);
      await confirmWarehouseSplit(quotationId, selectedSplits);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  };

  const calculateTotalCost = () => {
    if (!warehouseData) return 0;
    return warehouseData.order_lines.reduce((total, line) => {
      return (
        total +
        line.warehouse_splits.reduce((lineTotal, split) => lineTotal + split.cost, 0)
      );
    }, 0);
  };

  const getStockLevelColor = (level) => {
    const colors = {
      high: "bg-green-500/20 text-green-300 border-green-500/30",
      medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      low: "bg-red-500/20 text-red-300 border-red-500/30",
    };
    return colors[level] || colors.medium;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/30 rounded-full"></div>
          <p className="text-gray-400 text-sm">Loading warehouse data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300">
        <p className="font-semibold">Error</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/10 to-blue-400/5 border border-blue-500/20 rounded-xl p-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
          Warehouse Fulfillment Strategy
        </h1>
        <p className="text-gray-400 text-sm">
          Optimize your inventory split across multiple warehouses for efficient delivery
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-green-300 animate-in fade-in duration-300">
          <p className="font-semibold">✓ Warehouse split confirmed successfully</p>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Warehouse Cards Section */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
            Warehouse Distribution
          </h2>

          {warehouseData?.order_lines.map((line, lineIdx) => (
            <div key={lineIdx} className="space-y-3">
              {/* Product Header */}
              <div className="bg-gray-800/40 border border-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">Product</p>
                <p className="text-white font-semibold text-lg">{line.product}</p>
                <p className="text-blue-400 text-sm mt-1">
                  Qty: {line.total_qty} | {line.warehouse_splits.length} warehouse
                  {line.warehouse_splits.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Warehouse Splits */}
              <div className="space-y-2 ml-2">
                {line.warehouse_splits.map((split, splitIdx) => (
                  <div
                    key={splitIdx}
                    className="bg-gray-900/60 border border-gray-700/40 rounded-lg p-4 hover:border-gray-600/60 transition-colors duration-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Warehouse Info */}
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">
                          Warehouse
                        </p>
                        <p className="text-white font-semibold text-base mt-1">
                          {split.warehouse_name}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStockLevelColor(
                              split.stock_level
                            )}`}
                          >
                            Stock: {split.stock_level.charAt(0).toUpperCase() + split.stock_level.slice(1)}
                          </span>
                        </div>
                      </div>

                      {/* Right: Metrics */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">Quantity</span>
                          <span className="text-white font-bold text-lg">
                            {split.quantity} units
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">Shipments</span>
                          <span className="text-blue-400 font-semibold">
                            {split.shipment_count}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-gray-700/50">
                          <span className="text-gray-400 text-sm">Cost</span>
                          <span className="text-green-400 font-bold text-base">
                            ${split.cost.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Adjustment (Mobile-friendly) */}
                    {!manualOverride && (
                      <div className="mt-3 pt-3 border-t border-gray-700/50">
                        <p className="text-xs text-gray-400 mb-2">
                          Auto-optimized based on stock levels
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Cost Breakdown & Actions */}
        <div className="space-y-4">
          {/* Cost Summary Card */}
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-400/10 border border-blue-500/30 rounded-xl p-6">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
              Total Fulfillment Cost
            </p>
            <p className="text-4xl font-bold text-white mb-2">
              ${calculateTotalCost().toLocaleString()}
            </p>
            <div className="text-xs text-gray-400">
              <p>Shipments: {warehouseData?.total_shipments || 0}</p>
              <p className="mt-1">
                Backorder Risk:{" "}
                <span
                  className={
                    warehouseData?.backorder_risk
                      ? "text-red-400 font-semibold"
                      : "text-green-400 font-semibold"
                  }
                >
                  {warehouseData?.backorder_risk ? "Yes" : "No"}
                </span>
              </p>
            </div>
          </div>

          {/* Recommendation Card */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-300 flex items-center gap-2">
              <span className="text-lg">💡</span> Recommendation
            </p>
            <p className="text-xs text-gray-300 mt-2 leading-relaxed">
              The recommended split minimizes shipment count while respecting warehouse
              capacity constraints.
            </p>
          </div>

          {/* Toggle Manual Override */}
          <button
            onClick={() => setManualOverride(!manualOverride)}
            className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              manualOverride
                ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                : "bg-gray-800/50 text-gray-300 border border-gray-700/50 hover:border-gray-600/50"
            }`}
          >
            {manualOverride ? "✓ Manual Mode On" : "Manual Override"}
          </button>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleConfirmSplit}
              disabled={confirming}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              {confirming ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Confirming...
                </span>
              ) : (
                "✓ Accept & Confirm"
              )}
            </button>

            <button className="w-full px-6 py-3 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 font-semibold rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200">
              Cancel
            </button>
          </div>

          {/* Info Footer */}
          <p className="text-xs text-gray-500 text-center">
            Changes lock in when confirmed. Contact support for modifications.
          </p>
        </div>
      </div>

      {/* Backorder Handling (Conditional) */}
      {warehouseData?.backorder_risk && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <p className="text-red-300 font-semibold flex items-center gap-2 mb-3">
            <span className="text-xl">⚠️</span> Backorder Notice
          </p>
          <p className="text-gray-300 text-sm mb-4">
            Some items may ship from a warehouse currently out of stock. You can:
          </p>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-2 bg-red-600/20 border border-red-500/30 rounded-lg hover:bg-red-600/30 text-red-300 text-sm transition-colors duration-200">
              ✓ Accept backorder (items ship when available)
            </button>
            <button className="w-full text-left px-4 py-2 bg-orange-600/20 border border-orange-500/30 rounded-lg hover:bg-orange-600/30 text-orange-300 text-sm transition-colors duration-200">
              → Consolidate (wait for all items, ship together)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseSplit;