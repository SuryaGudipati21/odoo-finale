import urllib.request
import urllib.error
import json

BASE = "http://localhost:8000"

print("="*60)
print("RUNNING DEALFLOW360 SECURITY & INTEGRATION VERIFICATION")
print("="*60)

# 1. Verify 401 when unauthenticated
try:
    urllib.request.urlopen(f"{BASE}/quotations")
    print("FAIL: Unauthenticated request was NOT rejected!")
    exit(1)
except urllib.error.HTTPError as e:
    assert e.code == 401, f"Expected 401, got {e.code}"
    print(f"PASS: Unauthenticated request rejected with HTTP {e.code}!")

# 2. Verify 401 when invalid token provided
try:
    req = urllib.request.Request(f"{BASE}/quotations", headers={"Authorization": "Bearer fake_garbage_token"})
    urllib.request.urlopen(req)
    print("FAIL: Garbage token was NOT rejected!")
    exit(1)
except urllib.error.HTTPError as e:
    assert e.code == 401, f"Expected 401, got {e.code}"
    print(f"PASS: Garbage token rejected with HTTP {e.code}!")

# 3. Login as admin
login_req = urllib.request.Request(
    f"{BASE}/auth/login",
    data=json.dumps({"email": "admin@dealflow.com", "password": "pass123"}).encode(),
    headers={"Content-Type": "application/json"}
)
admin_token = json.loads(urllib.request.urlopen(login_req).read().decode())["access_token"]
admin_headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
print("PASS: Admin login successful")

# 4. Test Customer creation
cust_payload = json.dumps({"name": "Helios Global Energy", "email": "contact@heliosenergy.com", "tier": "gold"}).encode()
cust_req = urllib.request.Request(f"{BASE}/customers", data=cust_payload, headers=admin_headers)
cust_res = json.loads(urllib.request.urlopen(cust_req).read().decode())
print(f"PASS: Created customer #{cust_res['id']}: {cust_res['name']} ({cust_res['tier']})")

# 5. Test Warehouse creation & list
wh_payload = json.dumps({"name": "South Logistics Depot (Austin)"}).encode()
wh_req = urllib.request.Request(f"{BASE}/fulfillment/warehouses", data=wh_payload, headers=admin_headers)
wh_res = json.loads(urllib.request.urlopen(wh_req).read().decode())
print(f"PASS: Created warehouse #{wh_res['id']}: {wh_res['name']}")

# 6. Test Discount limits update
disc_payload = json.dumps({"tiers": [{"tier": "gold", "max_discount_percent": 16.0}]}).encode()
disc_req = urllib.request.Request(f"{BASE}/discounts/limits", data=disc_payload, headers=admin_headers, method="PUT")
disc_res = json.loads(urllib.request.urlopen(disc_req).read().decode())
print("PASS: Updated discount limits successfully")

# 7. Test Deal Health
dh_req = urllib.request.Request(f"{BASE}/deal-health", headers=admin_headers)
dh_res = json.loads(urllib.request.urlopen(dh_req).read().decode())
print(f"PASS: Deal Health summary: {dh_res['summary']}")

# 8. Test Product creation
prod_payload = json.dumps({"name": "Quantum Accelerator Card", "category": "Hardware", "base_price": 4200.0, "unit": "unit", "tax_percent": 18.0}).encode()
prod_req = urllib.request.Request(f"{BASE}/products", data=prod_payload, headers=admin_headers)
prod_res = json.loads(urllib.request.urlopen(prod_req).read().decode())
print(f"PASS: Created product #{prod_res['id']}: {prod_res['name']}")

# 9. Test Quotation creation & submit as sales rep
rep_login_req = urllib.request.Request(
    f"{BASE}/auth/login",
    data=json.dumps({"email": "rep@dealflow.com", "password": "pass123"}).encode(),
    headers={"Content-Type": "application/json"}
)
rep_token = json.loads(urllib.request.urlopen(rep_login_req).read().decode())["access_token"]
rep_headers = {"Authorization": f"Bearer {rep_token}", "Content-Type": "application/json"}

q_payload = json.dumps({
    "customer_id": cust_res["id"],
    "lines": [{"product_id": prod_res["id"], "quantity": 2, "unit_price": 4200.0, "discount_percent": 5.0}]
}).encode()
q_req = urllib.request.Request(f"{BASE}/quotations", data=q_payload, headers=rep_headers)
q_res = json.loads(urllib.request.urlopen(q_req).read().decode())
print(f"PASS: Created quotation #{q_res['id']} for customer {q_res['customer_name']}, status: {q_res['status']}")

submit_req = urllib.request.Request(f"{BASE}/quotations/{q_res['id']}/submit", data=b"", headers=rep_headers)
submit_res = json.loads(urllib.request.urlopen(submit_req).read().decode())
print(f"PASS: Submitted quotation #{submit_res['id']}, status: {submit_res['status']}")

print("="*60)
print("ALL SECURITY & INTEGRATION TESTS PASSED SUCCESSFULLY!")
print("="*60)
