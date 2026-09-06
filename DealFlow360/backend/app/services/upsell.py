from sqlalchemy.orm import Session

from app.models.upsell import ProductPairing


def get_suggestions(db: Session, product_ids: list[int], min_margin: float = 0) -> list[dict]:
    if not product_ids:
        return []
    pairings = (
        db.query(ProductPairing)
        .filter(ProductPairing.base_product_id.in_(product_ids))
        .filter(ProductPairing.margin_delta >= min_margin)
        .order_by(ProductPairing.is_promoted.desc(), ProductPairing.margin_delta.desc())
        .all()
    )
    return [
        {
            "product_id": p.suggested_product_id,
            "product_name": p.suggested_product.name,
            "margin_delta": p.margin_delta,
            "is_promoted": p.is_promoted,
        }
        for p in pairings
    ]