# Despliegue con Docker

Guía para publicar el sistema completo en una sola máquina con Docker Compose: frontend (React servido por nginx), API (FastAPI) y base de datos (PostgreSQL).

## Arquitectura de despliegue

```text
Navegador ──HTTPS──> Cloudflare (túnel) ──HTTP──> 127.0.0.1:8080
                                                      │
                      ┌───────────────────────────────┼──────────────── red interna de Compose
                      │                               ▼
                      │   web  (nginx, usuario nginx)   sirve la SPA y reenvía /api/ ──┐
                      │                                                                ▼
                      │   api  (FastAPI + uvicorn, usuario appuser)  :8000  (sin puerto publicado)
                      │                                                                │
                      │   db   (postgres:18-alpine)                  :5432  (sin puerto publicado)
                      └───────────────────────────────────────────────────────────────────
```

- Solo `web` publica un puerto en el host: `127.0.0.1:8080` por defecto (`APP_BIND` y `APP_PORT`).
- El navegador llama a la API por el mismo origen (`/api/v1/...`). nginx reenvía `/api/` al contenedor `api` sin cambiar la ruta, así que no hay CORS entre frontend y API.
- `api` espera a que `db` esté sano. `web` espera a que `api` esté sana.
- Los datos viven en el volumen de Docker `postgres_data`.

## Archivos

| Archivo | Para qué sirve |
| --- | --- |
| `docker-compose.yml` | Servicios `db`, `api`, `web` y `cloudflared` (opcional, perfil `tunnel`) |
| `.env.example` | Plantilla de variables. Se copia a `.env`, que no se sube a git |
| `backend/Dockerfile` | Imagen de la API: Python 3.11-slim, usuario no root, dependencias desde `pyproject.toml` |
| `backend/docker-entrypoint.sh` | Ejecuta `alembic upgrade head`, carga la semilla si `SEED_ON_STARTUP=true` y arranca uvicorn |
| `backend/.dockerignore` | Deja fuera `.env`, `.venv`, cachés y tests del build |
| `sistemas-informacion/Dockerfile` | Build en dos etapas: Node 24 compila y `nginx-unprivileged` sirve `dist/`. Recibe `VITE_API_BASE_URL` como argumento de build |
| `sistemas-informacion/nginx.conf` | SPA con fallback a `index.html`, proxy `/api/`, gzip, caché, cabeceras de seguridad y `/healthz` |

## Requisitos

- Un servidor con Docker Engine 24 o superior y el plugin Compose v2 (`docker compose version`).
- Puerto 8080 libre en el host (se puede cambiar con `APP_PORT`).
- No hace falta instalar Node, Python ni PostgreSQL en el servidor.

### Instalar Docker y Compose en Ubuntu

Resumen de la [instalación oficial](https://docs.docker.com/engine/install/ubuntu/):

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker "$USER"   # cierra la sesión y vuelve a entrar para aplicarlo
docker compose version
```

## Primera puesta en marcha

Desde la carpeta del repositorio ya clonado (la que contiene `docker-compose.yml`):

```bash
git checkout main && git pull
cp .env.example .env
```

Completa los secretos en `.env`. Estas dos líneas generan valores aleatorios y los escriben solo si la variable está vacía, así que repetirlas no pisa una contraseña ya en uso:

```bash
sed -i "s|^POSTGRES_PASSWORD=$|POSTGRES_PASSWORD=$(openssl rand -hex 24)|" .env
sed -i "s|^JWT_SECRET=$|JWT_SECRET=$(openssl rand -hex 32)|" .env
```

Revisa el resto con `nano .env` (ver [Variables](#variables-de-env)). Luego construye y levanta todo:

```bash
docker compose up -d --build
docker compose ps
```

`docker compose ps` debe mostrar `db`, `api` y `web` como `healthy`. El primer arranque tarda unos minutos porque compila el frontend y construye la imagen de la API.

Comprueba desde el servidor:

```bash
curl -i http://127.0.0.1:8080/healthz       # nginx: 200 "ok"
curl -i http://127.0.0.1:8080/api/health    # API a través del proxy: {"status":"ok"}
```

Si falta `JWT_SECRET` o `POSTGRES_PASSWORD`, cualquier comando `docker compose` se detiene con un mensaje que lo indica. Eso incluye `ps`, `logs` y `down`: el archivo `.env` tiene que existir siempre.

En Windows (PowerShell) los comandos de Compose son los mismos; para copiar la plantilla usa `Copy-Item .env.example .env` y escribe los secretos a mano: los `sed` de esta guía son para Linux, donde el archivo tiene finales de línea LF.

## Variables de `.env`

| Variable | Valor en la plantilla | Uso |
| --- | --- | --- |
| `APP_PORT` | `8080` | Puerto del host donde se publica `web` |
| `APP_BIND` | `127.0.0.1` | Dirección del host. `0.0.0.0` abre el puerto a la red |
| `VITE_API_BASE_URL` | `/api/v1` | URL de la API incrustada en el bundle (mismo origen). Si cambia, hay que reconstruir |
| `POSTGRES_DB`, `POSTGRES_USER` | `prestamos_lab`, `prestamos_app` | Base y usuario de PostgreSQL |
| `POSTGRES_PASSWORD` | vacío (obligatoria) | Contraseña de PostgreSQL |
| `JWT_SECRET` | vacío (obligatoria) | Secreto con el que se firman los tokens de sesión |
| `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES` | `HS256`, `480` | Algoritmo y vigencia de la sesión (8 horas) |
| `ENVIRONMENT` | `production` | Nombre del entorno |
| `CORS_ORIGINS` | `https://tu-dominio.example` | Orígenes que la API acepta de otros sitios, separados por comas. Con el proxy de nginx el navegador usa el mismo origen, así que solo importa si algún cliente llama a la API desde otro dominio |
| `FRONTEND_URL` | `https://tu-dominio.example` | URL base con la que la API arma el enlace de recuperación de contraseña |
| `SEED_ON_STARTUP` | `true` | Carga los datos de demostración si la base está vacía |
| `EXPOSE_RESET_TOKEN` | `false` | Si es `true`, la API devuelve el token de recuperación en la respuesta |
| `PASSWORD_RESET_EXPIRE_MINUTES` | `60` | Vigencia del token de recuperación |
| `TWO_FACTOR_CHALLENGE_MINUTES`, `TWO_FACTOR_MAX_ATTEMPTS`, `TWO_FACTOR_LOCK_MINUTES` | `5`, `3`, `15` | Vigencia del desafío 2FA, intentos permitidos y minutos de bloqueo |
| `LAB_TIMEZONE`, `LAB_OPEN_HOUR`, `LAB_CLOSE_HOUR`, `MAX_ACTIVE_LOANS` | `America/Bogota`, `7`, `20`, `3` | Reglas del laboratorio |
| `CLOUDFLARE_TUNNEL_TOKEN` | vacío | Token del túnel con nombre (solo con `--profile tunnel`) |

Evita `$` y `%` en los valores: Compose interpreta `$` y Alembic interpreta `%`. Los valores de `openssl rand -hex` solo llevan dígitos y letras `a-f`.

## Secretos: crear y rotar

- **Crear:** `openssl rand -hex 32` para `JWT_SECRET` y `openssl rand -hex 24` para `POSTGRES_PASSWORD`. Guárdalos solo en `.env` (ignorado por git).
- **Rotar `JWT_SECRET`:** cambia el valor en `.env` y ejecuta `docker compose up -d`. Compose recrea `api` y todas las sesiones abiertas dejan de ser válidas.
- **Rotar `POSTGRES_PASSWORD`:** PostgreSQL solo lee esa variable al crear el volumen por primera vez, así que cambiarla en `.env` no basta. Primero cámbiala dentro de la base, luego en `.env`:

  ```bash
  docker compose exec db psql -U prestamos_app -d prestamos_lab -c "ALTER USER prestamos_app PASSWORD 'NUEVA_CONTRASENA'"
  # edita .env con la misma contraseña y después:
  docker compose up -d
  ```

  Este procedimiento no se ejecutó en la verificación de esta guía.

## Migraciones y semilla

Cada vez que arranca el contenedor `api`, `docker-entrypoint.sh` ejecuta `alembic upgrade head`. En una base vacía crea el esquema; en una base existente solo aplica las migraciones pendientes. Si falla, el contenedor termina y `docker compose logs api` muestra el error.

Con `SEED_ON_STARTUP=true`, el mismo script ejecuta después `python -m app.db.seed`. La semilla solo inserta datos si la tabla de usuarios está vacía, así que no pisa información existente. Aun así, el script imprime «Datos iniciales cargados.» en cada arranque, también cuando no insertó nada.

Cuentas de la semilla (las mismas que figuran en `backend/README.md`):

| Correo | Contraseña | Rol |
| --- | --- | --- |
| `admin@itm.edu.co` | `Admin123` | Administrador |
| `tecnico@itm.edu.co` | `Tecnico123` | Técnico |
| `docente@itm.edu.co` | `Docente123` | Docente |
| `estudiante@itm.edu.co` | `Estudiante123` | Estudiante |

## Ver logs y estado

```bash
docker compose ps
docker compose logs -f web      # nginx
docker compose logs -f api      # migraciones, semilla y peticiones de la API
docker compose logs -f db       # PostgreSQL
docker compose logs --tail 100  # últimos 100 renglones de todos los servicios
```

## Publicar en internet con Cloudflare

Cloudflare Tunnel (`cloudflared`) abre una conexión saliente desde el servidor hacia Cloudflare. La app queda con HTTPS y sin abrir puertos en el router ni en el firewall. Con `APP_BIND=127.0.0.1`, el puerto 8080 no es accesible desde la red.

### Quick Tunnel (demostraciones, sin cuenta ni dominio)

Genera una URL `https://<palabras-al-azar>.trycloudflare.com`. Es gratis, pero la URL cambia cada vez que se recrea el contenedor del túnel y Cloudflare no da garantías de disponibilidad. El túnel apunta a `127.0.0.1:8080`, por eso el contenedor usa la red del host y `web` debe seguir publicado en `127.0.0.1:8080`:

```bash
docker run -d --name sistema-prestamos-lab-quick-tunnel --restart unless-stopped --network host \
  cloudflare/cloudflared:2026.10.3 tunnel --no-autoupdate --url http://127.0.0.1:8080

docker logs sistema-prestamos-lab-quick-tunnel 2>&1 | grep trycloudflare.com   # muestra la URL
```

Para detenerlo y eliminarlo: `docker rm -f sistema-prestamos-lab-quick-tunnel`. Este contenedor no pertenece al Compose, así que `docker compose up -d --build` no lo toca y la URL se conserva mientras no lo recrees.

Puedes cerrar la sesión SSH: los contenedores tienen `restart: unless-stopped` y siguen funcionando.

### Túnel con nombre y dominio propio (token)

Requiere una cuenta de Cloudflare y un dominio gestionado en ella (`tu-dominio.example` es un marcador).

1. En el panel de Cloudflare entra a **Zero Trust** y luego **Networks > Tunnels** (el nombre del menú puede variar). Crea un túnel de tipo **Cloudflared** y copia el token.
2. Pon el token en `.env`, sin comillas: `CLOUDFLARE_TUNNEL_TOKEN=<token>`.
3. En el panel añade un **hostname público**: dominio `tu-dominio.example`, tipo `HTTP`, URL `web:8080`. `web` se resuelve por la red interna de Docker.
4. Actualiza `CORS_ORIGINS` y `FRONTEND_URL` en `.env` con `https://tu-dominio.example`.
5. Levanta todo con el perfil `tunnel`:

   ```bash
   docker compose --profile tunnel up -d
   docker compose logs -f cloudflared     # debe indicar que la conexión quedó registrada
   ```

No uses el Quick Tunnel y el perfil `tunnel` a la vez para la misma app. El servicio `cloudflared` del compose solo se validó con `docker compose config`: probarlo exige un token real.

El token da control sobre el túnel. Revócalo desde el panel si se filtra. Si quieres pedir un inicio de sesión antes de llegar a la app, Cloudflare Access (Zero Trust) lo permite.

### Alternativas

- **Proxy inverso propio con HTTPS.** Con Caddy en el mismo servidor y `APP_BIND=127.0.0.1`:

  ```caddyfile
  tu-dominio.example {
      reverse_proxy 127.0.0.1:8080
  }
  ```

  El DNS debe apuntar al servidor y los puertos 80 y 443 deben estar abiertos.
- **Cloudflare Pages ya no sirve para este sistema.** Pages solo aloja archivos estáticos: publicaría el frontend sin la API ni la base de datos, y la app no funcionaría. Se puede usar únicamente si la API se publica aparte y se compila el frontend con `VITE_API_BASE_URL` apuntando a ella, lo que además exige configurar CORS. Esta guía no cubre ese caso.

## Datos: respaldo y restauración

Los datos están en el volumen `postgres_data`. `docker compose down` los conserva; `docker compose down -v` los borra.

Respaldo (los nombres de usuario y base son los de `.env`; aquí los valores de la plantilla):

```bash
docker compose exec -T db pg_dump -U prestamos_app --clean --if-exists prestamos_lab > respaldo-$(date +%F).sql
```

Restauración sobre la base existente. Detén la API para que no haya conexiones abiertas:

```bash
docker compose stop api
docker compose exec -T db psql -U prestamos_app -d prestamos_lab -v ON_ERROR_STOP=1 < respaldo-AAAA-MM-DD.sql
docker compose up -d api
```

El respaldo incluye la tabla de versión de Alembic, así que la API arranca con el esquema coherente. Guarda los respaldos fuera del servidor. No hay respaldo automático: se puede programar el primer comando con `cron`.

## Actualizar a una versión nueva sin perder datos

```bash
git pull
docker compose up -d --build
docker image prune -f      # opcional: borra imágenes antiguas sin uso
```

Compose reconstruye solo lo que cambió y recrea los contenedores afectados. El volumen de la base no se toca y las migraciones nuevas se aplican al arrancar `api`. Haz un respaldo antes si la actualización incluye migraciones.

### Migrar desde la versión solo frontend

Si el servidor ya corre la versión anterior (contenedores `sistema-prestamos-lab-web` y `sistema-prestamos-lab-quick-tunnel`):

```bash
cd ~/Dise-o-de-sistemas-de-informacion-2026-02     # la carpeta donde se levantó el compose
git checkout main && git pull
cp -n .env.example .env                             # no pisa un .env existente
cp .env .env.bak
grep -q '^JWT_SECRET=' .env || echo 'JWT_SECRET=' >> .env
grep -q '^POSTGRES_PASSWORD=' .env || echo 'POSTGRES_PASSWORD=' >> .env
grep -q '^SEED_ON_STARTUP=' .env || echo 'SEED_ON_STARTUP=true' >> .env
sed -i "s|^JWT_SECRET=$|JWT_SECRET=$(openssl rand -hex 32)|" .env
sed -i "s|^POSTGRES_PASSWORD=$|POSTGRES_PASSWORD=$(openssl rand -hex 24)|" .env
nano .env                                           # revisa APP_BIND=127.0.0.1 y APP_PORT=8080
docker compose up -d --build
docker compose ps
```

- **Nombres.** `web` conserva el nombre de servicio y de contenedor (`sistema-prestamos-lab-web`). Si el contenedor viejo nació de este mismo compose y esta misma carpeta, Compose lo recrea sin conflicto. Si Docker responde que el nombre ya está en uso, bórralo y repite: `docker rm -f sistema-prestamos-lab-web`.
- **Puertos.** `web` sigue en `127.0.0.1:8080`, así que el Quick Tunnel sigue apuntando al lugar correcto y su URL no cambia. `db` y `api` no publican puertos y no chocan con nada.
- **.env existente.** Un `.env` de la versión solo frontend no trae las variables nuevas. Los `grep ... || echo ...` añaden solo las que faltan y los `sed` rellenan los secretos vacíos; las demás variables tienen valores por defecto en `docker-compose.yml`. `SEED_ON_STARTUP` es la excepción: sin ella el valor por defecto del compose es `false`, la base queda vacía y no existe ningún administrador (el registro público solo crea estudiantes). Por eso el tercer `grep` la añade con `true`. Cámbiala a `false` cuando termine la demostración.
- **Datos anteriores.** En la versión solo frontend los datos vivían en el `localStorage` de cada navegador. Esos datos no se migran: la versión nueva empieza con la base de PostgreSQL (vacía o con la semilla).

## Detener y eliminar

```bash
docker compose down            # detiene y elimina contenedores y red; conserva los datos
docker compose down -v         # además BORRA el volumen con la base de datos
docker compose down --rmi local   # además borra las imágenes construidas
```

## Qué NO hacer en producción

- No dejes `EXPOSE_RESET_TOKEN=true`. La API devuelve el token de recuperación a quien lo solicite y la pantalla de «olvidé mi contraseña» muestra el enlace para continuar. Quien conozca un correo registrado puede cambiar la contraseña de esa cuenta.
- No publiques el puerto de PostgreSQL. El compose no lo hace; no añadas `ports:` al servicio `db`.
- No uses `APP_BIND=0.0.0.0` si publicas con Cloudflare o un proxy: deja el puerto accesible por HTTP sin cifrar desde la red.
- No subas `.env` ni el token de Cloudflare al repositorio. El `.gitignore` ignora `.env`; la plantilla `.env.example` lleva los secretos vacíos.
- No uses `docker compose down -v` sin haber hecho un respaldo.
- No dejes las cuentas de la semilla con sus contraseñas públicas si la URL va a estar abierta mucho tiempo (ver limitaciones).

## Limitaciones

Es un proyecto académico, no un sistema listo para producción.

- **Datos en PostgreSQL, compartidos entre usuarios.** El build desplegado usa el modo API: `main.tsx` monta la app sin repositorio de almacenamiento y todas las lecturas y escrituras van al backend (`/api/v1`). Los usuarios, recursos, préstamos y sanciones se guardan en la base del servidor y todos los usuarios ven los mismos datos. El código del modo mock con `localStorage` sigue en el repositorio, pero solo lo usan las pruebas y no se activa en producción. El navegador sí guarda en `localStorage` el token de sesión y los datos de la sesión actual.
- **Sin copias de seguridad automáticas ni alta disponibilidad.** Hay una sola base en un solo servidor. Si el disco falla y no hay respaldo, los datos se pierden.
- **Cuentas y semilla públicas.** La pantalla de inicio de sesión muestra las cuentas de demostración porque están escritas en el código del frontend, incluso con `SEED_ON_STARTUP=false`. Con la semilla cargada, cualquiera que abra la URL puede entrar como administrador. La aplicación no tiene pantalla para cambiar la contraseña estando autenticado; el único flujo de cambio es el de recuperación. Para cerrar las cuentas hay que cambiar sus contraseñas directamente en la base o borrarlas, o limitar el acceso con Cloudflare Access.
- **No se envían correos.** La recuperación de contraseña crea un token (se guarda su hash) y no lo entrega por ningún canal. Con `EXPOSE_RESET_TOKEN=false` el usuario recibe el mensaje «recibirás un enlace», pero nunca le llega, así que en la práctica la recuperación no funciona. Con `true` funciona, y es la falla de seguridad descrita arriba. Las notificaciones del sistema (por ejemplo, «el recurso ya está disponible») son registros dentro de la aplicación, no mensajes externos.
- **El 2FA es real, pero opcional.** La verificación en dos pasos usa códigos TOTP (aplicación autenticadora) y cada usuario decide si la activa. No es obligatoria para ningún rol.
- **Sin TLS propio.** nginx sirve HTTP. El cifrado lo aporta Cloudflare o el proxy inverso. Sin ellos, las contraseñas viajan en claro.
- **El Quick Tunnel es de demostración.** Su URL cambia al recrear el contenedor y no ofrece garantías.
- **Solo un contenedor de cada servicio.** No hay balanceo, ni monitoreo, ni alertas, ni CI/CD.

Si la URL queda expuesta en internet, trátala como una página de demostración pública.

## Nota: despliegue automático (CI)

No hay CI implementado. Un flujo típico sería: al hacer push a `main`, un workflow construye las imágenes, las sube a un registro (por ejemplo GHCR) y el servidor las actualiza con `docker compose pull && docker compose up -d`, por SSH o con un agente como Watchtower. Eso requiere credenciales del servidor que no están en este repositorio.
