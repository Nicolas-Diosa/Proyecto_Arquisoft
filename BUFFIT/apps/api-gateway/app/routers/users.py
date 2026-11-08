from fastapi import APIRouter, Depends, Request, Response, HTTPException, status
import httpx
from app.config import settings
from app.auth import verify_jwt_token, create_access_token

router = APIRouter(prefix="/users", tags=["Gestor de Usuarios"])

# =====================================================================
# 1. RUTAS PÚBLICAS DE AUTENTICACIÓN Y REGISTRO
# =====================================================================

@router.post("/login")
async def login(request: Request):
    """
    Verifica credenciales en Gestor de Usuarios y emite el JWT directamente.
    """
    body = await request.body()
    headers = dict(request.headers)
    headers.pop("host", None)

    target_url = f"{settings.USERS_SERVICE_URL}/users/login"
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            target_url,
            content=body,
            headers=headers,
            timeout=10.0
        )

    if response.status_code != 200:
        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=dict(response.headers)
        )

    user_info = response.json()
    user_data = user_info.get("user", user_info)
    user_id = user_data.get("id") or user_data.get("_id")
    role = user_data.get("role", "Usuario")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La respuesta del Gestor de Usuarios no contiene ID"
        )

    token = create_access_token(user_id=str(user_id), role=role)

    return {
        "message": "Inicio de sesión exitoso",
        "token": token,
        "user": user_data
    }


@router.post("/register")
async def register(request: Request):
    """
    Redirige la solicitud de registro al Gestor de Usuarios.
    """
    body = await request.body()
    headers = dict(request.headers)
    headers.pop("host", None)

    target_url = f"{settings.USERS_SERVICE_URL}/users/register"

    async with httpx.AsyncClient() as client:
        response = await client.post(
            target_url,
            content=body,
            headers=headers,
            timeout=10.0
        )

    return Response(
        content=response.content,
        status_code=response.status_code,
        headers=dict(response.headers)
    )

# =====================================================================
# 2. RUTAS PROTEGIDAS
# =====================================================================

@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_users(
    path: str, 
    request: Request, 
    user_payload: dict = Depends(verify_jwt_token)
):
    """Reenvía peticiones protegidas al Gestor de Usuarios inyectando contexto (X-User-Id, X-User-Role)."""
    """Reenvía peticiones protegidas inyectando X-User-Id y X-User-Role."""
    target_url = f"{settings.USERS_SERVICE_URL}/users/{path}"
    body = await request.body()
    headers = dict(request.headers)
    headers.pop("host", None)

    headers["X-User-Id"] = str(user_payload.get("sub", ""))
    headers["X-User-Role"] = str(user_payload.get("role", "Usuario"))

    async with httpx.AsyncClient() as client:
        response = await client.request(
            method=request.method,
            url=target_url,
            headers=headers,
            params=request.query_params,
            content=body,
            timeout=10.0
        )

    return Response(
        content=response.content,
        status_code=response.status_code,
        headers=dict(response.headers)
    )