from app.database.session import Base, engine
from app.models import user, customer, product, pricing, discount, quotation, approval, upsell, negotiation, warehouse, invoice, subscription # noqa: F401

Base.metadata.create_all(bind=engine)
print("Tables created.")