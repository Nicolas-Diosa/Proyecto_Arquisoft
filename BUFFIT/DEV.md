# Guía de desarrollo (AuthService + Gestor de inventario)

Requisitos: Python 3.12, Docker Desktop. Los comandos son de PowerShell (en Linux/macOS cambia `.\venv\Scripts\Activate.ps1` por `source venv/bin/activate`).

**Todos los comandos se ejecutan desde la carpeta `BUFFIT`** (la que contiene `apps`, `proto` y `docker-compose.yml`).
Si PowerShell no deja activar el entorno virtual, ejecuta una vez: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## 0. Una sola vez

```powershell
copy .env.example .env      # y edita .env: JWT_SECRET (>= 32 caracteres), GOOGLE_CLIENT_ID, POSTGRES_PASSWORD
docker compose up -d        # levanta SOLO las 3 bases de datos
```

El `.env` está en `.gitignore`: **nunca se sube**. Los servicios lo leen solos (buscan el `.env` de la raíz del repo).

## 1. AuthService (puerto 5000)

```powershell
cd apps\auth-service
python -m venv venv ; .\venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
pytest                                   # 19 pruebas
python dev\mock_usuarios.py              # terminal aparte: mock del Gestor de usuarios en :5001
flask --app wsgi run --port 5000 --debug # con GATEWAY_URL=http://localhost:5001 en .env
```

Probar el login manual (usuario de prueba del mock):

```powershell
$body = @{ email = "personal.demo@comedores.buffit.test"; password = "Personal#2026" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:5000/auth/login -ContentType "application/json" -Body $body
```

Usuarios del mock: `personal.demo@comedores.buffit.test` / `Personal#2026`, `admin.demo@admin.buffit.test` / `Admin#2026`, `suspendido.demo@comedores.buffit.test` / `Suspendido#2026`.

### Google
1. En Google Cloud Console crea un *OAuth client ID* de tipo **Web** y agrega `http://localhost:3000` como origen autorizado.
2. Pon el Client ID en `GOOGLE_CLIENT_ID` del `.env` (el Portal usa el mismo).
3. Si la pantalla de consentimiento está en modo "Testing", solo entran las cuentas que agregues como usuarios de prueba. La validación de `@unal.edu.co` se hace en el servidor.

## 2. Gestor de inventario (REST :5003, gRPC :50051)

```powershell
cd apps\gestor-inventario
python -m venv venv ; .\venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
python generate_proto.py                 # genera los stubs gRPC (no se suben a git)
pytest                                   # 22 pruebas (usan mongomock, no necesitan Mongo)
python seed.py                           # menu de ejemplo de hoy en Mongo (docker compose up -d antes)
flask --app wsgi run --port 5003 --debug # REST
python -m app.grpc_server                # gRPC, en otra terminal
```

Probar sin gateway (simulando las cabeceras que pondría AuthService):

```powershell
$fecha = (Get-Date).ToString("yyyy-MM-dd")
Invoke-RestMethod "http://localhost:5003/inventory/comedor-central/$fecha/menu" `
  -Headers @{ "X-User-Id" = "7"; "X-User-Role" = "CONSUMIDOR" } | ConvertTo-Json -Depth 6
```

## 3. Todo en Docker

```powershell
docker compose --profile services up --build
```

Levanta las bases de datos, `auth-service` y `gestor-inventario` (REST + gRPC). Los servicios de tus compañeros se suman al `docker-compose.yml` cuando existan.

## 4. Notas

* **GraphQL → MongoDB:** MongoDB no habla GraphQL, así que el Gestor accede a la base mediante una capa GraphQL (`app/graphql_layer`, Ariadne) que traduce a pymongo. Por defecto corre dentro del mismo proceso; con `GRAPHQL_URL` se puede consumir por HTTP (`python -m app.graphql_layer.server`).
* **Separar contenedores:** cada carpeta de `apps/` ya tiene su propio `requirements.txt` y no comparte código con las demás; separarlos es agregar un servicio al compose.
* **Antes de subir al repo del curso:** revisa que no haya `.env`, y copia el contenido del repo (README, imágenes y carpeta `BUFFIT`) con `robocopy ... /XD .git venv node_modules __pycache__ /XF .env`.
