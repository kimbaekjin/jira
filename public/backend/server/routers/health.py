from fastapi import APIRouter

routes = APIRouter()

@routes.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "서버가 정상적으로 작동 중입니다."
    }
