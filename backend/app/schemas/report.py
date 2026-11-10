from __future__ import annotations

from datetime import datetime

from pydantic import Field

from app.domain.enums import LoanStatus, ResourceType
from app.schemas.common import ApiModel


class ReportRow(ApiModel):
    id_prestamo: str
    fecha: datetime
    recurso: str
    estudiante: str
    estado: LoanStatus
    tipo_recurso: ResourceType
    id_recurso: str
    id_usuario: str
    retraso_horas: float | None = None


class ReportStats(ApiModel):
    total_prestamos: int = 0
    prestamos_con_demora: int = 0
    promedio_duracion_horas: float = 0.0
    recurso_mas_solicitado: str | None = None
    recurso_mas_solicitado_cantidad: int = 0


class ReportResponse(ApiModel):
    filas: list[ReportRow] = Field(default_factory=list)
    estadisticas: ReportStats = Field(default_factory=ReportStats)


class DashboardResponse(ApiModel):
    rol: str
    total_recursos: int = 0
    recursos_disponibles: int = 0
    recursos_en_mantenimiento: int = 0
    prestamos_activos: int = 0
    reservas_pendientes: int = 0
    entregas_pendientes: int = 0
    devoluciones_pendientes: int = 0
    sanciones_activas: int = 0
    notificaciones_no_leidas: int = 0
    mis_prestamos_activos: int = 0
