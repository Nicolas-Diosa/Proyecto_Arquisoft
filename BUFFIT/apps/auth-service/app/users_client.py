"""Cliente del Gestor de usuarios. Segun el diagrama, AuthService llega al gestor a traves del API gateway."""
from urllib.parse import quote

import requests

from .errors import ApiError

_HEADERS = {"X-Internal-Caller": "auth-service"}


def _call(cfg, method, path, **kwargs):
    try:
        return requests.request(
            method, cfg.gateway_url.rstrip("/") + path, headers=_HEADERS, timeout=cfg.request_timeout, **kwargs
        )
    except requests.RequestException:
        raise ApiError(502, "USERS_UNAVAILABLE", "El servicio de usuarios no esta disponible")


def get_by_email(cfg, email):
    r = _call(cfg, "GET", "/users/by-email/" + quote(email, safe=""))
    if r.status_code == 404:
        return None
    if r.status_code != 200:
        raise ApiError(502, "USERS_ERROR", "Respuesta inesperada del servicio de usuarios")
    return r.json()


def verify_credentials(cfg, email, password):
    r = _call(cfg, "POST", "/users/verify-credentials", json={"email": email, "password": password})
    if r.status_code in (401, 404):
        return None
    if r.status_code != 200:
        raise ApiError(502, "USERS_ERROR", "Respuesta inesperada del servicio de usuarios")
    return r.json()


def create_consumer(cfg, email, name, category):
    r = _call(cfg, "POST", "/users", json={"email": email, "name": name, "role": "CONSUMIDOR", "category": category})
    if r.status_code == 409:
        raise ApiError(409, "ACCOUNT_EXISTS", "La cuenta ya existe")
    if r.status_code not in (200, 201):
        raise ApiError(502, "USERS_ERROR", "No se pudo crear la cuenta")
    return r.json()
