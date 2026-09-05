# Run once to create all tables from current models. Re-run after adding new models.
from app.database.session import Base, engine
from app.models import user, customer, product, pricing, discount  # noqa: F401 — import so Base sees them

Base.metadata.create_all(bind=engine)
print("Tables created.")