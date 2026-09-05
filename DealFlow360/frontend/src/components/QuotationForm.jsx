// Owner: Pardha — form for adding a product line to the quotation
import { useState } from "react";

function QuotationForm({ onAddLine }) {
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddLine({
      id: Date.now(),
      product_id: null,       // real product_id comes once backend product list API exists
      product_name: productName,
      quantity,
      unit_price: 0,           // placeholder — backend will return real price
      discount_percent: discount,
      line_total: 0            // placeholder — backend computes real total
    });
    setProductName("");
    setQuantity(1);
    setDiscount(0);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Product name"
        value={productName}
        onChange={(e) => setProductName(e.target.value)}
        required
      />
      <input
        type="number"
        min="1"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
      />
      <input
        type="number"
        min="0"
        placeholder="Discount %"
        value={discount}
        onChange={(e) => setDiscount(Number(e.target.value))}
      />
      <button type="submit">Add Line</button>
    </form>
  );
}

export default QuotationForm;