// Owner: Sanjay — restricted customer-facing negotiation view
import CustomerNegotiation from '../components/CustomerNegotiation';

// Inside CustomerPortal page component:
const handleNegotiationSubmit = async (negotiationData) => {
  try {
    const response = await api.post(
      `/portal/quotations/${quotationId}/negotiate`,
      negotiationData
    );
    // Handle success
    showSuccessMessage('Negotiation request submitted');
    // Refresh quotation to show updated status
    fetchQuotation(quotationId);
  } catch (error) {
    showErrorMessage('Failed to submit negotiation request');
  }
};

// In render:
<CustomerNegotiation
  quotation={quotationData}
  onSubmit={handleNegotiationSubmit}
  isSubmitting={isLoading}
/>