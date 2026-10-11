from flask import jsonify


class ApiError(Exception):
    def __init__(self, status, code, message):
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message


def register_error_handlers(app):
    @app.errorhandler(ApiError)
    def _api_error(e):
        return jsonify({"error": {"code": e.code, "message": e.message}}), e.status

    @app.errorhandler(404)
    def _not_found(_):
        return jsonify({"error": {"code": "NOT_FOUND", "message": "Ruta no encontrada"}}), 404

    @app.errorhandler(405)
    def _method(_):
        return jsonify({"error": {"code": "METHOD_NOT_ALLOWED", "message": "Metodo no permitido"}}), 405
