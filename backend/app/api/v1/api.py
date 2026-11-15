from fastapi import APIRouter
from backend.app.api.v1.endpoints import inspections, system

api_router = APIRouter()

# Register endpoint routers
api_router.include_router(inspections.router, prefix="/inspections", tags=["Inspections"])
api_router.include_router(system.router, tags=["System & Model"])
