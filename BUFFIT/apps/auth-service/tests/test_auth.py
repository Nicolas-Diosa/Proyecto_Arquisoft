import pytest

from app import create_app, routes_auth, routes_proxy, users_client
from app.config import Config
from app.errors import ApiError
from app.security import issue_token

CFG = Config.from_env(
    {
        "JWT_SECRET": "secreto-de-pruebas-1234567890-abcdefghij",
        "GOOGLE_CLIENT_ID": "cid",
        "GATEWAY_URL": "http://gateway.test",
    }
)

CONSUMER = {"id": 7, "email": "ana@unal.edu.co", "name": "Ana", "role": "CONSUMIDOR", "status": "ACTIVO"}
STAFF = {"id": 101, "email": "p@comedores.buffit.test", "name": "P", "role": "PERSONAL", "status": "ACTIVO"}
ADMIN = {"id": 1, "email": "a@admin.buffit.test", "name": "A", "role": "ADMIN", "status": "ACTIVO"}


@pytest.fixture
def client():
    return create_app(CFG).test_client()


def bearer(user):
    token, _ = issue_token(CFG, {"sub": str(user["id"]), "email": user["email"], "name": user["name"], "role": user["role"]})
    return {"Authorization": f"Bearer {token}"}


def fake_google(email="ana@unal.edu.co"):
    return lambda cfg, token: {"email": email, "name": "Ana"}


# ---------- login manual (personal / admin) ----------
def test_staff_login_ok(client, monkeypatch):
    monkeypatch.setattr(users_client, "verify_credentials", lambda cfg, e, p: STAFF)
    r = client.post("/auth/login", json={"email": "P@comedores.buffit.test", "password": "x"})
    assert r.status_code == 200
    body = r.get_json()
    assert body["user"]["role"] == "PERSONAL" and body["expires_in"] == 8 * 3600
    assert client.get("/auth/me", headers={"Authorization": "Bearer " + body["access_token"]}).get_json()["role"] == "PERSONAL"


def test_admin_login_ok(client, monkeypatch):
    monkeypatch.setattr(users_client, "verify_credentials", lambda cfg, e, p: ADMIN)
    assert client.post("/auth/login", json={"email": ADMIN["email"], "password": "x"}).status_code == 200


def test_consumer_domain_cannot_use_manual_login(client):
    r = client.post("/auth/login", json={"email": "ana@unal.edu.co", "password": "x"})
    assert r.status_code == 403 and r.get_json()["error"]["code"] == "DOMAIN_NOT_ALLOWED"


def test_wrong_password(client, monkeypatch):
    monkeypatch.setattr(users_client, "verify_credentials", lambda cfg, e, p: None)
    r = client.post("/auth/login", json={"email": STAFF["email"], "password": "mal"})
    assert r.status_code == 401 and r.get_json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_domain_role_mismatch_is_rejected(client, monkeypatch):
    # correo de dominio admin pero la BD dice PERSONAL
    monkeypatch.setattr(users_client, "verify_credentials", lambda cfg, e, p: {**STAFF, "email": ADMIN["email"]})
    assert client.post("/auth/login", json={"email": ADMIN["email"], "password": "x"}).status_code == 401


def test_suspended_staff(client, monkeypatch):
    monkeypatch.setattr(users_client, "verify_credentials", lambda cfg, e, p: {**STAFF, "status": "SUSPENDIDO"})
    r = client.post("/auth/login", json={"email": STAFF["email"], "password": "x"})
    assert r.status_code == 403 and r.get_json()["error"]["code"] == "ACCOUNT_SUSPENDED"


def test_login_body_validation(client):
    assert client.post("/auth/login", json={"email": STAFF["email"]}).status_code == 400
    assert client.post("/auth/login", data="no-json").status_code == 400


# ---------- Google (consumidores) ----------
def test_google_existing_consumer(client, monkeypatch):
    monkeypatch.setattr(routes_auth, "verify_google_token", fake_google())
    monkeypatch.setattr(users_client, "get_by_email", lambda cfg, e: CONSUMER)
    r = client.post("/auth/google", json={"id_token": "t"})
    assert r.status_code == 200 and r.get_json()["user"]["role"] == "CONSUMIDOR"


def test_google_new_user_needs_registration_then_registers(client, monkeypatch):
    monkeypatch.setattr(routes_auth, "verify_google_token", fake_google("nuevo@unal.edu.co"))
    state = {"created": None}
    monkeypatch.setattr(users_client, "get_by_email", lambda cfg, e: state["created"])

    def create(cfg, email, name, category):
        state["created"] = {"id": 55, "email": email, "name": name, "role": "CONSUMIDOR", "status": "ACTIVO", "category": category}
        return state["created"]

    monkeypatch.setattr(users_client, "create_consumer", create)

    first = client.post("/auth/google", json={"id_token": "t"}).get_json()
    assert first["needs_registration"] is True and "SIN_CARNET" in first["categories"]

    bad = client.post("/auth/register", json={"registration_token": first["registration_token"], "category": "OTRA"})
    assert bad.status_code == 400

    ok = client.post("/auth/register", json={"registration_token": first["registration_token"], "category": "SIN_CARNET"})
    assert ok.status_code == 201 and ok.get_json()["user"]["email"] == "nuevo@unal.edu.co"

    again = client.post("/auth/register", json={"registration_token": first["registration_token"], "category": "SIN_CARNET"})
    assert again.status_code == 409


def test_google_staff_account_is_redirected_to_manual_login(client, monkeypatch):
    monkeypatch.setattr(routes_auth, "verify_google_token", fake_google())
    monkeypatch.setattr(users_client, "get_by_email", lambda cfg, e: {**CONSUMER, "role": "PERSONAL"})
    r = client.post("/auth/google", json={"id_token": "t"})
    assert r.status_code == 403 and r.get_json()["error"]["code"] == "USE_STAFF_LOGIN"


def test_google_suspended_consumer(client, monkeypatch):
    monkeypatch.setattr(routes_auth, "verify_google_token", fake_google())
    monkeypatch.setattr(users_client, "get_by_email", lambda cfg, e: {**CONSUMER, "status": "SUSPENDIDO"})
    assert client.post("/auth/google", json={"id_token": "t"}).status_code == 403


def test_google_domain_rejected(client, monkeypatch):
    def deny(cfg, token):
        raise ApiError(403, "DOMAIN_NOT_ALLOWED", "no")

    monkeypatch.setattr(routes_auth, "verify_google_token", deny)
    assert client.post("/auth/google", json={"id_token": "t"}).status_code == 403


def test_google_verify_domain_logic(monkeypatch):
    from app import google_verify

    def run(info):
        monkeypatch.setattr(google_verify.id_token, "verify_oauth2_token", lambda *a, **k: info)
        return google_verify.verify_google_token(CFG, "t")

    assert run({"email": "A@unal.edu.co", "email_verified": True, "hd": "unal.edu.co", "name": "A"})["email"] == "a@unal.edu.co"
    for bad in (
        {"email": "a@gmail.com", "email_verified": True, "name": "A"},
        {"email": "a@unal.edu.co", "email_verified": True, "hd": "otro.com"},
        {"email": "a@evil-unal.edu.co", "email_verified": True, "hd": "unal.edu.co"},
    ):
        with pytest.raises(ApiError) as e:
            run(bad)
        assert e.value.code == "DOMAIN_NOT_ALLOWED"
    with pytest.raises(ApiError) as e:
        run({"email": "a@unal.edu.co", "email_verified": False, "hd": "unal.edu.co"})
    assert e.value.code == "EMAIL_NOT_VERIFIED"


# ---------- tokens ----------
def test_me_requires_valid_token(client):
    assert client.get("/auth/me").status_code == 401
    assert client.get("/auth/me", headers={"Authorization": "Bearer basura"}).status_code == 401


def test_expired_token(client):
    token, _ = issue_token(CFG, {"sub": "1", "email": "x", "role": "ADMIN"}, seconds=-10)
    r = client.get("/auth/me", headers={"Authorization": "Bearer " + token})
    assert r.status_code == 401 and r.get_json()["error"]["code"] == "TOKEN_EXPIRED"


def test_registration_token_cannot_be_used_as_access_token(client):
    token, _ = issue_token(CFG, {"email": "x@unal.edu.co"}, purpose="register", seconds=60)
    assert client.get("/auth/me", headers={"Authorization": "Bearer " + token}).status_code == 401


# ---------- proxy ----------
class FakeResp:
    status_code = 200
    content = b'{"ok": true}'
    headers = {"Content-Type": "application/json"}


def test_proxy_requires_token(client):
    assert client.get("/api/inventory/c/2026-10-12/menu").status_code == 401


def test_proxy_forwards_identity_and_drops_spoofed_headers(client, monkeypatch):
    seen = {}

    def fake_request(method, url, **kw):
        seen.update(method=method, url=url, **kw)
        return FakeResp()

    monkeypatch.setattr(routes_proxy.requests, "request", fake_request)
    h = {**bearer(STAFF), "X-User-Role": "ADMIN", "X-User-Id": "999"}  # intento de suplantacion
    r = client.put("/api/inventory/c1/2026-10-12/items/arroz?x=1", json={"cantidad": 3}, headers=h)
    assert r.status_code == 200 and r.get_json() == {"ok": True}
    assert seen["url"] == "http://gateway.test/inventory/c1/2026-10-12/items/arroz"
    assert seen["method"] == "PUT" and seen["params"]["x"] == "1"
    assert seen["headers"]["X-User-Role"] == "PERSONAL" and seen["headers"]["X-User-Id"] == "101"
    assert "Authorization" not in seen["headers"]


def test_health_and_cors(client):
    assert client.get("/health").get_json()["status"] == "ok"
    r = client.options("/auth/login", headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "POST"})
    assert r.headers.get("Access-Control-Allow-Origin") == "http://localhost:3000"
