from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PORT: int = 8000
    JWT_SECRET_KEY: str = "clave_secreta_super_segura_buffit"
    JWT_ALGORITHM: str = "HS256"

    MENU_SERVICE_URL: str = "http://localhost:8001"
    ORDER_SERVICE_URL: str = "http://localhost:8002"
    INVENTORY_SERVICE_URL: str = "http://localhost:8003"

    class Config:
        env_file = ".env"

settings = Settings()