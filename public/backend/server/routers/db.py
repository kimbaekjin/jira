from fastapi import APIRouter
from .common.database import get_db_connection

routes = APIRouter()

@routes.get("/test-db")
def test_db():
    conn = get_db_connection()
    if conn:
        cur = conn.cursor()
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public';")
        tables = cur.fetchall()
        conn.close()
        return {"tables": tables}
    else:
        return {"error": "DB 연결 실패"}