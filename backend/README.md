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

La documentación interactiva queda en `http://localhost:8000/docs`, la
especificación OpenAPI en `http://localhost:8000/openapi.json` y el chequeo de
salud en `http://localhost:8000/health`.

## Base de datos

- Contenedor: `prestamos_postgres`
- Puerto host: `5433`
- Base principal: `prestamos_lab`
- Base de pruebas: `prestamos_lab_test`

Credenciales de prueba creadas por `python -m app.db.seed`:

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `admin@itm.edu.co` | `Admin123` |
| Técnico | `tecnico@itm.edu.co` | `Tecnico123` |
| Estudiante | `estudiante@itm.edu.co` | `Estudiante123` |

## Formato de respuestas

Todos los endpoints devuelven un sobre uniforme:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "details": null
}
```

En errores `success` es `false`, `data` es `null` y `error` contiene el
mensaje. Los campos JSON viajan en `camelCase` aunque el backend use
`snake_case` internamente.

## Autenticación

Los endpoints protegidos requieren el encabezado:

```
Authorization: Bearer <token>
```

El login devuelve un token de acceso. Si el usuario tiene 2FA activo, devuelve
`requires2fa: true` y un `challengeToken` que debe validarse en
`POST /api/v1/auth/2fa/verify`.

Roles disponibles: `Estudiante`, `Técnico_Laboratorio` y
`Administrador_Laboratorio`.

## Endpoints principales

Prefijo base: `/api/v1`.

### Autenticación

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/auth/register` | Registro de estudiante |
| POST | `/auth/login` | Inicio de sesión |
| POST | `/auth/2fa/verify` | Validar segundo factor |
| GET | `/auth/me` | Usuario autenticado |
| POST | `/auth/2fa/setup` | Generar secreto y QR |
| POST | `/auth/2fa/enable` | Activar 2FA |
| POST | `/auth/2fa/disable` | Desactivar 2FA |
| POST | `/auth/password-reset/request` | Solicitar recuperación |
| POST | `/auth/password-reset/confirm` | Confirmar nueva contraseña |

### Usuarios

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/users` | Listar usuarios (staff) |
| GET | `/users/{user_id}` | Detalle de usuario |
| PATCH | `/users/{user_id}` | Actualizar perfil |

### Recursos

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/resources` | Listar recursos con filtros |
| POST | `/resources` | Crear recurso (staff) |
| GET | `/resources/available` | Recursos disponibles |
| GET | `/resources/{resource_id}` | Detalle |
| PATCH | `/resources/{resource_id}` | Actualizar |
| PATCH | `/resources/{resource_id}/status` | Cambiar estado |
| GET | `/resources/{resource_id}/history` | Historial de estados |
| GET | `/resources/{resource_id}/availability` | Disponibilidad por franja |
| GET | `/resources/export/csv` | Exportar inventario CSV |
| POST | `/resources/import` | Importar inventario CSV |

### Préstamos

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/loans` | Crear préstamo |
| POST | `/loans/recurring` | Crear préstamo recurrente |
| GET | `/loans` | Listar préstamos |
| GET | `/loans/my` | Préstamos del usuario |
| GET | `/loans/pending/deliveries` | Pendientes de entrega (staff) |
| GET | `/loans/pending/returns` | Pendientes de devolución (staff) |
| GET | `/loans/series/{series_id}` | Detalle de serie recurrente |
| GET | `/loans/{loan_id}` | Detalle de préstamo |
| POST | `/loans/{loan_id}/delivery` | Registrar entrega (staff) |
| POST | `/loans/{loan_id}/return` | Registrar devolución (staff) |
| POST | `/loans/{loan_id}/cancel` | Cancelar préstamo |

### Sanciones y notificaciones

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/sanctions` | Listar sanciones (staff) |
| GET | `/sanctions/me` | Sanciones del usuario |
| POST | `/sanctions/{sanction_id}/lift` | Levantar sanción (staff) |
| GET | `/notifications` | Notificaciones del usuario |
| PATCH | `/notifications/{notification_id}/read` | Marcar como leída |
| PATCH | `/notifications/read-all` | Marcar todas como leídas |
| GET | `/notifications/availability-requests` | Solicitudes de disponibilidad |
| POST | `/notifications/availability-requests` | Solicitar aviso de disponibilidad |
| DELETE | `/notifications/availability-requests/{resource_id}` | Eliminar solicitud |

### Reportes

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/dashboard` | Indicadores del panel |
| GET | `/reports/loans` | Reporte de préstamos |
| GET | `/reports/loans/csv` | Exportar reporte CSV |

## Pruebas

Las pruebas usan `prestamos_lab_test`. `tests/conftest.py` configura la base,
crea las tablas, ejecuta el seed y revierte cada prueba en una transacción.

```powershell
docker compose up -d
pytest
ruff check app tests
mypy app
```

Si la base de pruebas no existe:

```powershell
docker exec prestamos_postgres psql -U prestamos_app -d prestamos_lab -c "CREATE DATABASE prestamos_lab_test;"
```
