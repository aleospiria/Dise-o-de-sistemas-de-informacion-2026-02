from __future__ import annotations

from typing import Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

from app.domain.validators import to_camel

T = TypeVar("T")


class ApiModel(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=to_camel,
        str_strip_whitespace=True,
    )


class Envelope(ApiModel, Generic[T]):
    success: bool = True
    data: T | None = None
    error: str | None = None
    details: Any | None = None


class ErrorEnvelope(ApiModel):
    success: bool = False
    data: None = None
    error: str
    details: Any | None = None


class MessageResponse(ApiModel):
    message: str


class Page(ApiModel, Generic[T]):
    items: list[T] = Field(default_factory=list)
    total: int = 0


def ok(data: T) -> Envelope[T]:
    return Envelope[T](success=True, data=data)
