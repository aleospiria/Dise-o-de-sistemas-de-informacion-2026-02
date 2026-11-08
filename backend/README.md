# Backend — Sistema de Préstamos de Recursos de Laboratorio

API REST construida con FastAPI, SQLAlchemy 2.0 y PostgreSQL.

## Requisitos

- Python 3.11+
- Docker (para PostgreSQL)

## Puesta en marcha

```powershell
cd backend
docker compose up -d
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
Copy-Item .env.example .env
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --reload --port 8000
```

La documentación interactiva queda en `http://localhost:8000/docs` y el
chequeo de salud en `http://localhost:8000/health`.

## Base de datos

- Contenedor: `prestamos_postgres`
- Puerto host: `5433`
- Base principal: `prestamos_lab`
- Base de pruebas: `prestamos_lab_test`

## Pruebas

```powershell
pytest
ruff check .
```
