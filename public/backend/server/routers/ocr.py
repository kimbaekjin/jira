# yolo.py
from fastapi import APIRouter

routes = APIRouter()

@routes.get("/ocr-test")
def yolo_test():
    return {"message": "ocr OK"}
