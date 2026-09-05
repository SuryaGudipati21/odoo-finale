One file per resource (auth.py, quotations.py, warehouses.py...).
Route handlers should be thin: validate input via Pydantic, call a service function, return the response schema.
No business logic here — that belongs in services/.
