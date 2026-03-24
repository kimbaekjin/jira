from fastapi import APIRouter
from .yolo import routes as yolo_router
from .health import routes as health_router
from .ocr import routes as ocr_router
from .db import routes as db_router

router = APIRouter()
router.include_router(yolo_router)
router.include_router(health_router)
router.include_router(ocr_router)
router.include_router(db_router)