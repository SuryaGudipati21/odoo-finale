// Owner: Pardha — form for adding a product line to the quotation
// Location: frontend/src/components/QuotationForm.jsx

import { useState, useEffect } from "react";
import { fetchProducts } from "../services/mockApi";
import { formatCurrency } from "../utils/formatting";

function QuotationForm({ onAddLine }) {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts()
      .then((res) => {
        setProducts(res.data || []);
        if (res.data?.length) setSelectedProductId(String(res.data[0].id));
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedProduct = products.find((p) => p.id === Number(selectedProductId));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const unitPrice = selectedProduct.price;
    const lineTotal = Math.round(unitPrice * quantity * (1 - discount / 100));

    onAddLine({
      id: Date.now(),
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      category: selectedProduct.category,
      quantity,
      unit_price: unitPrice,
      discount_percent: discount,
      line_total: lineTotal,
    });

    setQuantity(1);
    setDiscount(0);
  };

  if (loading) {
    return <p className="text-gray-400 text-sm">Loading product catalog...</p>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 space-y-4"
    >
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
        Add Product Line
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2">
          <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">
            Product
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700/50 text-white rounded-lg focus:border-blue-500/50 focus:outline-none"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatCurrency(p.price)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">
            Quantity
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700/50 text-white rounded-lg focus:border-blue-500/50 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">
            Discount %
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
            className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700/50 text-white rounded-lg focus:border-blue-500/50 focus:outline-none"
          />
        </div>
      </div>

      {selectedProduct && (
        <p className="text-xs text-gray-400">
          Line preview:{" "}
          <span className="text-white font-medium">
            {quantity} × {formatCurrency(selectedProduct.price)}
            {discount > 0 && ` (−${discount}%)`} ={" "}
            {formatCurrency(selectedProduct.price * quantity * (1 - discount / 100))}
          </span>
        </p>
      )}

      <button
        type="submit"
        disabled={!selectedProduct}
        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-all duration-200"
      >
        + Add Line
      </button>
    </form>
  );
}

export default QuotationForm;