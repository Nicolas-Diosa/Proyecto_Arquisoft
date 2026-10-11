import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Config:
    google_client_id: str
    google_domain: str
    staff_domain: str
    admin_domain: str
    jwt_secret: str
    jwt_hours: float
    gateway_url: str
    cors_origins: list
    request_timeout: float = 5.0

    @classmethod
    def from_env(cls, env=None):
        env = os.environ if env is None else env
        secret = env.get("JWT_SECRET", "")
        if len(secret) < 32:
            raise RuntimeError("JWT_SECRET debe definirse (minimo 32 caracteres)")
        return cls(
            google_client_id=env.get("GOOGLE_CLIENT_ID", ""),
            google_domain=env.get("ALLOWED_GOOGLE_DOMAIN", "unal.edu.co").lower(),
            staff_domain=env.get("STAFF_DOMAIN", "comedores.buffit.test").lower(),
            admin_domain=env.get("ADMIN_DOMAIN", "admin.buffit.test").lower(),
            jwt_secret=secret,
            jwt_hours=float(env.get("JWT_EXPIRES_HOURS", "8")),
            gateway_url=env.get("GATEWAY_URL", "http://localhost:8000"),
            cors_origins=[o.strip() for o in env.get("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()],
        )
