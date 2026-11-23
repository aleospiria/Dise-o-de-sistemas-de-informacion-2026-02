#!/bin/sh
# Prepara la base de datos y luego ejecuta el comando del contenedor (uvicorn).
set -e

echo "Aplicando migraciones (alembic upgrade head)..."
alembic upgrade head

# La semilla es idempotente: solo inserta datos si la tabla de usuarios está vacía.
if [ "$SEED_ON_STARTUP" = "true" ]; then
    echo "SEED_ON_STARTUP=true: cargando datos iniciales si la base está vacía..."
    python -m app.db.seed
fi

exec "$@"
