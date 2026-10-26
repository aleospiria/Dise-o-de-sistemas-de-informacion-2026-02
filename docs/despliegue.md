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

## Ubuntu Server + Cloudflare Tunnel

Cloudflare Tunnel (`cloudflared`) abre una conexión saliente desde tu servidor hacia Cloudflare. Así la app se publica con HTTPS y sin abrir puertos en el router ni en el firewall. Es gratis y requiere una cuenta de Cloudflare y un dominio gestionado en ella (`tu-dominio.example` es un marcador).

### 1. Instalar Docker y el plugin Compose en Ubuntu

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

sudo usermod -aG docker "$USER"   # cierra sesión y vuelve a entrar para aplicarlo
docker compose version
```

### 2. Clonar la rama y levantar la app

```bash
git clone --branch feature/deploy-docker <URL-DEL-REPOSITORIO> sistema-prestamos
cd sistema-prestamos
cp .env.example .env
```

Edita `.env` y deja `APP_BIND=127.0.0.1`, para que el puerto no quede accesible desde fuera del servidor:

```bash
docker compose up -d --build
curl -i http://127.0.0.1:8080/healthz
```

### 3. Crear el túnel

Hay dos formas. La **opción A** es la más simple y funciona con el servicio `cloudflared` incluido en el compose.

#### Opción A: túnel gestionado desde el panel (con token)

1. Entra al panel de Cloudflare, sección **Zero Trust** y luego **Networks > Tunnels** (el nombre exacto del menú puede variar).
2. Crea un túnel de tipo **Cloudflared** y ponle un nombre. Cloudflare muestra un token.
3. Pega el token en `.env`, sin comillas:

   ```env
   CLOUDFLARE_TUNNEL_TOKEN=<el-token-que-te-dio-cloudflare>
   ```

4. En el panel, añade un **hostname público**: dominio `tu-dominio.example`, tipo `HTTP` y URL `web:8080`. El nombre `web` es el servicio del compose y se resuelve por la red interna de Docker, por eso no hace falta publicar el puerto en el host.
5. Levanta el túnel junto con la app:

   ```bash
   docker compose --profile tunnel up -d
   docker compose --profile tunnel ps
   docker compose logs -f cloudflared     # debe indicar que la conexión quedó registrada
   ```

Abre `https://tu-dominio.example`. Sin `--profile tunnel`, el compose levanta solo la app.

#### Opción B: túnel gestionado por línea de comandos

Sirve si prefieres un archivo de configuración local. Instala `cloudflared` en el servidor (ver la [documentación de Cloudflare](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)) y ejecuta:

```bash
cloudflared tunnel login                                   # abre una URL para autorizar el dominio
cloudflared tunnel create sistema-prestamos                # crea el túnel y su archivo de credenciales
cloudflared tunnel route dns sistema-prestamos tu-dominio.example
```

Crea `~/.cloudflared/config.yml`:

```yaml
tunnel: sistema-prestamos
credentials-file: /home/<usuario>/.cloudflared/<ID-DEL-TUNEL>.json
ingress:
  - hostname: tu-dominio.example
    service: http://127.0.0.1:8080
  - service: http_status:404
```

Como `cloudflared` corre aquí en el host y no en Docker, el destino es `127.0.0.1:8080`. Por eso se deja el puerto publicado con `APP_BIND=127.0.0.1`. Para dejarlo como servicio del sistema:

```bash
sudo cloudflared service install
```

No uses la opción B junto con el perfil `tunnel` del compose: serían dos túneles distintos para la misma app.

### Seguridad del túnel

- El token da control sobre el túnel. Guárdalo solo en `.env` (ignorado por git) y revócalo desde el panel si se filtra.
- Esto no cambia las [limitaciones](#limitaciones): cualquiera con la URL puede usar la demo. Si quieres restringir el acceso, Cloudflare Access (Zero Trust) permite pedir un inicio de sesión antes de llegar a la app.

### Alternativa: Cloudflare Pages

Como la app es un sitio estático, también se puede publicar `dist/` en Cloudflare Pages sin servidor ni Docker (comando de build `npm run build`, directorio de salida `dist`, carpeta raíz `sistemas-informacion`).

| A favor | En contra |
| --- | --- |
| No hay servidor que mantener ni parchear | No demuestra el uso de Docker, que es el objetivo de esta rama |
| CDN global, HTTPS y despliegue automático desde GitHub | Las cabeceras de seguridad de `nginx.conf` no se aplican; hay que definirlas aparte (archivo `_headers`). Pages sirve `index.html` para rutas desconocidas si no existe un `404.html`, así que el fallback de la SPA no necesita configuración extra |
| Gratis para este tamaño de proyecto | Depende de que el repositorio esté conectado a Cloudflare |

## Limitaciones

Esto es una demo, no un sistema listo para producción.

- **No hay backend.** Toda la información (usuarios, recursos, préstamos) se guarda en el `localStorage` del navegador de cada persona. Los datos no se comparten entre usuarios ni entre dispositivos, y se pierden si se borra el almacenamiento del navegador.
- **La autenticación es simulada.** Los usuarios y contraseñas se validan en el navegador contra datos locales. No es segura y no debe usarse con datos reales.
- **Las cuentas de demostración son públicas.** Aparecen en la pantalla de inicio de sesión y cualquiera que abra la URL puede usarlas.
- **Las cabeceras de nginx no sustituyen un backend seguro.** Protegen contra ataques comunes del navegador, pero no controlan el acceso a los datos.

Si la URL queda expuesta en internet, conviene tratarla como una página de demostración pública.

## Nota: despliegue automático (CI)

No hay CI implementado. Si se quisiera más adelante, un flujo típico sería: al hacer push a la rama, un workflow construye la imagen, la sube a un registro (por ejemplo GHCR) y el servidor la actualiza con `docker compose pull && docker compose up -d` (por SSH o con un agente como Watchtower). Eso requiere host y credenciales del servidor, que no están en este repositorio.
