from google.auth.transport import requests as g_requests
from google.oauth2 import id_token

from .errors import ApiError


def verify_google_token(cfg, token):
    """Valida firma, audiencia y expiracion del id_token con Google y exige el dominio institucional."""
    try:
        info = id_token.verify_oauth2_token(token, g_requests.Request(), cfg.google_client_id)
    except ValueError:
        raise ApiError(401, "INVALID_GOOGLE_TOKEN", "Token de Google invalido")
    email = (info.get("email") or "").lower()
    if not info.get("email_verified"):
        raise ApiError(401, "EMAIL_NOT_VERIFIED", "El correo de Google no esta verificado")
    # 'hd' lo firma Google; no se confia en lo que diga el cliente.
    if info.get("hd") != cfg.google_domain or not email.endswith("@" + cfg.google_domain):
        raise ApiError(403, "DOMAIN_NOT_ALLOWED", f"Solo se permiten cuentas @{cfg.google_domain}")
    return {"email": email, "name": info.get("name") or email}
