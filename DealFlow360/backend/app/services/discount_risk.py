from sqlalchemy.orm import Session

from app.models.discount import DiscountTierLimit, CategoryDiscountLimit
from app.models.customer import CustomerTier

MANAGER_THRESHOLD = 0      # any excess at all needs Manager
FINANCE_THRESHOLD = 10      # total excess above this also needs Finance


def calculate_blended_risk(db: Session, tier: CustomerTier, lines: list[dict]) -> dict:
    """
    lines: [{"category": str, "discount_percent": float}, ...]
    Returns: {"score": float, "approval_required": bool, "finance_required": bool, "line_breakdown": [...]}
    """
    tier_limit = db.query(DiscountTierLimit).filter_by(tier=tier).first()
    tier_max = tier_limit.max_discount_percent if tier_limit else 0

    total_excess = 0.0
    breakdown = []

    for line in lines:
        cat_limit = db.query(CategoryDiscountLimit).filter_by(category=line["category"]).first()
        cat_max = cat_limit.max_discount_percent if cat_limit else tier_max

        effective_limit = min(tier_max, cat_max)
        excess = max(0.0, line["discount_percent"] - effective_limit)
        total_excess += excess
        breakdown.append({"category": line["category"], "limit": effective_limit, "excess": excess})

    return {
        "score": total_excess,
        "approval_required": total_excess > MANAGER_THRESHOLD,
        "finance_required": total_excess > FINANCE_THRESHOLD,
        "line_breakdown": breakdown,
    }