from datetime import datetime

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.domain.enums import (
    LoanStatus,
    ResourceCondition,
    ResourceStatus,
    ResourceType,
    UserRole,
)
from app.models import Loan, Resource, ResourceStatusHistory, User


def _dt(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _seed_users() -> list[User]:
    return [
        User(
            id="u-admin-0001",
            role=UserRole.ADMINISTRADOR_LABORATORIO,
            nombre="Ana Admin",
            correo="admin@itm.edu.co",
            cedula="1000000001",
            contrasena_hash=hash_password("Admin123"),
            fecha_registro=_dt("2026-01-10T08:00:00.000Z"),
        ),
        User(
            id="u-tecnico-0001",
            role=UserRole.TECNICO_LABORATORIO,
            nombre="Tomás Técnico",
            correo="tecnico@itm.edu.co",
            cedula="1000000002",
            contrasena_hash=hash_password("Tecnico123"),
            fecha_registro=_dt("2026-01-11T08:00:00.000Z"),
        ),
        User(
            id="u-estudiante-0001",
            role=UserRole.ESTUDIANTE,
            nombre="Elena Estudiante",
            correo="estudiante@itm.edu.co",
            cedula="1000000003",
            carnet="EST-2026-001",
            contrasena_hash=hash_password("Estudiante123"),
            fecha_registro=_dt("2026-01-12T08:00:00.000Z"),
        ),
    ]


def _seed_resources() -> list[Resource]:
    return [
        Resource(
            id="r-0001",
            nombre="Osciloscopio Tektronix TBS1052",
            codigo_inventario="EQ-OSC-001",
            tipo=ResourceType.EQUIPO,
            descripcion="Osciloscopio digital de 2 canales, 50 MHz.",
            cantidad_total=3,
            cantidad_disponible=2,
            estado_actual=ResourceStatus.DISPONIBLE,
            fecha_creacion=_dt("2026-01-15T08:00:00.000Z"),
        ),
        Resource(
            id="r-0002",
            nombre="Multímetro Fluke 117",
            codigo_inventario="EQ-MUL-001",
            tipo=ResourceType.EQUIPO,
            descripcion="Multímetro digital true-RMS para electrónica.",
            cantidad_total=5,
            cantidad_disponible=5,
            estado_actual=ResourceStatus.DISPONIBLE,
            fecha_creacion=_dt("2026-01-15T08:10:00.000Z"),
        ),
        Resource(
            id="r-0003",
            nombre="Cautín de estación Hakko FX-888D",
            codigo_inventario="HE-CAU-001",
            tipo=ResourceType.HERRAMIENTA,
            descripcion="Estación de soldadura con control de temperatura.",
            cantidad_total=4,
            cantidad_disponible=3,
            estado_actual=ResourceStatus.DISPONIBLE,
            fecha_creacion=_dt("2026-01-15T08:20:00.000Z"),
        ),
        Resource(
            id="r-0004",
            nombre="Juego de destornilladores de precisión",
            codigo_inventario="HE-DES-001",
            tipo=ResourceType.HERRAMIENTA,
            descripcion="Kit de 32 puntas para electrónica fina.",
            cantidad_total=6,
            cantidad_disponible=6,
            estado_actual=ResourceStatus.DISPONIBLE,
            fecha_creacion=_dt("2026-01-15T08:30:00.000Z"),
        ),
        Resource(
            id="r-0005",
            nombre="Protoboard 830 puntos",
            codigo_inventario="MA-PRO-001",
            tipo=ResourceType.MATERIAL,
            descripcion="Placa de pruebas sin soldadura de 830 contactos.",
            cantidad_total=20,
            cantidad_disponible=18,
            estado_actual=ResourceStatus.DISPONIBLE,
            fecha_creacion=_dt("2026-01-15T08:40:00.000Z"),
        ),
        Resource(
            id="r-0006",
            nombre="Kit de resistencias surtidas",
            codigo_inventario="MA-RES-001",
            tipo=ResourceType.MATERIAL,
            descripcion="Caja con 600 resistencias de valores variados.",
            cantidad_total=15,
            cantidad_disponible=15,
            estado_actual=ResourceStatus.DISPONIBLE,
            fecha_creacion=_dt("2026-01-15T08:50:00.000Z"),
        ),
        Resource(
            id="r-0007",
            nombre="Fuente de poder regulable 0-30V",
            codigo_inventario="EQ-FUE-001",
            tipo=ResourceType.EQUIPO,
            descripcion="Fuente DC regulable con límite de corriente.",
            cantidad_total=2,
            cantidad_disponible=0,
            estado_actual=ResourceStatus.EN_MANTENIMIENTO,
            fecha_creacion=_dt("2026-01-15T09:00:00.000Z"),
        ),
        Resource(
            id="r-0008",
            nombre="Analizador lógico 8 canales",
            codigo_inventario="EQ-ANA-001",
            tipo=ResourceType.EQUIPO,
            descripcion="Analizador lógico USB de 8 canales.",
            cantidad_total=1,
            cantidad_disponible=1,
            estado_actual=ResourceStatus.DISPONIBLE,
            fecha_creacion=_dt("2026-01-15T09:10:00.000Z"),
        ),
    ]


def _seed_loans() -> list[Loan]:
    return [
        Loan(
            id="p-0001",
            user_id="u-estudiante-0001",
            resource_id="r-0001",
            fecha_hora_reserva=_dt("2026-02-01T10:00:00.000Z"),
            fecha_hora_inicio_programada=_dt("2026-02-05T14:00:00.000Z"),
            fecha_hora_fin_programada=_dt("2026-02-05T18:00:00.000Z"),
            estado_prestamo=LoanStatus.RESERVADO,
            motivo_prestamo="Práctica de laboratorio de señales analógicas.",
        ),
        Loan(
            id="p-0002",
            user_id="u-estudiante-0001",
            resource_id="r-0003",
            fecha_hora_reserva=_dt("2026-02-02T09:00:00.000Z"),
            fecha_hora_inicio_programada=_dt("2026-02-03T08:00:00.000Z"),
            fecha_hora_fin_programada=_dt("2026-02-03T12:00:00.000Z"),
            fecha_hora_entrega=_dt("2026-02-03T08:05:00.000Z"),
            estado_prestamo=LoanStatus.EN_PRESTAMO,
            motivo_prestamo="Soldadura de placa para proyecto de curso.",
            condicion_entrega=ResourceCondition.BUENO,
        ),
        Loan(
            id="p-0003",
            user_id="u-estudiante-0001",
            resource_id="r-0005",
            fecha_hora_reserva=_dt("2026-01-20T09:00:00.000Z"),
            fecha_hora_inicio_programada=_dt("2026-01-21T08:00:00.000Z"),
            fecha_hora_fin_programada=_dt("2026-01-21T12:00:00.000Z"),
            fecha_hora_entrega=_dt("2026-01-21T08:00:00.000Z"),
            fecha_hora_devolucion_real=_dt("2026-01-21T11:30:00.000Z"),
            estado_prestamo=LoanStatus.DEVUELTO,
            motivo_prestamo="Montaje de circuito de prueba en protoboard.",
            condicion_entrega=ResourceCondition.BUENO,
            condicion_devolucion=ResourceCondition.BUENO,
            retraso_horas=0,
        ),
        Loan(
            id="p-0004",
            user_id="u-estudiante-0001",
            resource_id="r-0007",
            fecha_hora_reserva=_dt("2026-01-18T09:00:00.000Z"),
            fecha_hora_inicio_programada=_dt("2026-01-19T08:00:00.000Z"),
            fecha_hora_fin_programada=_dt("2026-01-19T12:00:00.000Z"),
            fecha_hora_entrega=_dt("2026-01-19T08:00:00.000Z"),
            fecha_hora_devolucion_real=_dt("2026-01-19T15:00:00.000Z"),
            estado_prestamo=LoanStatus.DEVUELTO,
            motivo_prestamo="Pruebas de alimentación para circuito de potencia.",
            condicion_entrega=ResourceCondition.BUENO,
            condicion_devolucion=ResourceCondition.DANADO,
            observaciones_devolucion="Perilla de voltaje floja, requiere revisión.",
            retraso_horas=3,
        ),
        Loan(
            id="p-0005",
            user_id="u-estudiante-0001",
            resource_id="r-0002",
            fecha_hora_reserva=_dt("2026-02-04T09:00:00.000Z"),
            fecha_hora_inicio_programada=_dt("2026-02-10T14:00:00.000Z"),
            fecha_hora_fin_programada=_dt("2026-02-10T16:00:00.000Z"),
            estado_prestamo=LoanStatus.CANCELADO,
            motivo_prestamo="Medición de continuidad en práctica (cancelada).",
        ),
    ]


def _seed_status_history() -> list[ResourceStatusHistory]:
    return [
        ResourceStatusHistory(
            id="h-0001",
            resource_id="r-0007",
            estado=ResourceStatus.EN_MANTENIMIENTO,
            fecha_cambio=_dt("2026-01-19T15:05:00.000Z"),
            motivo="Devolución en condición dañada (préstamo p-0004).",
        )
    ]


def seed_database() -> None:
    with SessionLocal() as db:
        if db.scalar(select(User.id).limit(1)) is not None:
            return
        db.add_all(
            [
                *_seed_users(),
                *_seed_resources(),
                *_seed_loans(),
                *_seed_status_history(),
            ]
        )
        db.commit()


if __name__ == "__main__":
    seed_database()
    print("Datos iniciales cargados.")
