from dotenv import find_dotenv, load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

from .config import Config
from .errors import register_error_handlers
from .routes_auth import auth_bp
from .routes_proxy import proxy_bp


def create_app(config=None):
    load_dotenv(find_dotenv())  # .env de la raiz del repo (no pisa variables ya definidas)
    app = Flask(__name__)
    cfg = config or Config.from_env()
    app.config["BUFFIT"] = cfg
    CORS(app, origins=cfg.cors_origins)
    register_error_handlers(app)
    app.register_blueprint(auth_bp)
    app.register_blueprint(proxy_bp)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok", "service": "auth-service"})

    return app
