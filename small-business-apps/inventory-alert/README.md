# 📦 Inventory Low-Stock Alert

Checks your inventory CSV daily at 8am. Emails owner when any product drops below the threshold.

## Quick Start
```bash
cp .env.example .env
docker build -t inventory-alert .
docker run -d --env-file .env -p 8003:8003 -v $(pwd)/inventory.csv:/app/inventory.csv inventory-alert
```

## Sample `inventory.csv`
```csv
sku,product,quantity,reorder_level
SKU-001,Blue Widget,15,20
SKU-002,Red Gadget,5,10
```

## Endpoints
```
GET  /run          — check now
POST /update       — {"sku": "SKU-001", "quantity": 50}
GET  /             — health
```
API docs: http://localhost:8003/docs
