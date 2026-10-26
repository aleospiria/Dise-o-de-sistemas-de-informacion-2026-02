# Despliegue con Docker

Guía para publicar el frontend (demo) en un contenedor. La imagen compila la app con Node y la sirve con nginx como usuario no root.

> Esta rama (`feature/deploy-docker`) es un extra del proyecto. No forma parte de la entrega académica en `main`.

## Archivos

| Archivo | Para qué sirve |
| --- | --- |
| `sistemas-informacion/Dockerfile` | Build en dos etapas: `node:24-alpine` compila, `nginx-unprivileged:1.28-alpine` sirve `dist/` |
| `sistemas-informacion/nginx.conf` | SPA con fallback a `index.html`, gzip, caché, cabeceras de seguridad y `/healthz` |
| `sistemas-informacion/.dockerignore` | Deja fuera `node_modules`, `dist`, `.env*`, logs, etc. |
| `docker-compose.yml` | Servicio `web` (y `cloudflared` opcional). Está en la raíz del repo |
| `.env.example` | Plantilla de variables. Se copia a `.env` (que no se sube a git) |

## Requisitos

- Docker Engine 24 o superior con el plugin Compose v2 (`docker compose version`).
- Puerto libre en el host (por defecto 8080).

## Construir y ejecutar

Desde la raíz del repositorio:

```bash
docker compose up -d --build
```

Abre `http://localhost:8080`. Las rutas como `/dashboard` o `/loans/my` funcionan también al recargar la página.

## Cambiar el puerto

Copia la plantilla y edita el valor:

```bash
cp .env.example .env
# edita APP_PORT=8080 por el puerto que quieras
docker compose up -d
```

También funciona en una sola línea: `APP_PORT=9090 docker compose up -d`.

`APP_BIND` define en qué dirección se publica el puerto. El valor por defecto (`0.0.0.0`) lo deja accesible desde la red. Con `127.0.0.1` solo se accede desde la propia máquina, que es lo recomendable detrás de un proxy inverso o del túnel de Cloudflare.

## Verificar salud y ver logs

```bash
curl -i http://localhost:8080/healthz      # responde 200 "ok"
docker compose ps                           # el estado debe ser "healthy"
docker compose logs -f web                  # logs de nginx
```

## Actualizar a una versión nueva

```bash
git pull
docker compose up -d --build
docker image prune -f                       # opcional: borra imágenes antiguas sin uso
```

## Detener y eliminar

```bash
docker compose down            # detiene y elimina el contenedor
docker compose down --rmi local  # además borra la imagen construida
```

## Proxy inverso con HTTPS (ejemplo)

Ejemplo mínimo con Caddy en el mismo servidor, que obtiene el certificado automáticamente. Es solo una referencia: `tu-dominio.example` es un marcador.

Ejecuta la app con `APP_BIND=127.0.0.1` y crea este `Caddyfile`:

```caddyfile
tu-dominio.example {
    reverse_proxy 127.0.0.1:8080
}
```

El DNS de `tu-dominio.example` debe apuntar al servidor y los puertos 80 y 443 deben estar abiertos. Si prefieres no abrir puertos, usa el túnel de Cloudflare descrito más abajo.

## Limitaciones

Esto es una demo, no un sistema listo para producción.

- **No hay backend.** Toda la información (usuarios, recursos, préstamos) se guarda en el `localStorage` del navegador de cada persona. Los datos no se comparten entre usuarios ni entre dispositivos, y se pierden si se borra el almacenamiento del navegador.
- **La autenticación es simulada.** Los usuarios y contraseñas se validan en el navegador contra datos locales. No es segura y no debe usarse con datos reales.
- **Las cuentas de demostración son públicas.** Aparecen en la pantalla de inicio de sesión y cualquiera que abra la URL puede usarlas.
- **Las cabeceras de nginx no sustituyen un backend seguro.** Protegen contra ataques comunes del navegador, pero no controlan el acceso a los datos.

Si la URL queda expuesta en internet, conviene tratarla como una página de demostración pública.

## Nota: despliegue automático (CI)

No hay CI implementado. Si se quisiera más adelante, un flujo típico sería: al hacer push a la rama, un workflow construye la imagen, la sube a un registro (por ejemplo GHCR) y el servidor la actualiza con `docker compose pull && docker compose up -d` (por SSH o con un agente como Watchtower). Eso requiere host y credenciales del servidor, que no están en este repositorio.
