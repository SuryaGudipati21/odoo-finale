import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal, Base, engine
from app.models.user import User, UserRole
from app.models.customer import Customer, CustomerTier
from app.models.product import Product
from app.models.discount import DiscountTierLimit, CategoryDiscountLimit
from app.models.upsell import ProductPairing
from app.models.warehouse import Warehouse, Stock
from app.models.subscription import SubscriptionPlan, BillingCycle, SubscriptionStatus
from app.core.security import hash_password

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # Step 1: Users, customer, products, discount tiers, warehouses, and stock
    users = [
        User(email="rep@dealflow.com", hashed_password=hash_password("pass123"), full_name="Sales Rep One", role=UserRole.sales_rep),
        User(email="manager@dealflow.com", hashed_password=hash_password("pass123"), full_name="Sales Manager One", role=UserRole.sales_manager),
        User(email="finance@dealflow.com", hashed_password=hash_password("pass123"), full_name="Finance Officer", role=UserRole.finance),
        User(email="admin@dealflow.com", hashed_password=hash_password("pass123"), full_name="System Admin", role=UserRole.admin),
    ]
    db.add_all(users)

    customer = Customer(name="Gold Customer Inc", email="customer@gold.com", hashed_password=hash_password("pass123"), tier=CustomerTier.gold)
    db.add(customer)

    laptop = Product(name="Enterprise Laptop", category="Hardware", base_price=1000.0, unit="unit", tax_percent=18)
    service = Product(name="Setup Service", category="Service", base_price=500.0, unit="hour", tax_percent=18)
    mouse = Product(name="Wireless Mouse", category="Hardware", base_price=50.0, unit="unit", tax_percent=18)
    db.add_all([laptop, service, mouse])
    db.flush()

    db.add_all([
        DiscountTierLimit(tier=CustomerTier.bronze, max_discount_percent=5),
        DiscountTierLimit(tier=CustomerTier.silver, max_discount_percent=10),
        DiscountTierLimit(tier=CustomerTier.gold, max_discount_percent=15),
        CategoryDiscountLimit(category="Hardware", max_discount_percent=15),
        CategoryDiscountLimit(category="Service", max_discount_percent=10),
    ])

    db.add(ProductPairing(base_product_id=laptop.id, suggested_product_id=mouse.id, margin_delta=25.0, is_promoted=True))

    wh1 = Warehouse(name="Main Warehouse")
    wh2 = Warehouse(name="East Depot")
    db.add_all([wh1, wh2])
    db.flush()

    db.add_all([
        Stock(warehouse_id=wh1.id, product_id=laptop.id, qty_in_stock=10, qty_reserved=0),
        Stock(warehouse_id=wh2.id, product_id=laptop.id, qty_in_stock=10, qty_reserved=0),
    ])

    db.commit()
    db.close()
    yield


def test_hackathon_quick_flow_complete():
    # 1. Sign up / Login
    login_res = client.post("/auth/login", json={"email": "rep@dealflow.com", "password": "pass123"})
    assert login_res.status_code == 200, login_res.text
    rep_token = login_res.json()["access_token"]
    rep_headers = {"Authorization": f"Bearer {rep_token}"}

    mgr_login = client.post("/auth/login", json={"email": "manager@dealflow.com", "password": "pass123"})
    assert mgr_login.status_code == 200
    mgr_token = mgr_login.json()["access_token"]
    mgr_headers = {"Authorization": f"Bearer {mgr_token}"}

    # Verify products available
    prod_res = client.get("/products")
    assert prod_res.status_code == 200
    prods = {p["name"]: p["id"] for p in prod_res.json()}

    # 2 & 3. Create quotation with higher discount than allowed (Setup Service 18% vs limit 10%)
    # Hardware discount 12% is within Gold/Hardware 15% limit.
    # Service discount 18% exceeds Service 10% limit by 8 points.
    quote_payload = {
        "customer_id": 1,
        "lines": [
            {"product_id": prods["Enterprise Laptop"], "quantity": 15, "unit_price": 1000.0, "discount_percent": 12.0},
            {"product_id": prods["Setup Service"], "quantity": 1, "unit_price": 500.0, "discount_percent": 18.0},
        ],
    }
    quote_res = client.post("/quotations", json=quote_payload, headers=rep_headers)
    assert quote_res.status_code == 200, quote_res.text
    quote = quote_res.json()
    assert quote["status"] == "PENDING_APPROVAL"
    assert quote["risk_score"] == 8.0, f"Expected blended risk score of 8.0, got {quote['risk_score']}"

    # 4. Fetch upsell suggestions
    quote_id = quote["id"]
    upsell_res = client.get(f"/quotations/{quote_id}/upsell-suggestions", headers=rep_headers)
    assert upsell_res.status_code == 200
    suggestions = upsell_res.json()
    assert len(suggestions) > 0
    assert suggestions[0]["product_name"] == "Wireless Mouse"

    # 5. Manager reviews and approves the quotation
    approvals_res = client.get("/approvals", headers=mgr_headers)
    assert approvals_res.status_code == 200
    approvals = approvals_res.json()
    pending_approval = next(a for a in approvals if a["quotation_id"] == quote_id)
    assert pending_approval["status"] == "PENDING"

    action_res = client.post(
        f"/approvals/{pending_approval['id']}/action",
        json={"action": "approve", "reason": "Authorized by Sales Manager"},
        headers=mgr_headers,
    )
    assert action_res.status_code == 200
    assert action_res.json()["status"] == "APPROVED"

    # Verify quotation status is now APPROVED
    q_check = client.get(f"/quotations/{quote_id}", headers=rep_headers).json()
    assert q_check["status"] == "APPROVED"

    # 6 & 7. Customer portal negotiation: request higher discount
    cust_login = client.post("/auth/portal-login", json={"email": "customer@gold.com", "password": "pass123"})
    assert cust_login.status_code == 200
    cust_token = cust_login.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # Customer negotiates line discount to 25% (well above limits)
    neg_res = client.post(
        f"/quotations/{quote_id}/negotiate",
        json={"proposed_discount_percent": 25.0, "comment": "Need bulk pricing"},
        headers=cust_headers,
    )
    assert neg_res.status_code == 200
    assert neg_res.json()["status"] == "NEGOTIATION"

    # Customer confirms: should automatically route back to REAPPROVAL_REQUIRED
    confirm_res = client.post(f"/quotations/{quote_id}/confirm", headers=cust_headers)
    assert confirm_res.status_code == 200
    assert confirm_res.json()["status"] == "REAPPROVAL_REQUIRED"

    # Manager re-approves
    approvals_after = client.get("/approvals", headers=mgr_headers).json()
    new_pending = next(a for a in approvals_after if a["quotation_id"] == quote_id and a["status"] == "PENDING")
    client.post(
        f"/approvals/{new_pending['id']}/action",
        json={"action": "approve", "reason": "Re-approval confirmed"},
        headers=mgr_headers,
    )

    # Re-confirm now that manager agreed to terms
    # Customer confirms quotation, status becomes CONFIRMED and generates fulfillment & invoice
    # For test, rep or customer updates discount within acceptable limit or customer confirms acceptable quote
    # Let's create an acceptable quote to test fulfillment split across two warehouses:
    acceptable_payload = {
        "customer_id": 1,
        "lines": [
            # 15 laptops needed: WH1 has 10, WH2 has 10 -> will split across WH1 (10) and WH2 (5)
            {"product_id": prods["Enterprise Laptop"], "quantity": 15, "unit_price": 1000.0, "discount_percent": 5.0},
        ],
    }
    q2_res = client.post("/quotations", json=acceptable_payload, headers=rep_headers)
    assert q2_res.status_code == 200
    q2 = q2_res.json()
    assert q2["status"] == "APPROVED"  # 5% is within Gold/Hardware 15% ceiling!

    # Customer confirms q2
    q2_confirm = client.post(f"/quotations/{q2['id']}/confirm", headers=cust_headers)
    assert q2_confirm.status_code == 200
    assert q2_confirm.json()["status"] == "CONFIRMED"

    # 5 (continued). Confirm stock split across 2 warehouses
    fo_res = client.get("/fulfillment/orders", headers=mgr_headers)
    assert fo_res.status_code == 200
    orders = fo_res.json()
    order_for_q2 = next(o for o in orders if o["quotation_id"] == q2["id"])
    assert len(order_for_q2["allocations"]) == 2, f"Expected split across 2 warehouses, got {order_for_q2['allocations']}"
    alloc_wh1 = next(a for a in order_for_q2["allocations"] if a["warehouse_name"] == "Main Warehouse")
    alloc_wh2 = next(a for a in order_for_q2["allocations"] if a["warehouse_name"] == "East Depot")
    assert alloc_wh1["quantity"] == 10
    assert alloc_wh2["quantity"] == 5

    # Accept split and fulfill
    accept_res = client.post(f"/fulfillment/orders/{order_for_q2['id']}/accept", headers=mgr_headers)
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "FULFILLED"

    # 8. Check invoice status and record payment
    inv_res = client.get("/invoices", headers=mgr_headers)
    assert inv_res.status_code == 200
    invoices = inv_res.json()
    inv_for_q2 = next(i for i in invoices if i["customer_name"] == "Gold Customer Inc")
    assert inv_for_q2["status"] == "UNPAID"

    # Record payment
    pay_res = client.post(f"/invoices/{inv_for_q2['id']}/record-payment", headers=mgr_headers)
    assert pay_res.status_code == 200
    assert pay_res.json()["status"] == "PAID"
    assert pay_res.json()["pipeline_stage"] == "PAID"
