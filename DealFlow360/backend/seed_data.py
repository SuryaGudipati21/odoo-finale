# Run once after create_tables.py — gives everyone real data to test/demo against.
from app.database.session import SessionLocal
from app.models.user import User, UserRole
from app.models.customer import Customer, CustomerTier
from app.models.product import Product
from app.models.discount import DiscountTierLimit, CategoryDiscountLimit
from app.models.upsell import ProductPairing
from app.core.security import hash_password

db = SessionLocal()

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