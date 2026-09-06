"""
seed_250.py - High-fidelity realistic sales ecosystem seeder for DealFlow360
Populates:
- 8 Users (4 core + 4 sales reps)
- 50 Customers (Enterprise/SMB across Gold, Silver, Bronze tiers)
- 30 Products (Hardware, Software, Service, Maintenance)
- 4 Warehouses with realistic multi-location stock
- 250 Quotations across all lifecycle stages with realistic lines & blended risk
- Approvals & Audit Logs (Manager, Finance reviews)
- Negotiations & line revision history
- Fulfillment Orders & Warehouse Allocations
- Invoices across order-to-cash pipeline stages
- Subscription Plans for recurring contracts
"""

import sys
import os
import random
from datetime import datetime, timedelta, timezone

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.session import SessionLocal, Base, engine
from app.models.user import User, UserRole
from app.models.customer import Customer, CustomerTier
from app.models.product import Product
from app.models.discount import DiscountTierLimit, CategoryDiscountLimit
from app.models.upsell import ProductPairing
from app.models.warehouse import Warehouse, Stock, FulfillmentOrder, WarehouseAllocation, FulfillmentStatus
from app.models.invoice import Invoice, InvoiceStatus, PipelineStage
from app.models.subscription import SubscriptionPlan, BillingCycle, SubscriptionStatus
from app.models.quotation import Quotation, QuotationLine, QuotationStatus
from app.models.approval import Approval, ApprovalLevel, ApprovalStatus, AuditLog
from app.models.negotiation import Negotiation
from app.core.security import hash_password

random.seed(42)  # Deterministic generation

def seed_database():
    print("Starting DealFlow360 250-Dataset Seeding...")
    db = SessionLocal()

    # 1. Ensure Discount Limits
    tier_limits = [
        (CustomerTier.bronze, 5.0),
        (CustomerTier.silver, 10.0),
        (CustomerTier.gold, 15.0),
    ]
    for tier, limit in tier_limits:
        if not db.query(DiscountTierLimit).filter_by(tier=tier).first():
            db.add(DiscountTierLimit(tier=tier, max_discount_percent=limit))

    cat_limits = [
        ("Hardware", 15.0),
        ("Software", 20.0),
        ("Service", 10.0),
        ("Maintenance", 12.0),
    ]
    for cat, limit in cat_limits:
        if not db.query(CategoryDiscountLimit).filter_by(category=cat).first():
            db.add(CategoryDiscountLimit(category=cat, max_discount_percent=limit))
    db.commit()

    # 2. Users (Core + Extended Reps)
    users_data = [
        ("rep@dealflow.com", "pass123", "Priya Sharma", UserRole.sales_rep),
        ("manager@dealflow.com", "pass123", "Rajesh Khanna", UserRole.sales_manager),
        ("finance@dealflow.com", "pass123", "Ananya Deshmukh", UserRole.finance),
        ("admin@dealflow.com", "pass123", "Vikram Malhotra", UserRole.admin),
        ("sarah.chen@dealflow.com", "pass123", "Sarah Chen", UserRole.sales_rep),
        ("marcus.vance@dealflow.com", "pass123", "Marcus Vance", UserRole.sales_rep),
        ("elena.rostova@dealflow.com", "pass123", "Elena Rostova", UserRole.sales_rep),
        ("david.kim@dealflow.com", "pass123", "David Kim", UserRole.sales_rep),
    ]
    users = []
    for email, pwd, name, role in users_data:
        existing = db.query(User).filter_by(email=email).first()
        if not existing:
            u = User(email=email, hashed_password=hash_password(pwd), full_name=name, role=role)
            db.add(u)
            db.flush()
            users.append(u)
        else:
            users.append(existing)
    db.commit()

    sales_reps = [u for u in users if u.role == UserRole.sales_rep]
    manager = next(u for u in users if u.role == UserRole.sales_manager)
    finance_user = next(u for u in users if u.role == UserRole.finance)

    # 3. Warehouses
    wh_names = [
        "Main Warehouse (Chicago)",
        "East Depot (New York)",
        "West Logistics Hub (San Francisco)",
        "Central Fulfillment (Dallas)",
    ]
    warehouses = []
    for name in wh_names:
        w = db.query(Warehouse).filter_by(name=name).first()
        if not w:
            w = Warehouse(name=name)
            db.add(w)
            db.flush()
        warehouses.append(w)
    db.commit()

    # 4. Products (30 items)
    products_def = [
        # Hardware
        ("Enterprise Server RX750", "Hardware", 8500.0, "unit", 18.0, "Dual-socket high-density compute rack server"),
        ("Edge AI Gateway G-20", "Hardware", 1850.0, "unit", 18.0, "Industrial rugged edge computing node"),
        ("SAN Storage Array 120TB", "Hardware", 24000.0, "unit", 18.0, "High-availability NVMe over fabric storage matrix"),
        ("Gigabit Switch 48-Port PoE+", "Hardware", 1450.0, "unit", 18.0, "Managed layer-3 rackmount enterprise switch"),
        ("Industrial Barcode Scanner", "Hardware", 420.0, "unit", 18.0, "Rugged IP65 warehouse handheld scanner"),
        ("Mobile Fleet GPS Terminal", "Hardware", 680.0, "unit", 18.0, "Vehicle telematics and route tracking module"),
        ("Workstation Pro Z4", "Hardware", 3200.0, "unit", 18.0, "Precision engineering CAD/AI desktop"),
        ("IoT Environmental Sensor Kit", "Hardware", 550.0, "kit", 18.0, "Multi-sensor temperature/humidity/vibration pack"),
        ("Thermal Label Printer X2", "Hardware", 780.0, "unit", 18.0, "High-speed automated logistics label printer"),
        ("Backup Power UPS 6kVA", "Hardware", 2900.0, "unit", 18.0, "Online double-conversion rackmount UPS"),

        # Software
        ("DealFlow360 Enterprise License", "Software", 12500.0, "license", 18.0, "Full core ERP & Quotation automation suite"),
        ("AI Predictive Pricing Module", "Software", 6800.0, "license", 18.0, "Automated margin-optimizing risk pricing engine"),
        ("Multi-Warehouse Routing Engine", "Software", 4500.0, "license", 18.0, "Smart inventory allocation & split delivery engine"),
        ("Customer Portal Self-Service Addon", "Software", 3200.0, "license", 18.0, "White-labeled negotiation & order portal"),
        ("Security Sentinel Compliance Pack", "Software", 5400.0, "license", 18.0, "SOC2/HIPAA audit trail & automated encryption"),
        ("Analytics Pro Realtime BI", "Software", 3800.0, "license", 18.0, "Executive dashboard & conversion forecasting"),
        ("API Gateway Connector Hub", "Software", 2400.0, "license", 18.0, "Pre-built connectors for SAP, Odoo, and Salesforce"),
        ("Document Automation & e-Sign", "Software", 1950.0, "license", 18.0, "One-click dynamic quotation PDF generator with audit sign"),

        # Service
        ("Enterprise Cloud Implementation", "Service", 15000.0, "engagement", 18.0, "End-to-end architecture design and configuration"),
        ("Legacy Data Migration Package", "Service", 6500.0, "package", 18.0, "Historical customer, product, and inventory ingest"),
        ("Custom ERP Workflow Scripting", "Service", 4800.0, "project", 18.0, "Tailored business logic triggers and approval chains"),
        ("Certified User Training Program", "Service", 3500.0, "session", 18.0, "Hands-on admin and sales rep certification workshops"),
        ("Executive Advisory Consulting", "Service", 7200.0, "quarter", 18.0, "Strategic pipeline velocity & margin optimization reviews"),
        ("Rapid Deployment Sprint (2-Week)", "Service", 8900.0, "sprint", 18.0, "Accelerated go-live onboarding package"),

        # Maintenance
        ("24/7 Mission-Critical Support SLA", "Maintenance", 5200.0, "year", 18.0, "15-minute response time with dedicated technical manager"),
        ("Hardware Extended Warranty 3-Year", "Maintenance", 2800.0, "contract", 18.0, "Next-business-day on-site parts replacement"),
        ("Preventive Infrastructure Tuning", "Maintenance", 1900.0, "year", 18.0, "Quarterly health checks and database vacuuming"),
        ("Firmware & Security Patching Guard", "Maintenance", 1400.0, "year", 18.0, "Automated over-the-air firmware updates and vulnerability scans"),
        ("Disaster Recovery Standby Guarantee", "Maintenance", 3600.0, "year", 18.0, "1-hour RTO cloud failover standby protection"),
        ("Annual Preventative Maintenance", "Maintenance", 1200.0, "year", 18.0, "Physical clean-down, calibration, and battery testing"),
    ]

    products = []
    for name, cat, price, unit, tax, desc in products_def:
        p = db.query(Product).filter_by(name=name).first()
        if not p:
            p = Product(name=name, category=cat, base_price=price, unit=unit, tax_percent=tax, description=desc)
            db.add(p)
            db.flush()
        products.append(p)
    db.commit()

    # Seed stock for all products across warehouses
    for p in products:
        for wh in warehouses:
            stock = db.query(Stock).filter_by(warehouse_id=wh.id, product_id=p.id).first()
            if not stock:
                qty_stock = random.randint(40, 250) if p.category == "Hardware" else 999
                qty_res = random.randint(2, 15) if p.category == "Hardware" else 0
                db.add(Stock(warehouse_id=wh.id, product_id=p.id, qty_in_stock=qty_stock, qty_reserved=qty_res))
    db.commit()

    # Product pairings for upsell
    if db.query(ProductPairing).count() < 5:
        p_server = next(p for p in products if "Server RX750" in p.name)
        p_sla = next(p for p in products if "Mission-Critical Support" in p.name)
        p_warranty = next(p for p in products if "Extended Warranty" in p.name)
        p_license = next(p for p in products if "Enterprise License" in p.name)
        p_ai = next(p for p in products if "AI Predictive Pricing" in p.name)
        p_impl = next(p for p in products if "Cloud Implementation" in p.name)

        db.add(ProductPairing(base_product_id=p_server.id, suggested_product_id=p_sla.id, margin_delta=850, is_promoted=True))
        db.add(ProductPairing(base_product_id=p_server.id, suggested_product_id=p_warranty.id, margin_delta=600, is_promoted=True))
        db.add(ProductPairing(base_product_id=p_license.id, suggested_product_id=p_ai.id, margin_delta=1400, is_promoted=True))
        db.add(ProductPairing(base_product_id=p_license.id, suggested_product_id=p_impl.id, margin_delta=3200, is_promoted=True))
        db.commit()

    # 5. Customers (50 Accounts)
    customer_companies = [
        ("Apex Global Logistics", "apexlogistics.com", CustomerTier.gold),
        ("Quantum Dynamics Corp", "quantumdynamics.io", CustomerTier.gold),
        ("Lumina Health Systems", "luminahealth.org", CustomerTier.gold),
        ("Bluebird Therapeutics", "bluebirdrx.com", CustomerTier.gold),
        ("Zenith Industrial Solutions", "zenithind.com", CustomerTier.gold),
        ("Vanguard Supply Chain", "vanguardlogistics.com", CustomerTier.gold),
        ("Orion Technologies LLC", "oriontech.co", CustomerTier.gold),
        ("Starlight Energy Group", "starlightenergy.com", CustomerTier.gold),
        ("Meridian Capital Partners", "meridiancap.com", CustomerTier.gold),
        ("Hyperion Autonomous Systems", "hyperionauto.io", CustomerTier.gold),
        ("Titan Heavy Machinery", "titanheavy.com", CustomerTier.gold),
        ("Silverline Robotics", "silverlinerobotics.com", CustomerTier.gold),

        ("Nexis Aerospace Ltd", "nexisaero.com", CustomerTier.silver),
        ("Beacon Financial Services", "beaconfin.com", CustomerTier.silver),
        ("Krypton Cloud Network", "kryptoncloud.net", CustomerTier.silver),
        ("Solstice Global Media", "solsticemedia.com", CustomerTier.silver),
        ("AeroFlight Express", "aeroflightexp.com", CustomerTier.silver),
        ("TerraForm Environmental", "terraformenv.org", CustomerTier.silver),
        ("Delta BioSciences", "deltabiosci.com", CustomerTier.silver),
        ("Optima Retail Network", "optimaretail.com", CustomerTier.silver),
        ("TrueNorth Shipping Co", "truenorthship.com", CustomerTier.silver),
        ("Crestline Industrial Tech", "crestlinetech.com", CustomerTier.silver),
        ("Synergy MedTech Labs", "synergymedtech.com", CustomerTier.silver),
        ("Summit Distribution Hub", "summitdist.com", CustomerTier.silver),
        ("Catalyst Chemical Works", "catalystchem.com", CustomerTier.silver),
        ("Pinnacle Micro-Electronics", "pinnaclemicro.com", CustomerTier.silver),
        ("Atlas Marine Logistics", "atlasmarine.com", CustomerTier.silver),
        ("Ironclad Security Systems", "ironcladsec.io", CustomerTier.silver),
        ("Stratus Data Systems", "stratusdatasys.com", CustomerTier.silver),
        ("Nova Precision Tools", "novatools.com", CustomerTier.silver),

        ("Alpha Commerce Group", "alphacommerce.com", CustomerTier.bronze),
        ("ByteWave Software", "bytewave.dev", CustomerTier.bronze),
        ("SwiftCargo Transports", "swiftcargo.net", CustomerTier.bronze),
        ("Metro Urban Delivery", "metrourban.com", CustomerTier.bronze),
        ("Precision Castings Ltd", "precisioncastings.com", CustomerTier.bronze),
        ("Aura Smart Devices", "auradevices.io", CustomerTier.bronze),
        ("Frontier Food Packaging", "frontierpackaging.com", CustomerTier.bronze),
        ("Evergreen Nursery Supply", "evergreensupply.com", CustomerTier.bronze),
        ("Matrix Print & Signage", "matrixprint.com", CustomerTier.bronze),
        ("Harbor Bay Seafoods", "harborbay.com", CustomerTier.bronze),
        ("Echo Voice Communications", "echocomms.com", CustomerTier.bronze),
        ("Trillium Office Solutions", "trilliumoffice.com", CustomerTier.bronze),
        ("Pioneer Agro Tech", "pioneeragrotech.com", CustomerTier.bronze),
        ("Breeze HVAC Services", "breezehvac.com", CustomerTier.bronze),
        ("Cascade Mountain Beverage", "cascadebev.com", CustomerTier.bronze),
        ("Omega Auto Parts", "omegaautoparts.com", CustomerTier.bronze),
        ("Vertex Digital Agency", "vertexdigital.co", CustomerTier.bronze),
        ("Horizon Paper Mill", "horizonpaper.com", CustomerTier.bronze),
        ("Kestrel Security Guards", "kestrelguards.com", CustomerTier.bronze),
        ("Falcon Fasteners Corp", "falconfasteners.com", CustomerTier.bronze),
    ]

    customers = []
    pwd_hash = hash_password("pass123")
    for name, domain, tier in customer_companies:
        email = f"contact@{domain}"
        c = db.query(Customer).filter_by(email=email).first()
        if not c:
            c = Customer(name=name, email=email, hashed_password=pwd_hash, tier=tier)
            db.add(c)
            db.flush()
        customers.append(c)
    db.commit()

    # 6. Quotations Generation (Target: Total 250 quotations)
    existing_count = db.query(Quotation).count()
    quotes_needed = 250 - existing_count
    print(f"Existing quotations in DB: {existing_count}. Generating {max(0, quotes_needed)} new realistic quotations...")

    stages_distribution = (
        [QuotationStatus.draft] * 45 +
        [QuotationStatus.pending_approval] * 40 +
        [QuotationStatus.approved] * 45 +
        [QuotationStatus.sent_to_customer] * 30 +
        [QuotationStatus.negotiation] * 30 +
        [QuotationStatus.reapproval_required] * 20 +
        [QuotationStatus.confirmed] * 20 +
        [QuotationStatus.fulfillment] * 10 +
        [QuotationStatus.completed] * 10
    )
    random.shuffle(stages_distribution)

    now = datetime.now(timezone.utc)

    for i in range(quotes_needed):
        status = stages_distribution[i % len(stages_distribution)]
        customer = random.choice(customers)
        rep = random.choice(sales_reps)

        # Date spread over past 90 days
        days_ago = random.randint(1, 90)
        created_dt = now - timedelta(days=days_ago, hours=random.randint(1, 23), minutes=random.randint(1, 59))

        if status in (QuotationStatus.draft, QuotationStatus.sent_to_customer):
            base_discount_range = (0.0, 8.0) if customer.tier == CustomerTier.bronze else (2.0, 14.0)
        elif status in (QuotationStatus.pending_approval, QuotationStatus.reapproval_required):
            base_discount_range = (16.0, 26.0)
        elif status in (QuotationStatus.negotiation,):
            base_discount_range = (12.0, 22.0)
        else:
            base_discount_range = (5.0, 15.0)

        quote = Quotation(
            customer_id=customer.id,
            created_by_id=rep.id,
            status=status,
            risk_score=0.0,
            created_at=created_dt,
            updated_at=created_dt + timedelta(hours=random.randint(1, 48)),
        )

        num_lines = random.choices([1, 2, 3, 4], weights=[25, 45, 20, 10])[0]
        selected_prods = random.sample(products, num_lines)

        quote_total = 0.0
        max_disc = 0.0

        for prod in selected_prods:
            qty = random.randint(1, 6) if prod.category in ("Software", "Service") else random.randint(2, 25)
            disc = round(random.uniform(*base_discount_range), 1)
            max_disc = max(max_disc, disc)
            line = QuotationLine(
                product_id=prod.id,
                quantity=qty,
                unit_price=prod.base_price,
                discount_percent=disc,
            )
            quote.lines.append(line)
            quote_total += qty * prod.base_price * (1.0 - disc / 100.0)

        tier_ceiling = 15.0 if customer.tier == CustomerTier.gold else 10.0 if customer.tier == CustomerTier.silver else 5.0
        excess = max(0.0, max_disc - tier_ceiling)
        quote.risk_score = round(min(25.0, excess * 1.5 + (random.uniform(0.5, 3.0) if max_disc > 0 else 0.0)), 1)

        db.add(quote)
        db.flush()

        db.add(AuditLog(
            quotation_id=quote.id,
            user_id=rep.id,
            action="created",
            reason=f"Quotation initialized with {len(quote.lines)} line item(s)",
            created_at=created_dt,
        ))

        if status == QuotationStatus.pending_approval:
            mgr_app = Approval(
                quotation_id=quote.id,
                level=ApprovalLevel.manager,
                status=ApprovalStatus.pending,
                created_at=created_dt + timedelta(minutes=15),
            )
            db.add(mgr_app)
            if quote.risk_score >= 12.0 or max_disc >= 18.0:
                fin_app = Approval(
                    quotation_id=quote.id,
                    level=ApprovalLevel.finance,
                    status=ApprovalStatus.pending,
                    created_at=created_dt + timedelta(minutes=15),
                )
                db.add(fin_app)

        elif status == QuotationStatus.reapproval_required:
            db.add(Approval(
                quotation_id=quote.id,
                level=ApprovalLevel.manager,
                status=ApprovalStatus.revision_requested,
                reviewed_by_id=manager.id,
                reason="Client requested additional discount on enterprise line; please confirm margin.",
                created_at=created_dt + timedelta(hours=2),
                reviewed_at=created_dt + timedelta(hours=5),
            ))
            db.add(AuditLog(
                quotation_id=quote.id,
                user_id=manager.id,
                action="revision_requested",
                reason="Excess discount requires executive adjustment",
                created_at=created_dt + timedelta(hours=5),
            ))

        elif status in (QuotationStatus.approved, QuotationStatus.sent_to_customer):
            approved_time = created_dt + timedelta(hours=random.randint(2, 24))
            db.add(Approval(
                quotation_id=quote.id,
                level=ApprovalLevel.manager,
                status=ApprovalStatus.approved,
                reviewed_by_id=manager.id,
                reason="Discount matches quarterly sales target threshold.",
                created_at=created_dt + timedelta(minutes=20),
                reviewed_at=approved_time,
            ))
            if quote.risk_score >= 10.0:
                db.add(Approval(
                    quotation_id=quote.id,
                    level=ApprovalLevel.finance,
                    status=ApprovalStatus.approved,
                    reviewed_by_id=finance_user.id,
                    reason="Finance margin clearance approved.",
                    created_at=created_dt + timedelta(minutes=20),
                    reviewed_at=approved_time + timedelta(hours=1),
                ))
            db.add(AuditLog(
                quotation_id=quote.id,
                user_id=manager.id,
                action="approved",
                reason="Approved for customer delivery",
                created_at=approved_time,
            ))

        elif status == QuotationStatus.negotiation:
            first_line = quote.lines[0]
            counter_disc = round(first_line.discount_percent + random.uniform(3.0, 7.0), 1)
            db.add(Negotiation(
                quotation_id=quote.id,
                quotation_line_id=first_line.id,
                comment=f"Customer requested {counter_disc}% discount in exchange for multi-year commitment.",
                proposed_discount_percent=counter_disc,
                created_at=created_dt + timedelta(days=1),
            ))
            db.add(AuditLog(
                quotation_id=quote.id,
                user_id=rep.id,
                action="negotiation_opened",
                reason="Client counter-offer under negotiation review",
                created_at=created_dt + timedelta(days=1),
            ))

        elif status in (QuotationStatus.confirmed, QuotationStatus.fulfillment, QuotationStatus.completed):
            db.add(Approval(
                quotation_id=quote.id,
                level=ApprovalLevel.manager,
                status=ApprovalStatus.approved,
                reviewed_by_id=manager.id,
                reason="Approved and closed deal.",
                created_at=created_dt + timedelta(hours=1),
                reviewed_at=created_dt + timedelta(hours=4),
            ))
            db.add(AuditLog(
                quotation_id=quote.id,
                user_id=rep.id,
                action="order_confirmed",
                reason="Signed purchase order received from client",
                created_at=created_dt + timedelta(days=2),
            ))

            f_status = (
                FulfillmentStatus.fulfilled if status == QuotationStatus.completed
                else FulfillmentStatus.split_pending
            )
            order = FulfillmentOrder(quotation_id=quote.id, status=f_status)
            db.add(order)
            db.flush()

            hw_lines = [l for l in quote.lines if l.product and l.product.category == "Hardware"]
            if hw_lines:
                for hl in hw_lines:
                    q1 = hl.quantity // 2
                    q2 = hl.quantity - q1
                    w1, w2 = warehouses[0], warehouses[1]
                    db.add(WarehouseAllocation(fulfillment_order_id=order.id, warehouse_id=w1.id, product_id=hl.product_id, quantity=max(1, q1), cost=round(hl.product.base_price * 0.05, 2)))
                    if q2 > 0:
                        db.add(WarehouseAllocation(fulfillment_order_id=order.id, warehouse_id=w2.id, product_id=hl.product_id, quantity=q2, cost=round(hl.product.base_price * 0.04, 2)))

            inv_number = f"INV-{1000 + quote.id}"
            is_paid = (status == QuotationStatus.completed)
            inv_status = InvoiceStatus.paid if is_paid else InvoiceStatus.unpaid
            p_stage = (
                PipelineStage.paid if is_paid
                else PipelineStage.shipped if status == QuotationStatus.fulfillment
                else PipelineStage.invoiced
            )
            due_date = created_dt + timedelta(days=30)
            paid_dt = created_dt + timedelta(days=12) if is_paid else None

            inv = Invoice(
                invoice_number=inv_number,
                quotation_id=quote.id,
                amount=round(quote_total, 2),
                status=inv_status,
                pipeline_stage=p_stage,
                due_date=due_date,
                paid_at=paid_dt,
                created_at=created_dt + timedelta(days=3),
            )
            db.add(inv)

            maint_lines = [l for l in quote.lines if l.product and l.product.category in ("Maintenance", "Software")]
            if maint_lines and random.random() > 0.3:
                sub_plan = SubscriptionPlan(
                    customer_id=customer.id,
                    quotation_id=quote.id,
                    plan_name=f"Enterprise {maint_lines[0].product.name} Retainer",
                    cycle=random.choice([BillingCycle.monthly, BillingCycle.quarterly, BillingCycle.yearly]),
                    amount=round(maint_lines[0].unit_price * 0.1, 2) if maint_lines[0].unit_price > 5000 else round(maint_lines[0].unit_price, 2),
                    next_bill_date=now + timedelta(days=random.randint(5, 60)),
                    status=SubscriptionStatus.active,
                    created_at=created_dt + timedelta(days=3),
                )
                db.add(sub_plan)
                db.flush()

                db.add(Invoice(
                    invoice_number=f"REC-{1000 + quote.id}",
                    quotation_id=quote.id,
                    subscription_plan_id=sub_plan.id,
                    amount=sub_plan.amount,
                    status=InvoiceStatus.paid if is_paid else InvoiceStatus.unpaid,
                    pipeline_stage=PipelineStage.paid if is_paid else PipelineStage.invoiced,
                    is_recurring=True,
                    due_date=now + timedelta(days=15),
                    paid_at=now - timedelta(days=2) if is_paid else None,
                    created_at=now - timedelta(days=15),
                ))

        if (i + 1) % 50 == 0:
            db.commit()
            print(f"Committed {i + 1}/{quotes_needed} quotations...")

    db.commit()

    total_quotes = db.query(Quotation).count()
    total_cust = db.query(Customer).count()
    total_prod = db.query(Product).count()
    total_app = db.query(Approval).count()
    total_inv = db.query(Invoice).count()
    total_ful = db.query(FulfillmentOrder).count()
    total_sub = db.query(SubscriptionPlan).count()
    total_users = db.query(User).count()

    print("\n" + "="*50)
    print("DealFlow360 Database Seeding Completed Successfully!")
    print("="*50)
    print(f"Total Users:              {total_users}")
    print(f"Total Customers:          {total_cust}")
    print(f"Total Products:           {total_prod}")
    print(f"Total Quotations:         {total_quotes}")
    print(f"Total Approvals:          {total_app}")
    print(f"Total Invoices:           {total_inv}")
    print(f"Total Fulfillment Orders: {total_ful}")
    print(f"Total Subscription Plans: {total_sub}")
    print("="*50)

    db.close()

if __name__ == "__main__":
    seed_database()
