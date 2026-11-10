from __future__ import annotations

import os

os.environ["DATABASE_URL"] = (
    "postgresql+psycopg://prestamos_app:prestamos_dev_password@localhost:5433/prestamos_lab_test"
)
os.environ["TEST_DATABASE_URL"] = os.environ["DATABASE_URL"]
os.environ["JWT_SECRET"] = "test-secret-sistema-prestamos-laboratorio-2026"
os.environ["EXPOSE_RESET_TOKEN"] = "true"
os.environ["SEED_ON_STARTUP"] = "false"

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.seed import seed_database
from app.db.session import engine, get_db
from app.main import app


@pytest.fixture(scope="session", autouse=True)
def database() -> Generator[None, None, None]:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, expire_on_commit=False)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def auth_headers(client: TestClient, correo: str, contrasena: str) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/login",
        json={"correo": correo, "contrasena": contrasena},
    )
    assert response.status_code == 200, response.text
    token = response.json()["data"]["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def admin_headers(client: TestClient) -> dict[str, str]:
    return auth_headers(client, "admin@itm.edu.co", "Admin123")


@pytest.fixture()
def tech_headers(client: TestClient) -> dict[str, str]:
    return auth_headers(client, "tecnico@itm.edu.co", "Tecnico123")


@pytest.fixture()
def student_headers(client: TestClient) -> dict[str, str]:
    return auth_headers(client, "estudiante@itm.edu.co", "Estudiante123")
