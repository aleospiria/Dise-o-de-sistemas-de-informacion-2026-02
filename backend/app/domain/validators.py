from __future__ import annotations

from datetime import UTC, datetime, timedelta

MS_PER_HOUR = 1000 * 60 * 60
MIN_LOAN_HOURS = 1
MAX_LOAN_HOURS = 24
MAX_PASSWORD_BYTES = 72


def ensure_aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def now_utc() -> datetime:
    return datetime.now(UTC)


def validate_password(value: str) -> bool:
    if len(value) < 8 or len(value.encode("utf-8")) > MAX_PASSWORD_BYTES:
        return False
    has_upper = any(char.isupper() for char in value)
    has_lower = any(char.islower() for char in value)
    has_digit = any(char.isdigit() for char in value)
    return has_upper and has_lower and has_digit


def validate_email(value: str) -> bool:
    if value.count("@") != 1:
        return False
    local, domain = value.split("@")
    return bool(local) and "." in domain and not domain.startswith(".") and not domain.endswith(".")


def validate_loan_times(
    start: datetime,
    end: datetime,
    reference: datetime | None = None,
) -> str | None:
    start = ensure_aware(start)
    end = ensure_aware(end)
    reference = ensure_aware(reference) if reference else now_utc()
    if start < reference:
        return "La fecha de inicio no puede estar en el pasado."
    duration = (end - start) / timedelta(hours=1)
    if duration < MIN_LOAN_HOURS:
        return "La duración mínima del préstamo es de 1 hora."
    if duration > MAX_LOAN_HOURS:
        return "La duración máxima del préstamo es de 24 horas."
    return None


def validate_motivo(value: str) -> bool:
    length = len(value.strip())
    return 10 <= length <= 500


def validate_resource_name(value: str) -> bool:
    length = len(value.strip())
    return 0 < length <= 100


def validate_quantity(value: int) -> bool:
    return isinstance(value, int) and value > 0


def validate_observaciones(value: str | None) -> bool:
    return value is None or len(value) <= 500


def calculate_delay_hours(real_return: datetime, scheduled_end: datetime) -> float:
    diff = ensure_aware(real_return) - ensure_aware(scheduled_end)
    hours = diff.total_seconds() / 3600
    return max(0.0, round(hours, 4))


def intervals_overlap(
    start_a: datetime,
    end_a: datetime,
    start_b: datetime,
    end_b: datetime,
) -> bool:
    return ensure_aware(start_a) < ensure_aware(end_b) and ensure_aware(start_b) < ensure_aware(
        end_a
    )


def to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(word.capitalize() for word in rest)
