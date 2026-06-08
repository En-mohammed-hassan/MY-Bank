# Core Banking Simulator

Self-contained FastAPI service that simulates canonical core banking behavior: CIF master, accounts, ledger, holds, and internal transfers. Designed as the **reference implementation** for future Core Integration Service adapters (Temenos, Finacle, Mambu, etc.).

## Quick Start

```bash
docker compose up --build
```

Service runs at **http://localhost:8001**

Interactive API docs: http://localhost:8001/docs

## Verify Flow

```bash
# Health check
curl http://localhost:8001/health

# Seed demo data
curl -X POST http://localhost:8001/core/seed

# List CIF10001 accounts (note available_balance on ACC-10001-01 reflects hold)
curl http://localhost:8001/core/customers/CIF10001/accounts

# Successful internal transfer
curl -X POST http://localhost:8001/core/transfers/internal \
  -H "Content-Type: application/json" \
  -d '{"from_account":"ACC-10001-02","to_account":"ACC-10001-01","amount":"500.00","idempotency_key":"test-1","simulate":"success"}'

# Idempotent replay (same result, replay=true)
curl -X POST http://localhost:8001/core/transfers/internal \
  -H "Content-Type: application/json" \
  -d '{"from_account":"ACC-10001-02","to_account":"ACC-10001-01","amount":"500.00","idempotency_key":"test-1","simulate":"success"}'

# Insufficient funds simulation
curl -X POST http://localhost:8001/core/transfers/internal \
  -H "Content-Type: application/json" \
  -d '{"from_account":"ACC-10001-02","to_account":"ACC-10001-01","amount":"999999.00","idempotency_key":"test-insufficient","simulate":"insufficient_funds"}'
```

## Seed Data

After `POST /core/seed`:

| Entity | Details |
|--------|---------|
| **CIF10001** | Demo SME Ltd — SME, branch 001 |
| **ACC-10001-01** | CASA/CURRENT — ledger 5000, OD limit 1000, hold 200 → available 4800 |
| **ACC-10001-02** | CASA/SAVINGS — ledger 12000 |
| **ACC-10001-03** | TDA/TERM_DEPOSIT — ledger 50000 (read-only for transfers) |
| **ACC-10001-04** | OD/OVERDRAFT — ledger -500, limit 10000 |
| **CIF10002** | Partner Retail Co — ACC-10002-01 current 3000 (cross-CIF transfers) |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service health |
| POST | `/core/seed` | Reset and seed demo data |
| GET | `/core/customers/{cif}` | Customer detail |
| GET | `/core/customers/{cif}/accounts` | Accounts with balances |
| GET | `/core/accounts/{account_number}` | Account detail |
| GET | `/core/accounts/{account_number}/transactions` | Ledger (paginated, filterable) |
| GET | `/core/accounts/{account_number}/holds` | Active holds |
| POST | `/core/accounts/{account_number}/holds` | Place hold |
| POST | `/core/transfers/internal` | Execute/simulate transfer |

## Balance Rules

```
available_balance = ledger_balance - hold_amount + usable_overdraft
```

- **CURRENT with OD facility**: overdraft applies only when ledger goes below zero
- **OD accounts**: usable overdraft = min(limit, limit + ledger_balance)
- Transfers debit **available balance**, not ledger alone
- TDA and LOAN accounts are read-only for transfers in v1

## Transfer Simulation Modes

| `simulate` | Behavior |
|------------|----------|
| `auto` | Success if funds available, else `INSUFFICIENT_FUNDS` |
| `success` | Force success path (still validates funds) |
| `insufficient_funds` | Force failure with `INSUFFICIENT_FUNDS` |
| `pending` | Status `PENDING`, no balance change |
| `failed` | Status `FAILED`, reason `CORE_REJECTED` |

Idempotency: repeating the same `idempotency_key` returns the stored result without double-posting.

## Canonical → Vendor Field Mapping

Future adapters map vendor-specific fields to these canonical names. Business services never see vendor shapes.

| Canonical field | Finacle-ish | Temenos-ish | Mambu-ish |
|-----------------|-------------|-------------|-----------|
| `cif` | `CIF_ID` / customer id | `CUSTOMER.NO` | `encodedKey` / id |
| `account_number` | `FORACID` | `ACCOUNT.NO` | `id` |
| `product_category` | `SCHM_TYPE` category | `CATEGORY` | `productType` |
| `ledger_balance` | `CLR_BAL_AMT` | `WORKING.BALANCE` | `balances.principal` |
| `hold_amount` | `LIEN_AMT` | `LOCKED.AMT` | holds API |
| `txn_code` | `TRAN_PARTICULAR` / type | `TRANSACTION.CODE` | `type` |
| `idempotency_key` | custom header | custom header | `idempotencyKey` |

## Stack

- FastAPI + Uvicorn
- PostgreSQL 16 + SQLAlchemy 2.0
- Pydantic v2 (Decimal money, never float)
- Docker Compose (postgres + app on port 8001)

Schema is created via `create_all` on startup (no Alembic in v1).

## Next Step

Wire a **Core Integration Service** adapter that calls this simulator using the canonical contract (`GET /v1/customers/{cif}`, `POST /v1/transfers`, etc.).

## Environment

Copy `.env.example` to `.env` for local (non-Docker) runs:

```
DATABASE_URL=postgresql+psycopg2://core:core@localhost:5432/core_banking
APP_PORT=8001
```

Local run (requires PostgreSQL):

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```
