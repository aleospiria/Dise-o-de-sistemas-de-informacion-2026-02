from fastapi import APIRouter

from app.api.v1.routers import (
    auth,
    loans,
    notifications,
    reports,
    resources,
    sanctions,
    users,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(resources.router)
api_router.include_router(loans.router)
api_router.include_router(sanctions.router)
api_router.include_router(notifications.router)
api_router.include_router(reports.router)
