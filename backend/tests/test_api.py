from __future__ import annotations

from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

import pyotp
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import Loan


def _future(hours: int = 48) -> datetime:
    return (datetime.now(UTC) + timedelta(hours=hours)).replace(microsecond=0)


def _create_resource(
    client: TestClient,
    headers: dict[str, str],
    *,
    codigo: str,
    cantidad: int = 1,
) -> str:
    response = client.post(
        "/api/v1/resources",
        headers=headers,
        json={
            "nombre": f"Recurso {codigo}",
            "codigo_inventario": codigo,
            "tipo": "Equipo",
            "descripcion": "Recurso de prueba.",
            "cantidadTotal": cantidad,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()["data"]["idRecurso"]


def _create_loan(
    client: TestClient,
    headers: dict[str, str],
    resource_id: str,
    start: datetime,
    end: datetime,
):
    return client.post(
        "/api/v1/loans",
        headers=headers,
        json={
            "idRecurso": resource_id,
            "fechaHoraInicioProgramada": start.isoformat(),
            "fechaHoraFinProgramada": end.isoformat(),
            "motivoPrestamo": "Práctica de laboratorio de prueba.",
        },
    )


def test_health_and_login(client: TestClient) -> None:
    assert client.get("/health").json() == {"status": "ok"}

    response = client.post(
        "/api/v1/auth/login",
        json={"correo": "admin@itm.edu.co", "contrasena": "Admin123"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["requires2fa"] is False
    assert data["session"]["role"] == "Administrador_Laboratorio"

    bad = client.post(
        "/api/v1/auth/login",
        json={"correo": "admin@itm.edu.co", "contrasena": "incorrecta"},
    )
    assert bad.status_code == 401
    assert bad.json()["success"] is False


def test_register_and_duplicate_email(client: TestClient) -> None:
    payload = {
        "nombre": "Persona Nueva",
        "correo": "persona.nueva@itm.edu.co",
        "contrasena": "Nueva1234",
        "confirmacionContrasena": "Nueva1234",
        "cedula": "1088888888",
        "carnet": "EST-8888",
    }
    created = client.post("/api/v1/auth/register", json=payload)
    assert created.status_code == 201, created.text
    assert created.json()["data"]["correo"] == payload["correo"]
    assert created.json()["data"]["idRol"] == "Estudiante"

    duplicate = client.post("/api/v1/auth/register", json=payload)
    assert duplicate.status_code == 400

    weak = client.post(
        "/api/v1/auth/register",
        json={**payload, "correo": "otro@itm.edu.co", "contrasena": "corta"},
    )
    assert weak.status_code == 422


def test_resources_crud_and_status(
    client: TestClient,
    admin_headers: dict[str, str],
    student_headers: dict[str, str],
) -> None:
    resource_id = _create_resource(client, admin_headers, codigo="EQ-TEST-001", cantidad=3)

    duplicate = client.post(
        "/api/v1/resources",
        headers=admin_headers,
        json={
            "nombre": "Duplicado",
            "codigo_inventario": "EQ-TEST-001",
            "tipo": "Equipo",
            "cantidadTotal": 1,
        },
    )
    assert duplicate.status_code == 409

    forbidden = client.post(
        "/api/v1/resources",
        headers=student_headers,
        json={
            "nombre": "No permitido",
            "codigo_inventario": "EQ-TEST-002",
            "tipo": "Equipo",
            "cantidadTotal": 1,
        },
    )
    assert forbidden.status_code == 403

    status = client.patch(
        f"/api/v1/resources/{resource_id}/status",
        headers=admin_headers,
        json={"nuevoEstado": "En_Mantenimiento", "motivo": "Revisión."},
    )
    assert status.status_code == 200, status.text
    assert status.json()["data"]["estadoActual"] == "En_Mantenimiento"

    invalid = client.patch(
        f"/api/v1/resources/{resource_id}/status",
        headers=admin_headers,
        json={"nuevoEstado": "En_Préstamo"},
    )
    assert invalid.status_code == 400

    history = client.get(
        f"/api/v1/resources/{resource_id}/history",
        headers=admin_headers,
    )
    assert history.status_code == 200
    assert len(history.json()["data"]) >= 2


def test_loan_delivery_return_and_sanction(
    client: TestClient,
    db_session: Session,
    admin_headers: dict[str, str],
    tech_headers: dict[str, str],
    student_headers: dict[str, str],
) -> None:
    resource_id = _create_resource(client, admin_headers, codigo="EQ-LOAN-001", cantidad=1)
    start = _future(48)
    end = start + timedelta(hours=2)

    created = _create_loan(client, student_headers, resource_id, start, end)
    assert created.status_code == 201, created.text
    loan_id = created.json()["data"]["idPrestamo"]

    overlap = _create_loan(client, student_headers, resource_id, start, end)
    assert overlap.status_code == 409

    delivery = client.post(
        f"/api/v1/loans/{loan_id}/delivery",
        headers=tech_headers,
        json={"condicion": "Bueno"},
    )
    assert delivery.status_code == 200, delivery.text
    assert delivery.json()["data"]["estadoPrestamo"] == "En_Préstamo"

    loan = db_session.get(Loan, loan_id)
    assert loan is not None
    now = datetime.now(UTC)
    loan.fecha_hora_inicio_programada = now - timedelta(hours=32)
    loan.fecha_hora_fin_programada = now - timedelta(hours=30)
    db_session.flush()

    returned = client.post(
        f"/api/v1/loans/{loan_id}/return",
        headers=tech_headers,
        json={"condicion": "Bueno"},
    )
    assert returned.status_code == 200, returned.text
    assert returned.json()["data"]["estadoPrestamo"] == "Devuelto"

    sanctions = client.get("/api/v1/sanctions/me", headers=student_headers)
    assert sanctions.status_code == 200
    assert len(sanctions.json()["data"]) == 1
    assert sanctions.json()["data"][0]["estado"] == "Activa"


def test_cancel_respects_two_hour_rule(
    client: TestClient,
    admin_headers: dict[str, str],
    student_headers: dict[str, str],
) -> None:
    resource_id = _create_resource(client, admin_headers, codigo="EQ-CANCEL-001", cantidad=2)

    soon = _future(1)
    too_late = _create_loan(client, student_headers, resource_id, soon, soon + timedelta(hours=2))
    assert too_late.status_code == 201
    blocked = client.post(
        f"/api/v1/loans/{too_late.json()['data']['idPrestamo']}/cancel",
        headers=student_headers,
    )
    assert blocked.status_code == 400

    later = _future(5)
    cancellable = _create_loan(
        client,
        student_headers,
        resource_id,
        later,
        later + timedelta(hours=2),
    )
    assert cancellable.status_code == 201
    cancelled = client.post(
        f"/api/v1/loans/{cancellable.json()['data']['idPrestamo']}/cancel",
        headers=student_headers,
    )
    assert cancelled.status_code == 200, cancelled.text
    assert cancelled.json()["data"][0]["estadoPrestamo"] == "Cancelado"


def test_recurring_loans(
    client: TestClient,
    admin_headers: dict[str, str],
    student_headers: dict[str, str],
) -> None:
    resource_id = _create_resource(client, admin_headers, codigo="EQ-REC-001", cantidad=10)
    start = _future(24).date()
    response = client.post(
        "/api/v1/loans/recurring",
        headers=student_headers,
        json={
            "idRecurso": resource_id,
            "diasSemana": [1, 3, 5],
            "horaInicio": "08:00:00",
            "horaFin": "10:00:00",
            "fechaInicio": start.isoformat(),
            "fechaFin": (start + timedelta(days=14)).isoformat(),
            "motivoPrestamo": "Laboratorio recurrente de prueba.",
            "crearSoloDisponibles": True,
        },
    )
    assert response.status_code == 201, response.text
    data = response.json()["data"]
    assert len(data["prestamos"]) > 0
    assert data["serie"]["idRecurso"] == resource_id


def test_csv_export_and_import(
    client: TestClient,
    admin_headers: dict[str, str],
) -> None:
    exported = client.get("/api/v1/resources/export/csv", headers=admin_headers)
    assert exported.status_code == 200
    assert "codigo_inventario" in exported.text

    content = (
        "nombre,codigo_inventario,tipo,descripcion,cantidad_total,"
        "cantidad_disponible,estado_actual\n"
        "Importado CSV,EQ-IMP-001,Equipo,Recurso importado,2,2,Disponible\n"
    )
    preview = client.post(
        "/api/v1/resources/import",
        headers=admin_headers,
        files={"archivo": ("recursos.csv", content, "text/csv")},
        data={"confirmar": "false"},
    )
    assert preview.status_code == 200, preview.text
    assert preview.json()["data"]["confirmado"] is False
    assert preview.json()["data"]["filasValidas"] == 1

    confirmed = client.post(
        "/api/v1/resources/import",
        headers=admin_headers,
        files={"archivo": ("recursos.csv", content, "text/csv")},
        data={"confirmar": "true"},
    )
    assert confirmed.status_code == 200, confirmed.text
    assert confirmed.json()["data"]["creados"] == 1

    invalid = client.post(
        "/api/v1/resources/import",
        headers=admin_headers,
        files={
            "archivo": (
                "malo.csv",
                "nombre,codigo_inventario,tipo,cantidad_total\nSin cantidad,EQ-X,Equipo,\n",
                "text/csv",
            )
        },
        data={"confirmar": "false"},
    )
    assert invalid.status_code == 200
    assert len(invalid.json()["data"]["errores"]) == 1


def test_reports_and_dashboard(
    client: TestClient,
    admin_headers: dict[str, str],
    student_headers: dict[str, str],
) -> None:
    dashboard = client.get("/api/v1/dashboard", headers=admin_headers)
    assert dashboard.status_code == 200
    assert dashboard.json()["data"]["totalRecursos"] > 0

    report = client.get("/api/v1/reports/loans", headers=admin_headers)
    assert report.status_code == 200
    assert "estadisticas" in report.json()["data"]

    forbidden = client.get("/api/v1/reports/loans", headers=student_headers)
    assert forbidden.status_code == 403

    csv_report = client.get("/api/v1/reports/loans/csv", headers=admin_headers)
    assert csv_report.status_code == 200
    assert "id_prestamo" in csv_report.text


def test_password_reset_flow(client: TestClient) -> None:
    request = client.post(
        "/api/v1/auth/password-reset/request",
        json={"correo": "estudiante@itm.edu.co"},
    )
    assert request.status_code == 200
    token = request.json()["data"]["resetToken"]
    assert token

    confirm = client.post(
        "/api/v1/auth/password-reset/confirm",
        json={
            "token": token,
            "nuevaContrasena": "NuevaClave123",
            "confirmacionContrasena": "NuevaClave123",
        },
    )
    assert confirm.status_code == 200, confirm.text

    login = client.post(
        "/api/v1/auth/login",
        json={"correo": "estudiante@itm.edu.co", "contrasena": "NuevaClave123"},
    )
    assert login.status_code == 200


def test_two_factor_flow(
    client: TestClient,
    student_headers: dict[str, str],
) -> None:
    setup = client.post("/api/v1/auth/2fa/setup", headers=student_headers)
    assert setup.status_code == 200, setup.text
    secret = setup.json()["data"]["secret"]

    enable = client.post(
        "/api/v1/auth/2fa/enable",
        headers=student_headers,
        json={"codigo": pyotp.TOTP(secret).now()},
    )
    assert enable.status_code == 200, enable.text

    challenge = client.post(
        "/api/v1/auth/login",
        json={"correo": "estudiante@itm.edu.co", "contrasena": "Estudiante123"},
    )
    assert challenge.status_code == 200
    data = challenge.json()["data"]
    assert data["requires2fa"] is True

    verified = client.post(
        "/api/v1/auth/2fa/verify",
        json={
            "challengeToken": data["challengeToken"],
            "codigo": pyotp.TOTP(secret).now(),
        },
    )
    assert verified.status_code == 200, verified.text
    assert verified.json()["data"]["token"]

    disable = client.post(
        "/api/v1/auth/2fa/disable",
        headers=student_headers,
        json={"contrasena": "Estudiante123"},
    )
    assert disable.status_code == 200, disable.text


def test_student_cannot_access_other_loans(
    client: TestClient,
    admin_headers: dict[str, str],
    student_headers: dict[str, str],
) -> None:
    resource_id = _create_resource(client, admin_headers, codigo="EQ-PRIV-001", cantidad=1)
    start = _future(72)
    created = _create_loan(client, student_headers, resource_id, start, start + timedelta(hours=1))
    assert created.status_code == 201
    loan_id = created.json()["data"]["idPrestamo"]

    other = client.post(
        "/api/v1/auth/register",
        json={
            "nombre": "Otra Persona",
            "correo": "otra.persona@itm.edu.co",
            "contrasena": "Otra12345",
            "confirmacionContrasena": "Otra12345",
            "cedula": "1077777777",
        },
    )
    assert other.status_code == 201
    other_login = client.post(
        "/api/v1/auth/login",
        json={"correo": "otra.persona@itm.edu.co", "contrasena": "Otra12345"},
    )
    other_headers = {"Authorization": f"Bearer {other_login.json()['data']['token']}"}

    forbidden = client.get(f"/api/v1/loans/{loan_id}", headers=other_headers)
    assert forbidden.status_code == 403


@pytest.mark.parametrize("path", ["/api/v1/auth/me", "/api/v1/resources"])
def test_protected_endpoints_require_token(client: TestClient, path: str) -> None:
    response = client.get(path)
    assert response.status_code == 401


def test_docente_can_request_and_only_sees_own_loans(
    client: TestClient,
    admin_headers: dict[str, str],
) -> None:
    login = client.post(
        "/api/v1/auth/login",
        json={"correo": "docente@itm.edu.co", "contrasena": "Docente123"},
    )
    assert login.status_code == 200, login.text
    assert login.json()["data"]["session"]["role"] == "Docente"
    docente_headers = {"Authorization": f"Bearer {login.json()['data']['token']}"}

    resource_id = _create_resource(client, admin_headers, codigo="EQ-DOC-001", cantidad=2)
    start = _future(36)
    created = _create_loan(
        client,
        docente_headers,
        resource_id,
        start,
        start + timedelta(hours=2),
    )
    assert created.status_code == 201, created.text

    own = client.get("/api/v1/loans", headers=docente_headers)
    assert own.status_code == 200
    docente_id = login.json()["data"]["session"]["userId"]
    assert all(row["idUsuario"] == docente_id for row in own.json()["data"])

    forbidden = client.get("/api/v1/resources/export/csv", headers=docente_headers)
    assert forbidden.status_code == 403


def test_registration_ignores_requested_role(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "nombre": "Intento Admin",
            "correo": "intento.admin@itm.edu.co",
            "contrasena": "Segura123",
            "confirmacionContrasena": "Segura123",
            "idRol": "Administrador_Laboratorio",
            "cedula": "1099999999",
        },
    )
    assert response.status_code == 201, response.text
    assert response.json()["data"]["idRol"] == "Estudiante"


def test_active_loan_limit(
    client: TestClient,
    admin_headers: dict[str, str],
    student_headers: dict[str, str],
) -> None:
    start = _future(60)
    end = start + timedelta(hours=1)
    for index in range(3):
        resource_id = _create_resource(
            client,
            admin_headers,
            codigo=f"EQ-LIMIT-{index}",
            cantidad=1,
        )
        response = _create_loan(client, student_headers, resource_id, start, end)
        assert response.status_code == 201, response.text

    extra_resource = _create_resource(client, admin_headers, codigo="EQ-LIMIT-3", cantidad=1)
    blocked = _create_loan(client, student_headers, extra_resource, start, end)
    assert blocked.status_code == 409
    assert "3" in blocked.json()["error"]


def test_operating_hours_are_enforced(
    client: TestClient,
    admin_headers: dict[str, str],
    student_headers: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    settings = get_settings()
    monkeypatch.setattr(settings, "lab_timezone", "America/Bogota")
    monkeypatch.setattr(settings, "lab_open_hour", 7)
    monkeypatch.setattr(settings, "lab_close_hour", 20)

    resource_id = _create_resource(client, admin_headers, codigo="EQ-HOUR-001", cantidad=2)
    local_tz = ZoneInfo("America/Bogota")
    future_day = (datetime.now(local_tz) + timedelta(days=3)).date()

    late_start = datetime.combine(future_day, datetime.min.time(), tzinfo=local_tz).replace(
        hour=22
    )
    late = _create_loan(
        client,
        student_headers,
        resource_id,
        late_start.astimezone(UTC),
        (late_start + timedelta(hours=1)).astimezone(UTC),
    )
    assert late.status_code == 400
    assert "07:00" in late.json()["error"]

    valid_start = datetime.combine(future_day, datetime.min.time(), tzinfo=local_tz).replace(
        hour=9
    )
    valid = _create_loan(
        client,
        student_headers,
        resource_id,
        valid_start.astimezone(UTC),
        (valid_start + timedelta(hours=2)).astimezone(UTC),
    )
    assert valid.status_code == 201, valid.text


def test_calendar_and_availability(
    client: TestClient,
    admin_headers: dict[str, str],
    student_headers: dict[str, str],
) -> None:
    resource_id = _create_resource(client, admin_headers, codigo="EQ-CAL-001", cantidad=1)
    start = _future(72)
    end = start + timedelta(hours=2)
    created = _create_loan(client, student_headers, resource_id, start, end)
    assert created.status_code == 201, created.text

    availability = client.get(
        "/api/v1/resources/availability",
        headers=student_headers,
        params={"inicio": start.isoformat(), "fin": end.isoformat()},
    )
    assert availability.status_code == 200, availability.text
    row = next(
        item for item in availability.json()["data"] if item["idRecurso"] == resource_id
    )
    assert row["disponible"] is False
    assert row["reservasActivas"] == 1

    calendar = client.get(
        f"/api/v1/resources/{resource_id}/calendar",
        headers=student_headers,
        params={"desde": start.date().isoformat(), "hasta": start.date().isoformat()},
    )
    assert calendar.status_code == 200, calendar.text
    day = calendar.json()["data"]["dias"][0]
    assert day["fecha"] == start.date().isoformat()
    assert len(day["reservas"]) == 1
    assert day["reservas"][0]["propio"] is True
    assert day["reservas"][0]["usuario"] is None
    assert len(day["franjas"]) == 24
    assert any(slot["disponible"] is False for slot in day["franjas"])


def test_report_pdf_filter_and_range(
    client: TestClient,
    admin_headers: dict[str, str],
    student_headers: dict[str, str],
) -> None:
    me = client.get("/api/v1/auth/me", headers=student_headers)
    student_id = me.json()["data"]["idUsuario"]

    filtered = client.get(
        "/api/v1/reports/loans",
        headers=admin_headers,
        params={"idUsuario": student_id},
    )
    assert filtered.status_code == 200, filtered.text
    assert all(
        row["idUsuario"] == student_id for row in filtered.json()["data"]["filas"]
    )

    pdf = client.get("/api/v1/reports/loans/pdf", headers=admin_headers)
    assert pdf.status_code == 200, pdf.text
    assert pdf.headers["content-type"].startswith("application/pdf")
    assert pdf.content.startswith(b"%PDF")
    assert len(pdf.content) > 1000

    too_long = client.get(
        "/api/v1/reports/loans",
        headers=admin_headers,
        params={
            "desde": "2024-01-01T00:00:00Z",
            "hasta": "2026-01-02T00:00:00Z",
        },
    )
    assert too_long.status_code == 400
