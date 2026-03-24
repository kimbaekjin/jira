# server/routers/yolo.py
from fastapi import APIRouter
import requests
import json

routes = APIRouter()

@routes.get("/yolo-test")
def yolo_test():
    return {"message": "YOLO OK"}
    