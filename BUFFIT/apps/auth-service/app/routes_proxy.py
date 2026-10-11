"""Puerta de entrada: valida el JWT y reenvia al API gateway con la identidad en cabeceras internas."""
import requests
from flask import Blueprint, Response, current_app, g, request

from .errors import ApiError
from .security import require_auth

proxy_bp = Blueprint("proxy", __name__, url_prefix="/api")

FORWARD_HEADERS = ("Content-Type", "Accept", "Accept-Language")


@proxy_bp.route("/<path:path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
@require_auth
def forward(path):
    cfg = current_app.config["BUFFIT"]
    headers = {h: request.headers[h] for h in FORWARD_HEADERS if h in request.headers}
    # Las cabeceras X-User-* SOLO las pone este servicio; las que envie el cliente se descartan.
    headers["X-User-Id"] = str(g.user["sub"])
    headers["X-User-Role"] = g.user["role"]
    headers["X-User-Email"] = g.user["email"]
    try:
        r = requests.request(
            request.method,
            f"{cfg.gateway_url.rstrip('/')}/{path}",
            params=request.args,
            data=request.get_data(),
            headers=headers,
            timeout=cfg.request_timeout * 2,
        )
    except requests.RequestException:
        raise ApiError(502, "GATEWAY_UNAVAILABLE", "El API gateway no esta disponible")
    return Response(r.content, status=r.status_code, content_type=r.headers.get("Content-Type", "application/json"))
