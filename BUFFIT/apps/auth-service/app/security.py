import time
from functools import wraps

import jwt
from flask import current_app, g, request

from .errors import ApiError

ALGORITHM = "HS256"


def issue_token(cfg, claims, purpose="access", seconds=None):
    now = int(time.time())
    seconds = int(cfg.jwt_hours * 3600) if seconds is None else seconds
    payload = {**claims, "purpose": purpose, "iat": now, "exp": now + seconds}
    return jwt.encode(payload, cfg.jwt_secret, algorithm=ALGORITHM), seconds


def decode_token(cfg, token, purpose="access"):
    try:
        payload = jwt.decode(token, cfg.jwt_secret, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise ApiError(401, "TOKEN_EXPIRED", "La sesion expiro, inicia sesion de nuevo")
    except jwt.InvalidTokenError:
        raise ApiError(401, "INVALID_TOKEN", "Token invalido")
    if payload.get("purpose") != purpose:
        raise ApiError(401, "INVALID_TOKEN", "Token invalido para esta operacion")
    return payload


def user_claims(user):
    return {
        "sub": str(user["id"]),
        "email": user["email"],
        "name": user.get("name", ""),
        "role": user["role"],
    }


def require_auth(fn):
    """Exige un access token valido en Authorization: Bearer <jwt>. Deja los claims en g.user."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            raise ApiError(401, "MISSING_TOKEN", "Falta el token de autenticacion")
        g.user = decode_token(current_app.config["BUFFIT"], header[7:].strip())
        return fn(*args, **kwargs)

    return wrapper
