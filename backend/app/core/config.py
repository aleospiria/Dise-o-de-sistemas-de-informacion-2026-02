from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Sistema de Préstamos de Recursos de Laboratorio"
    api_v1_prefix: str = "/api/v1"
    environment: str = Field(default="development", alias="ENVIRONMENT")
    database_url: str = Field(..., alias="DATABASE_URL")
    test_database_url: str | None = Field(default=None, alias="TEST_DATABASE_URL")
    jwt_secret: str = Field(..., alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=480, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    cors_origins: str = Field(default="http://localhost:5173", alias="CORS_ORIGINS")
    frontend_url: str = Field(default="http://localhost:5173", alias="FRONTEND_URL")
    seed_on_startup: bool = Field(default=False, alias="SEED_ON_STARTUP")
    expose_reset_token: bool = Field(default=True, alias="EXPOSE_RESET_TOKEN")
    password_reset_expire_minutes: int = Field(default=60, alias="PASSWORD_RESET_EXPIRE_MINUTES")
    two_factor_challenge_minutes: int = Field(default=5, alias="TWO_FACTOR_CHALLENGE_MINUTES")
    two_factor_max_attempts: int = Field(default=3, alias="TWO_FACTOR_MAX_ATTEMPTS")
    two_factor_lock_minutes: int = Field(default=15, alias="TWO_FACTOR_LOCK_MINUTES")
    lab_timezone: str = Field(default="America/Bogota", alias="LAB_TIMEZONE")
    lab_open_hour: int = Field(default=7, ge=0, le=23, alias="LAB_OPEN_HOUR")
    lab_close_hour: int = Field(default=20, ge=1, le=24, alias="LAB_CLOSE_HOUR")
    max_active_loans: int = Field(default=3, ge=1, alias="MAX_ACTIVE_LOANS")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        populate_by_name=True,
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
