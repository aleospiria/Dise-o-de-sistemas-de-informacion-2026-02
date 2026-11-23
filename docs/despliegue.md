# Despliegue con Docker

Despliega el sistema completo en una sola máquina: frontend React, API FastAPI y PostgreSQL. Todo se levanta con un solo `docker compose up -d --build`.

La rama `feature/deploy-docker` contiene la configuración de despliegue; el código funcional está sincronizado con `main`.

## Archivos

| Archivo | Para qué sirve |
| --- | --- |
| `backend/Dockerfile` | Imagen de la API con Python 3.11 y usuario no root |
| `backend/.dockerignore` | Excluye entornos, cachés, tests y archivos locales del build |
| `sistemas-informacion/Dockerfile` | Build en dos etapas: Node 24 compila y nginx sirve `dist/` |
| `sistemas-informacion/nginx.conf` | SPA con fallback, gzip, cabeceras de seguridad y proxy `/api` |
| `sistemas-informacion/.dockerignore` | Excluye `node_modules`, `dist`, `.env*`, logs, etc. |
| `docker-compose.yml` | Servicios `postgres`, `api`, `web` y `cloudflared` opcional |
| `.env.example` | Plantilla de variables; copiar a `.env` |

## Requisitos

- Docker Engine 24 o superior con Compose v2 (`docker compose version`).
- Puerto libre en el host para la app: 8080 por defecto.
- Puerto libre para PostgreSQL: 5433 por defecto. Se puede cambiar con `POSTGRES_PORT`.

No necesitas Node, Python ni PostgreSQL instalados en la máquina de destino.

## Primera puesta en marcha

Desde una carpeta nueva:

```bash
git clone --branch feature/deploy-docker <URL-DEL-REPOSITORIO> sistema-prestamos
cd sistema-prestamos
cp .env.example .env
```

En Windows:

```powershell
copy .env.example .env
```

Antes de levantar, cambia al menos `JWT_SECRET` y `POSTGRES_PASSWORD` en `.env`. Luego:

```bash
docker compose up -d --build
```

El primer arranque espera a PostgreSQL, ejecuta `alembic upgrade head`, carga los datos iniciales con `python -m app.db.seed` y levanta la API. La semilla es idempotente: si ya hay usuarios, no vuelve a insertar nada.

Abre `http://localhost:8080`.

## Cuentas iniciales

| Correo | Contraseña | Rol |
| --- | --- | --- |
| `admin@itm.edu.co` | `Admin123` | Administrador |
| `tecnico@itm.edu.co` | `Tecnico123` | Técnico |
| `docente@itm.edu.co` | `Docente123` | Docente |
| `estudiante@itm.edu.co` | `Estudiante123` | Estudiante |

El token de recuperación de contraseña se muestra en la consola de la API porque `EXPOSE_RESET_TOKEN=true`. Para producción, cambia ese valor a `false`.

## Verificación

```bash
curl -i http://localhost:8080/healthz
curl -i http://localhost:8080/api/health
docker compose ps
docker compose logs -f api
docker compose logs -f web
```

`/healthz` responde `ok` desde nginx. `/api/health` responde `{"status":"ok"}` desde la API a través del proxy. Todos los servicios deben aparecer como `healthy` o `running`.

## Variables principales

| Variable | Valor por defecto | Uso |
| --- | --- | --- |
| `APP_PORT` | `8080` | Puerto donde se publica la app |
| `APP_BIND` | `0.0.0.0` | Dirección de escucha del host |
| `VITE_API_BASE_URL` | `/api/v1` | URL base de la API compilada en el frontend |
| `POSTGRES_DB` | `prestamos_lab` | Base de datos |
| `POSTGRES_USER` | `prestamos_app` | Usuario de la BD |
| `POSTGRES_PASSWORD` | `prestamos_dev_password` | Contraseña de la BD |
| `POSTGRES_BIND` | `127.0.0.1` | Exposición de PostgreSQL en el host |
| `POSTGRES_PORT` | `5433` | Puerto de PostgreSQL en el host |
| `JWT_SECRET` | valor de ejemplo | Secreto de firmado de tokens |
| `CORS_ORIGINS` | `http://localhost:8080` | Orígenes permitidos por la API |
| `CLOUDFLARE_TUNNEL_TOKEN` | vacío | Token del túnel opcional |

`VITE_API_BASE_URL` se incorpora al bundle durante el build. El valor `/api/v1` hace que el navegador llame a la API por el mismo origen y nginx la redirija al contenedor `api`. Si cambias este valor, rebuild con `docker compose up -d --build`.

Si publicas la app en otro dominio, actualiza `CORS_ORIGINS` y `FRONTEND_URL` con ese origen.

## Cambiar el puerto

Edita `.env` y vuelve a levantar:

```bash
APP_PORT=9090 docker compose up -d
```

También puedes editar `APP_PORT=9090` directamente en `.env`.

`APP_BIND=127.0.0.1` limita el acceso a la propia máquina. Es lo recomendable cuando usas un proxy inverso o Cloudflare Tunnel.

## Proxy inverso con HTTPS

Con Caddy en el mismo servidor:

```caddyfile
tu-dominio.example {
    reverse_proxy 127.0.0.1:8080
}
```

El DNS debe apuntar al servidor y los puertos 80 y 443 deben estar abiertos. Levanta la app con `APP_BIND=127.0.0.1`.

## Cloudflare Tunnel

El perfil `tunnel` publica la app con HTTPS sin abrir puertos.

1. Crea un túnel en Cloudflare Zero Trust > Networks > Tunnels y copia el token.
2. Pon el token en `.env` como `CLOUDFLARE_TUNNEL_TOKEN=<token>`.
3. Añade un hostname público HTTP apuntando a `web:8080`.
4. Levanta todo con:

```bash
docker compose --profile tunnel up -d
docker compose logs -f cloudflared
```

Si usas `cloudflared` instalado en el host en vez del perfil, el destino del ingress debe ser `http://127.0.0.1:8080` y conviene dejar `APP_BIND=127.0.0.1`.

## Datos y actualizaciones

Los datos de PostgreSQL viven en el volumen `postgres_data`.

```bash
docker compose down
docker compose up -d
docker compose down -v
```

`down` conserva los datos. `down -v` borra el volumen y vuelve a cargar la semilla en el próximo arranque.

Para actualizar a una versión nueva:

```bash
git pull
docker compose up -d --build
docker image prune -f
```

## Seguridad

- Cambia `JWT_SECRET` y `POSTGRES_PASSWORD` antes de publicar.
- Las cuentas de demostración son públicas y están en la guía; cámbialas o desactívalas si la URL queda expuesta.
- `EXPOSE_RESET_TOKEN=true` es solo para demostración.
- No hay CI/CD ni respaldo automático de la base de datos.
