// Owner: Pardha — form for adding a product line to the quotation
// Location: frontend/src/components/QuotationForm.jsx

import { useState, useEffect } from "react";
import { getProducts } from "../services/api";
import { fetchProducts } from "../services/mockApi";
import { formatCurrency } from "../utils/formatting";

function QuotationForm({ onAddLine }) {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then((data) => {
        const prods = Array.isArray(data) ? data : [];
        setProducts(prods);
        if (prods.length) setSelectedProductId(String(prods[0].id));
      })
      .catch((err) => {
        console.warn("Real getProducts failed, falling back to mock:", err);
        fetchProducts()
          .then((res) => {
            const prods = res.data || [];
            setProducts(prods);
            if (prods.length) setSelectedProductId(String(prods[0].id));
          })
          .catch(console.error);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedProduct =
    products.find((p) => String(p.id) === String(selectedProductId)) ||
    (products.length > 0 ? products[0] : null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const unitPrice = Number(selectedProduct.price ?? selectedProduct.base_price ?? 0);
    const qty = Math.max(1, Number(quantity || 1));
    const disc = Math.max(0, Math.min(100, Number(discount || 0)));
    const lineTotal = Math.round(unitPrice * qty * (1 - disc / 100));

    onAddLine({
      id: Date.now(),
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      category: selectedProduct.category || "Hardware",
      quantity: qty,
      unit_price: unitPrice,
      discount_percent: disc,
      line_total: lineTotal,
    });

    setQuantity(1);
    setDiscount(0);
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 text-xs">Loading product catalog...</p>
      </div>
    );
  }

  const currentPrice = Number(selectedProduct?.price ?? selectedProduct?.base_price ?? 0);
  const currentTotal = currentPrice * quantity * (1 - discount / 100);

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
          Add Product Line to Quotation
        </h3>
        <span className="text-xs text-gray-400">
          {products.length} products available in catalog
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-gray-700 block mb-1">
            Select Product
          </label>
          <select
            value={selectedProductId || (selectedProduct?.id ? String(selectedProduct.id) : "")}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
          >
            {products.map((p) => {
              const pPrice = Number(p.price ?? p.base_price ?? 0);
              return (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category || "Hardware"}) — {formatCurrency(pPrice)}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">
            Quantity
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">
            Discount %
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={discount}
            onChange={(e) => setDiscount(Math.max(0, Math.min(100, Number(e.target.value))))}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
          />
        </div>
      </div>

      {selectedProduct && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-900">
          <div>
            Line calculation:{" "}
            <span className="font-semibold">
              {quantity} × {formatCurrency(currentPrice)}
              {discount > 0 && ` (−${discount}% disc)`}
            </span>
          </div>
          <div className="font-bold text-sm text-blue-700">
            = {formatCurrency(currentTotal)}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end pt-1">
        <button
          type="submit"
          disabled={!selectedProduct && products.length === 0}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow transition-all duration-150 btn-press flex items-center gap-2 cursor-pointer"
        >
          <span>+ Add Line</span>
        </button>
      </div>
    </form>
  );
}

export default QuotationForm;