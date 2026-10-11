from flask import Blueprint, current_app, g, jsonify, request

from . import users_client
from .errors import ApiError
from .google_verify import verify_google_token
from .security import decode_token, issue_token, require_auth, user_claims

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

CATEGORIES = {"ESTUDIANTE_CON_APOYO", "CARNET_SIN_APOYO", "SIN_CARNET"}


def _cfg():
    return current_app.config["BUFFIT"]


def _json():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ApiError(400, "INVALID_BODY", "Se esperaba un JSON")
    return data


def _text(data, key):
    value = data.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ApiError(400, "INVALID_BODY", f"Falta el campo '{key}'")
    return value.strip()


def _session(user, status=200):
    cfg = _cfg()
    token, seconds = issue_token(cfg, user_claims(user))
    body = {
        "access_token": token,
        "token_type": "Bearer",
        "expires_in": seconds,
        "user": {k: user.get(k) for k in ("id", "email", "name", "role", "category")},
    }
    return jsonify(body), status


def _ensure_active(user):
    if user.get("status") != "ACTIVO":
        raise ApiError(403, "ACCOUNT_SUSPENDED", "Tu cuenta esta suspendida")


@auth_bp.post("/google")
def login_google():
    """Consumidores: login con Google restringido a @unal.edu.co."""
    cfg = _cfg()
    identity = verify_google_token(cfg, _text(_json(), "id_token"))
    user = users_client.get_by_email(cfg, identity["email"])
    if user is None:
        token, seconds = issue_token(
            cfg, {"email": identity["email"], "name": identity["name"]}, purpose="register", seconds=900
        )
        return jsonify(
            {
                "needs_registration": True,
                "registration_token": token,
                "expires_in": seconds,
                "email": identity["email"],
                "name": identity["name"],
                "categories": sorted(CATEGORIES),
            }
        )
    if user.get("role") != "CONSUMIDOR":
        raise ApiError(403, "USE_STAFF_LOGIN", "Esta cuenta debe iniciar sesion con correo y contrasena")
    _ensure_active(user)
    return _session(user)


@auth_bp.post("/login")
def login_staff():
    """Personal del comedor y administradores: correo + contrasena con dominio propio."""
    cfg = _cfg()
    data = _json()
    email = _text(data, "email").lower()
    password = data.get("password")
    if not isinstance(password, str) or not password:
        raise ApiError(400, "INVALID_BODY", "Falta el campo 'password'")

    domain = email.rsplit("@", 1)[-1] if "@" in email else ""
    expected_role = {cfg.staff_domain: "PERSONAL", cfg.admin_domain: "ADMIN"}.get(domain)
    if expected_role is None:
        raise ApiError(403, "DOMAIN_NOT_ALLOWED", "Los consumidores deben iniciar sesion con Google")

    user = users_client.verify_credentials(cfg, email, password)
    if user is None:
        raise ApiError(401, "INVALID_CREDENTIALS", "Credenciales invalidas")
    if user.get("role") != expected_role:
        # el dominio debe ser coherente con el rol guardado; el rol siempre sale de la BD
        raise ApiError(401, "INVALID_CREDENTIALS", "Credenciales invalidas")
    _ensure_active(user)
    return _session(user)


@auth_bp.post("/register")
def register_consumer():
    """Segundo paso del alta de un consumidor: elige su categoria."""
    cfg = _cfg()
    data = _json()
    claims = decode_token(cfg, _text(data, "registration_token"), purpose="register")
    category = _text(data, "category")
    if category not in CATEGORIES:
        raise ApiError(400, "INVALID_CATEGORY", "Categoria invalida: " + ", ".join(sorted(CATEGORIES)))
    if users_client.get_by_email(cfg, claims["email"]) is not None:
        raise ApiError(409, "ACCOUNT_EXISTS", "La cuenta ya existe")
    user = users_client.create_consumer(cfg, claims["email"], claims.get("name", ""), category)
    return _session(user, 201)


@auth_bp.get("/me")
@require_auth
def me():
    return jsonify({"id": g.user["sub"], "email": g.user["email"], "name": g.user.get("name"), "role": g.user["role"]})


@auth_bp.post("/logout")
def logout():
    # JWT sin estado: el Portal descarta el token. (Mejora futura: lista de tokens revocados.)
    return "", 204