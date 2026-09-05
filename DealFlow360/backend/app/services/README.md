Business logic lives here (discount_risk.py, warehouse_split.py, billing.py, approval.py...).
Routes call these functions; services call the database. This is the layer both backend devs
must be able to explain line-by-line before the demo.
