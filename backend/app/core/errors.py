from __future__ import annotations

from typing import Any


class DomainError(Exception):
    def __init__(
        self,
        message: str,
        status_code: int = 400,
        details: Any | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details


def not_found(entity: str) -> DomainError:
    return DomainError(f"{entity} no encontrado.", 404)


def forbidden(message: str = "No tienes permisos para esta acción.") -> DomainError:
    return DomainError(message, 403)


def conflict(message: str, details: Any | None = None) -> DomainError:
    return DomainError(message, 409, details)


def bad_request(message: str, details: Any | None = None) -> DomainError:
    return DomainError(message, 400, details)


def unauthorized(message: str = "No autenticado.") -> DomainError:
    return DomainError(message, 401)
