def test_create_and_list_warehouse(client):
    resp = client.post("/warehouses", json={"name": "Main Warehouse", "shipping_cost_weight": 1.0})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Main Warehouse"

    resp = client.get("/warehouses")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1