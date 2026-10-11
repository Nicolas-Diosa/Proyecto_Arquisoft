"""Mock del Gestor de usuarios (detras del gateway) para desarrollar AuthService sin esperar al servicio real.
Implementa el contrato de docs/CONTRATOS.md. Datos en memoria. SOLO PARA DESARROLLO.

    python dev/mock_usuarios.py        # escucha en http://localhost:5001
"""
from flask import Flask, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__)

USERS = {
    "personal.demo@comedores.buffit.test": {
        "id": 101, "email": "personal.demo@comedores.buffit.test", "name": "Personal Demo",
        "role": "PERSONAL", "status": "ACTIVO", "category": None,
        "password_hash": generate_password_hash("Personal#2026"),
    },
    "suspendido.demo@comedores.buffit.test": {
        "id": 102, "email": "suspendido.demo@comedores.buffit.test", "name": "Personal Suspendido",
        "role": "PERSONAL", "status": "SUSPENDIDO", "category": None,
        "password_hash": generate_password_hash("Suspendido#2026"),
    },
    "admin.demo@admin.buffit.test": {
        "id": 1, "email": "admin.demo@admin.buffit.test", "name": "Admin Demo",
        "role": "ADMIN", "status": "ACTIVO", "category": None,
        "password_hash": generate_password_hash("Admin#2026"),
    },
}
_next_id = [1000]


def _public(u):
    return {k: v for k, v in u.items() if k != "password_hash"}


@app.get("/users/by-email/<email>")
def by_email(email):
    u = USERS.get(email.lower())
    return (jsonify(_public(u)), 200) if u else (jsonify({"error": {"code": "NOT_FOUND"}}), 404)


@app.post("/users/verify-credentials")
def verify():
    data = request.get_json(silent=True) or {}
    u = USERS.get(str(data.get("email", "")).lower())
    if u and check_password_hash(u["password_hash"], str(data.get("password", ""))):
        return jsonify(_public(u))
    return jsonify({"error": {"code": "INVALID_CREDENTIALS"}}), 401


@app.post("/users")
def create():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).lower()
    if email in USERS:
        return jsonify({"error": {"code": "ACCOUNT_EXISTS"}}), 409
    _next_id[0] += 1
    USERS[email] = {
        "id": _next_id[0], "email": email, "name": data.get("name", ""), "role": data.get("role", "CONSUMIDOR"),
        "status": "ACTIVO", "category": data.get("category"), "password_hash": None,
    }
    return jsonify(_public(USERS[email])), 201


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "mock-usuarios"})


if __name__ == "__main__":
    app.run(port=5001, debug=True)
