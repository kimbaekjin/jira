from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.routers import router as api_router
from uvicorn import run

def create_app():
    app = FastAPI(
        title="RegressionTC",
        description="Naver Map Automation - OCR, YOLO, DB API",
        version="1.0.0"
    )

    # CORS 설정
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # 모든 도메인 허용
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # API Router 포함
    app.include_router(api_router)
    return app

app = create_app()

# ------------------------------
# uvicorn 서버를 직접 실행 가능하게
# ------------------------------
if __name__ == "__main__":
    # host 0.0.0.0 → LAN 내 다른 기기 접근 허용
    # port 8000 → 원하는 포트
    run("main:app", host="0.0.0.0", port=8000, reload=True)
