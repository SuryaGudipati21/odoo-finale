from pydantic import BaseModel


class NegotiationRequest(BaseModel):
    comment: str | None = None
    proposed_discount_percent: float | None = None  # counter-offer on a specific line
    quotation_line_id: int | None = None


class NegotiationConfirm(BaseModel):
    confirm: bool = True