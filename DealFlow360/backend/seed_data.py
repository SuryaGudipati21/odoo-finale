import sys
from app.database.session import SessionLocal, Base, engine
from app.models.user import User, UserRole
from app.models.customer import Customer, CustomerTier
from app.models.product import Product
from app.models.discount import DiscountTierLimit, CategoryDiscountLimit
from app.models.upsell import ProductPairing
from app.core.security import hash_password

if "--reset" in sys.argv:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Database tables reset.")

db = SessionLocal()

if not ("--reset" in sys.argv) and db.query(User).filter_by(email="rep@dealflow.com").first():
    print("Seed data already present. Use 'python seed_data.py --reset' to re-seed from scratch.")
    sys.exit(0)

users = [
    User(email="rep@dealflow.com", hashed_password=hash_password("pass123"), full_name="Rep One", role=UserRole.sales_rep),
    User(email="manager@dealflow.com", hashed_password=hash_password("pass123"), full_name="Manager One", role=UserRole.sales_manager),
    User(email="finance@dealflow.com", hashed_password=hash_password("pass123"), full_name="Finance One", role=UserRole.finance),
    User(email="admin@dealflow.com", hashed_password=hash_password("pass123"), full_name="Admin One", role=UserRole.admin),
]
db.add_all(users)

customer = Customer(name="ABC Corporation", email="abc@customer.com", hashed_password=hash_password("pass123"), tier=CustomerTier.gold)
db.add(customer)

laptop = Product(name="Laptop", category="Hardware", base_price=50000, unit="unit", tax_percent=18)
bag = Product(name="Laptop Bag", category="Hardware", base_price=1500, unit="unit", tax_percent=18)
setup = Product(name="Setup Service", category="Service", base_price=5000, unit="unit", tax_percent=18)
db.add_all([laptop, bag, setup])
db.flush()

db.add_all([
    DiscountTierLimit(tier=CustomerTier.bronze, max_discount_percent=5),
    DiscountTierLimit(tier=CustomerTier.silver, max_discount_percent=10),
    DiscountTierLimit(tier=CustomerTier.gold, max_discount_percent=15),
])
db.add_all([
    CategoryDiscountLimit(category="Hardware", max_discount_percent=15),
    CategoryDiscountLimit(category="Service", max_discount_percent=10),
])
db.add(ProductPairing(base_product_id=laptop.id, suggested_product_id=bag.id, margin_delta=200, is_promoted=True))

db.commit()
print("Seed data created.")
# --- Fulfillment / Invoices / Subscriptions demo data ---
from app.models.warehouse import Warehouse, Stock, FulfillmentOrder, WarehouseAllocation, FulfillmentStatus
from app.models.invoice import Invoice, InvoiceStatus, PipelineStage
from app.models.subscription import SubscriptionPlan, BillingCycle, SubscriptionStatus
from app.models.quotation import Quotation, QuotationLine, QuotationStatus
from datetime import datetime, timedelta, timezone

main_wh = Warehouse(name="Main Warehouse")
east_wh = Warehouse(name="East Depot")
db.add_all([main_wh, east_wh])
db.flush()

db.add_all([
    Stock(warehouse_id=main_wh.id, product_id=laptop.id, qty_in_stock=40, qty_reserved=18),
    Stock(warehouse_id=east_wh.id, product_id=laptop.id, qty_in_stock=10, qty_reserved=6),
])

demo_quote = Quotation(customer_id=customer.id, created_by_id=users[0].id, status=QuotationStatus.confirmed, risk_score=8)
demo_quote.lines.append(QuotationLine(product_id=laptop.id, quantity=2, unit_price=1200, discount_percent=12))
demo_quote.lines.append(QuotationLine(product_id=setup.id, quantity=1, unit_price=450, discount_percent=18))
db.add(demo_quote)
db.flush()

order = FulfillmentOrder(quotation_id=demo_quote.id, status=FulfillmentStatus.split_pending)
db.add(order)
db.flush()
db.add_all([
    WarehouseAllocation(fulfillment_order_id=order.id, warehouse_id=main_wh.id, product_id=laptop.id, quantity=18, cost=42),
    WarehouseAllocation(fulfillment_order_id=order.id, warehouse_id=east_wh.id, product_id=laptop.id, quantity=6, cost=29),
])

plan = SubscriptionPlan(
    customer_id=customer.id, quotation_id=demo_quote.id, plan_name="Care Plan 2yr",
    cycle=BillingCycle.monthly, amount=46, next_bill_date=datetime.now(timezone.utc) + timedelta(days=10),
    status=SubscriptionStatus.active,
)
db.add(plan)
db.flush()

db.add_all([
    Invoice(invoice_number="INV-1042", quotation_id=demo_quote.id, amount=2730,
            status=InvoiceStatus.unpaid, pipeline_stage=PipelineStage.invoiced,
            due_date=datetime.now(timezone.utc) + timedelta(days=5)),
    Invoice(invoice_number="INV-1043", quotation_id=demo_quote.id, subscription_plan_id=plan.id, amount=46,
            status=InvoiceStatus.paid, pipeline_stage=PipelineStage.paid, is_recurring=True,
            due_date=datetime.now(timezone.utc) + timedelta(days=10), paid_at=datetime.now(timezone.utc)),
])

db.commit()
print("Fulfillment/Invoice/Subscription seed data created.")
