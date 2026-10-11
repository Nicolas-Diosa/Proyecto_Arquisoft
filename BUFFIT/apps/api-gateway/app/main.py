from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import menu, orders, inventory
from app.config import settings

app = FastAPI(
    title="BUFF/T API Gateway",
    description="Gateway centralizador de peticiones para la plataforma BUFF/T",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(menu.router)
app.include_router(orders.router)
app.include_router(inventory.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "API Gateway (FastAPI)"}