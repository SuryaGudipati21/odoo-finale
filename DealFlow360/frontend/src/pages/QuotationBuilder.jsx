import { useQuotation } from "../hooks/useQuotation";
import QuotationForm from "../components/QuotationForm";

function QuotationBuilder() {
  const { quotation, handleAddLine, handleApplyDiscount } = useQuotation(1);

  if (!quotation) return <p>Loading...</p>;

  return (
    <div>
      <h2>Quotation #{quotation.id} — {quotation.status}</h2>

      <table>
        <thead>
          <tr><th>Product</th><th>Qty</th><th>Price</th><th>Discount %</th><th>Total</th></tr>
        </thead>
        <tbody>
          {quotation.lines.map(line => (
            <tr key={line.id}>
              <td>{line.product_name}</td>
              <td>{line.quantity}</td>
              <td>{line.unit_price}</td>
              <td>
                <input
                  type="number"
                  value={line.discount_percent}
                  onChange={(e) => handleApplyDiscount(line.id, Number(e.target.value))}
                />
              </td>
              <td>{line.line_total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>Margin: ₹{quotation.margin}</p>

      <QuotationForm onAddLine={handleAddLine} />
    </div>
  );
}

export default QuotationBuilder;