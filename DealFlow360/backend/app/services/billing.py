from datetime import datetime, timedelta

CYCLE_DAYS = {"MONTHLY": 30, "QUARTERLY": 90, "YEARLY": 365}


def next_billing_date(cycle: str, from_date: datetime = None) -> datetime:
    from_date = from_date or datetime.utcnow()
    return from_date + timedelta(days=CYCLE_DAYS[cycle])


def prorate(full_price: float, cycle: str, days_remaining: int) -> float:
    """Charge only for the remaining days in the current cycle."""
    total_days = CYCLE_DAYS[cycle]
    return round(full_price * (days_remaining / total_days), 2)